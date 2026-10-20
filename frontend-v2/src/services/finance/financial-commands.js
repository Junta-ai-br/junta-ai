import { getSessionSnapshot, subscribeSession } from "../auth/session";
import * as transactionApi from "../transactions.api";
import * as categoryApi from "../categories.api";
import { CATEGORY_TYPES, FinancialContractError, isCategory, isCategoryName, isTransaction, isUuid } from "../financial-contracts";
import { prepareTransactionRequest } from "./transaction-adapter";
import { createFinancialLoader } from "./financial-loader";

const freeze = Object.freeze;
const result = (operation, status, fields = {}) => freeze({ operation, status, ...fields });
const invalid = () => new FinancialContractError("Invalid command request.", "ERR_API_REQUEST");
const successful = (view) => ["success", "empty"].includes(view.status);

function requestBody(operation, body) {
  if (operation.endsWith("Transaction")) return freeze(prepareTransactionRequest(body));
  if (!isCategoryName(body?.name) || !CATEGORY_TYPES.includes(body?.type)) throw invalid();
  return freeze({ name: body.name, type: body.type });
}

// Preserve only documented backend error fields, never Axios config/request/tokens.
function httpError(error) {
  const body = error.response?.data;
  const campos = body?.campos && typeof body.campos === "object"
    ? Object.fromEntries(Object.entries(body.campos).filter(([key, value]) =>
      ["categoryId", "type", "description", "amount", "transactionDate", "name"].includes(key) && typeof value === "string")) : null;
  return freeze({ kind: "http", status: error.response.status,
    ...(typeof body?.mensagem === "string" ? { mensagem: body.mensagem } : {}),
    ...(campos ? { campos: freeze(campos) } : {}),
  });
}

function failure(operation, error, beforeSend = false) {
  if (error?.response) {
    // Generic 5xx/proxy failures do not prove rollback of a write.
    return result(operation, error.response.status >= 500 ? "indeterminate" : "error", { error: httpError(error) });
  }
  if (beforeSend || error?.code === "ERR_API_REQUEST") {
    return result(operation, "error", { error: freeze({ kind: "validation", code: error.code }) });
  }
  if (["API_UNAVAILABLE", "SESSION_EXPIRED", "SESSION_CHANGED"].includes(error?.code)) {
    return result(operation, "error", { error: freeze({ kind: "unavailable", code: error.code }) });
  }
  return result(operation, "indeterminate", { error: freeze({ kind:
    ["ERR_API_RESPONSE", "ERR_MONEY_PRECISION"].includes(error?.code) ? "invalid_response" : "transport" }) });
}

/** One owner per future provider: FIFO writes + full reload, without optimistic mutation. */
export function createFinancialCommands({ loader = createFinancialLoader(), services = {} } = {}) {
  const writes = { createTransaction: transactionApi.createTransaction, updateTransaction: transactionApi.updateTransaction,
    deleteTransaction: transactionApi.deleteTransaction, createCategory: categoryApi.createCategory,
    updateCategory: categoryApi.updateCategory, deleteCategory: categoryApi.deleteCategory, ...services };
  const listeners = new Set();
  let owner = getSessionSnapshot()?.generation ?? null;
  let jobs = new Set();
  let tail = Promise.resolve();
  let latestIntent;
  let submissionIntent;
  let loadIntent;
  let lastResult = null;
  let refreshRequired = false;
  let revision = Symbol();
  let cached;
  let disposed = false;
  const disposedView = freeze({ status: "cancelled", period: null, data: null, error: null });
  const disposedSnapshot = freeze({ pending: 0, lastResult: null, refreshRequired: false, view: disposedView });

  function syncSession() {
    if (disposed) return null;
    const session = getSessionSnapshot();
    if ((session?.generation ?? null) !== owner) {
      owner = session?.generation ?? null;
      const obsolete = jobs;
      jobs = new Set();
      tail = Promise.resolve();
      latestIntent = Symbol();
      revision = Symbol();
      lastResult = null;
      refreshRequired = false;
      cached = undefined;
      // State and queue are detached before synchronous abort callbacks.
      obsolete.forEach((job) => job.controller.abort());
    }
    return disposed ? null : getSessionSnapshot();
  }

  function current(job) {
    return !disposed && syncSession()?.generation === job.generation;
  }

  function getSnapshot() {
    if (disposed) return disposedSnapshot;
    syncSession();
    const view = loader.getSnapshot();
    if (disposed) return disposedSnapshot;
    if (!cached || cached.pending !== jobs.size || cached.lastResult !== lastResult
      || cached.refreshRequired !== refreshRequired || cached.view !== view) {
      cached = freeze({ pending: jobs.size, lastResult, refreshRequired, view });
    }
    return cached;
  }

  function emit() {
    const published = getSnapshot();
    for (const listener of [...listeners]) {
      if (disposed || getSnapshot() !== published) break;
      if (listeners.has(listener)) listener();
    }
  }
  const offLoader = loader.subscribe(() => { syncSession(); emit(); });
  const offSession = subscribeSession(() => { syncSession(); emit(); });
  const obsoleteResult = (job) => result(job.operation, disposed ? "cancelled" : "stale");

  async function load(period) {
    if (disposed) return disposedView;
    const intent = Symbol();
    loadIntent = intent;
    const session = syncSession();
    const stale = (loaded, code) => freeze({ status: "stale", period: loaded?.period ?? null,
      data: null, error: freeze({ code }) });
    if (disposed) return disposedView;
    if (loadIntent !== intent) return stale(null, "LOAD_SUPERSEDED");
    const startedRevision = revision;
    const loaded = await loader.load(period);
    const finalResult = () => {
      if (disposed) return disposedView;
      syncSession();
      if (disposed) return disposedView;
      const view = loader.getSnapshot();
      // Both reads above may execute synchronous abort callbacks. Recheck last.
      if (disposed) return disposedView;
      if (getSessionSnapshot()?.generation !== session?.generation) return stale(loaded, "STALE_SESSION");
      if (loadIntent !== intent || (successful(loaded) && view !== loaded)) return stale(loaded, "LOAD_SUPERSEDED");
      return loaded;
    };
    const checked = finalResult();
    if (checked !== loaded) return checked;
    if (revision === startedRevision
      && successful(loaded) && loader.getSnapshot() === loaded) {
      refreshRequired = false;
      emit();
    }
    // emit() can establish a new session or request another period (even the same
    // dates). Never hand its caller financial data whose authority was lost there.
    return finalResult();
  }

  async function refresh(job) {
    if (!current(job)) return null;
    const period = loader.getSnapshot().period;
    if (!current(job)) return null;
    if (!period) return freeze({ status: "required", reason: "NO_PERIOD" });
    const loaded = await load(period);
    if (!current(job)) return null;
    if (successful(loaded) && loader.getSnapshot() === loaded) return freeze({ status: "synced" });
    return freeze({ status: loaded.status === "error" ? "error" : "required",
      ...(loaded.error ? { error: loaded.error } : {}) });
  }

  async function execute(job) {
    if (!current(job)) return obsoleteResult(job);
    let completed;
    try {
      const options = { signal: job.controller.signal, sessionGeneration: job.generation };
      const args = job.operation.startsWith("delete") ? [job.id, options]
        : job.operation.startsWith("update") ? [job.id, job.body, options] : [job.body, options];
      if (!current(job)) return obsoleteResult(job);
      const response = await writes[job.operation](...args);
      if (!current(job)) return obsoleteResult(job);
      if (!job.operation.startsWith("delete")) {
        const valid = job.operation.endsWith("Transaction") ? isTransaction(response) : isCategory(response);
        if (!valid || (job.id && response.id.toLowerCase() !== job.id.toLowerCase())) {
          throw new FinancialContractError("Unexpected mutation response.");
        }
      }
      revision = Symbol();
      refreshRequired = true;
      // Only the loader publishes collections, after all pages have completed.
      let synchronization;
      try { synchronization = await refresh(job); }
      catch { synchronization = freeze({ status: "error", error: freeze({ code: "REFRESH_FAILED" }) }); }
      if (!current(job)) return obsoleteResult(job);
      completed = result(job.operation, "confirmed", { id: job.id ?? response.id, refresh: synchronization });
    } catch (error) {
      if (!current(job)) return obsoleteResult(job);
      completed = failure(job.operation, error);
      if (completed.status === "indeterminate") {
        revision = Symbol();
        refreshRequired = true;
        // Supersede reads started before the uncertain write outcome.
        loader.cancel();
      }
    } finally {
      jobs.delete(job);
    }
    if (!current(job)) return obsoleteResult(job);
    if (latestIntent === job.intent) lastResult = completed;
    emit();
    return current(job) ? completed : obsoleteResult(job);
  }

  function submit(operation, id, body) {
    if (disposed) return Promise.resolve(result(operation, "cancelled"));
    const intent = Symbol();
    submissionIntent = intent;
    const session = syncSession();
    if (disposed) return Promise.resolve(result(operation, "cancelled"));
    if (submissionIntent !== intent) return Promise.resolve(result(operation, "stale"));
    latestIntent = intent;
    if (!session) return Promise.resolve(result(operation, "stale"));
    const job = { operation, id, intent, generation: session.generation, controller: new AbortController() };
    try {
      if (!operation.startsWith("create") && !isUuid(id)) throw invalid();
      if (!operation.startsWith("delete")) job.body = requestBody(operation, body);
    } catch (error) {
      const rejected = failure(operation, error, true);
      if (current(job) && latestIntent === intent) { lastResult = rejected; emit(); }
      return Promise.resolve(current(job) ? rejected : obsoleteResult(job));
    }
    if (!current(job) || submissionIntent !== intent) return Promise.resolve(obsoleteResult(job));
    jobs.add(job);
    const pending = tail.then(() => execute(job));
    // A programming error must not break scheduling of subsequent independent commands.
    tail = pending.then(() => undefined, () => undefined);
    emit();
    return pending;
  }

  return freeze({ load, getSnapshot,
    subscribe(listener) { if (!disposed) listeners.add(listener); return () => listeners.delete(listener); },
    createTransaction: (body) => submit("createTransaction", undefined, body),
    updateTransaction: (id, body) => submit("updateTransaction", id, body),
    deleteTransaction: (id) => submit("deleteTransaction", id),
    createCategory: (body) => submit("createCategory", undefined, body),
    updateCategory: (id, body) => submit("updateCategory", id, body),
    deleteCategory: (id) => submit("deleteCategory", id),
    dispose() {
      if (disposed) return;
      disposed = true;
      cached = disposedSnapshot;
      lastResult = null;
      const obsolete = jobs;
      jobs = new Set();
      listeners.clear();
      offSession();
      offLoader();
      loader.dispose();
      obsolete.forEach((job) => job.controller.abort());
    },
  });
}
