import { getSessionSnapshot, subscribeSession } from "../auth/session";
import { listCategories } from "../categories.api";
import { listTransactions } from "../transactions.api";
import { isCategory } from "../financial-contracts";
import { summarizeExact } from "./exact-aggregates";
import { FinancialLoadError, loadTransactionPages, requirePeriod } from "./financial-load";

const snapshot = (status, period = null, data = null, error = null) => Object.freeze({ status, period, data, error });
const publicError = (code, status) => Object.freeze({ code, ...(status ? { status } : {}) });

function classify(error) {
  if (error instanceof FinancialLoadError) return publicError(error.code);
  if (["ERR_API_RESPONSE", "ERR_MONEY_PRECISION"].includes(error?.code)) return publicError("INVALID_RESPONSE");
  if (error?.response) return publicError("HTTP_ERROR", error.response.status);
  if (["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(error?.code) || error?.request) return publicError("NETWORK_ERROR");
  if (error?.code === "SESSION_EXPIRED") return publicError("SESSION_INVALID");
  if (error?.code === "API_UNAVAILABLE") return publicError("API_UNAVAILABLE");
  return publicError("LOAD_FAILED");
}

/** One instance per future owner/provider. No global cache, storage fallback or automatic retry. */
export function createFinancialLoader({ pageSize = 100, maxPages = 1000, maxRecords = 100000,
  fetchCategories = listCategories, fetchTransactions = listTransactions } = {}) {
  if (![pageSize, maxPages, maxRecords].every((value) => Number.isSafeInteger(value) && value > 0)
    || pageSize > 2000 || maxPages > 1000 || maxRecords > 100000) throw new FinancialLoadError("INVALID_LIMITS");
  const listeners = new Set();
  let state = snapshot("idle");
  let owner = getSessionSnapshot()?.generation ?? null;
  let operation = null;
  let intent = Symbol();
  let disposed = false;
  let expiryTimer;
  let expiryDeadline;
  function emit() {
    const published = state;
    const publicationIntent = intent;
    for (const listener of [...listeners]) {
      if (disposed || state !== published || intent !== publicationIntent) break;
      if (listeners.has(listener)) listener();
    }
  }

  function invalidate(reason) {
    if (operation) {
      const old = operation;
      operation = null;
      old.reason = reason;
      old.controller.abort();
    }
  }

  function observeSession(notify = true) {
    if (disposed) return null;
    const session = getSessionSnapshot();
    const nextOwner = session?.generation ?? null;
    const changed = nextOwner !== owner;
    if (changed) {
      owner = nextOwner;
      state = snapshot(session ? "idle" : "stale");
    }
    if (expiryDeadline !== session?.expiresAt) {
      clearTimeout(expiryTimer);
      expiryDeadline = session?.expiresAt;
      if (session) expiryTimer = setTimeout(() => {
        expiryDeadline = undefined;
        observeSession();
      }, Math.min(Math.max(0, session.expiresAt - Date.now()), 2147483647));
    }
    if (changed) {
      const observationIntent = intent;
      invalidate("STALE_SESSION");
      if (!disposed && intent === observationIntent && owner === nextOwner && notify) emit();
    }
    // Notifications/abort handlers may have established another session.
    return disposed ? null : getSessionSnapshot();
  }

  const unsubscribeSession = subscribeSession(() => observeSession());
  observeSession(false);

  function getSnapshot() {
    observeSession(false); // Synchronous guard: stale data is never returned to a new render.
    return state;
  }

  function cancel() {
    if (!operation?.pending) return;
    const old = operation;
    const cancellationIntent = Symbol();
    intent = cancellationIntent;
    old.cancelIntent = cancellationIntent;
    invalidate("LOAD_CANCELLED");
    const session = observeSession();
    if (disposed || intent !== cancellationIntent || session?.generation !== old.generation) return;
    state = snapshot("cancelled", old.period);
    emit();
  }

  function staleResult(op) {
    let reason = op.reason;
    if (reason === "LOAD_CANCELLED" && !disposed) {
      if (getSessionSnapshot()?.generation !== op.generation) reason = "STALE_SESSION";
      else if (op.cancelIntent !== intent) reason = "LOAD_SUPERSEDED";
    }
    return snapshot(disposed || reason === "LOAD_CANCELLED" ? "cancelled" : "stale", op.period, null,
      disposed || reason === "LOAD_CANCELLED" ? null : publicError(reason || "LOAD_SUPERSEDED"));
  }

  async function load(input = {}) {
    if (disposed) return snapshot("cancelled");
    const loadIntent = Symbol();
    intent = loadIntent;
    const op = { intent: loadIntent, period: null };
    const ownsIntent = () => !disposed && intent === loadIntent;
    observeSession();
    if (!ownsIntent()) return staleResult(op);
    invalidate("LOAD_SUPERSEDED");
    if (!ownsIntent()) return staleResult(op);
    const session = observeSession();
    if (!ownsIntent()) return staleResult(op);
    let period;
    try { period = requirePeriod(input); }
    catch (error) {
      if (!ownsIntent()) return staleResult(op);
      const invalid = snapshot("error", null, null, classify(error));
      state = invalid;
      emit();
      return ownsIntent() && state === invalid ? invalid : staleResult(op);
    }
    op.period = period;
    if (!ownsIntent()) return staleResult(op);
    if (!session) {
      const unauthenticated = snapshot("stale", period, null, publicError("SESSION_INVALID"));
      state = unauthenticated;
      emit();
      return ownsIntent() && state === unauthenticated ? unauthenticated : staleResult(op);
    }
    Object.assign(op, { controller: new AbortController(), generation: session.generation, pending: true });
    operation = op;
    const assertCurrent = () => {
      observeSession();
      if (!ownsIntent() || operation !== op || owner !== op.generation) throw new FinancialLoadError(op.reason || "STALE_SESSION");
      if (op.controller.signal.aborted) throw new FinancialLoadError("LOAD_CANCELLED");
    };
    const abort = () => { if (operation === op) cancel(); };
    input.signal?.addEventListener("abort", abort, { once: true });
    if (!ownsIntent() || operation !== op) {
      input.signal?.removeEventListener("abort", abort);
      return staleResult(op);
    }
    if (input.signal?.aborted) {
      cancel();
      input.signal.removeEventListener("abort", abort);
      return staleResult(op);
    }
    state = snapshot("loading", period);
    emit();
    let next;
    try {
      assertCurrent();
      const categories = await fetchCategories({ signal: op.controller.signal });
      assertCurrent();
      if (!Array.isArray(categories) || !categories.every(isCategory)) throw new FinancialLoadError("INVALID_RESPONSE");
      const transactions = await loadTransactionPages({ period, fetchPage: fetchTransactions, assertCurrent,
        signal: op.controller.signal, pageSize, maxPages, maxRecords });
      assertCurrent();
      const categoryIds = new Set(categories.map((category) => category.id.toLowerCase()));
      if (transactions.some((transaction) => !categoryIds.has(transaction.categoryId.toLowerCase()))) {
        throw new FinancialLoadError("COVERAGE_UNKNOWN");
      }
      const data = Object.freeze({
        categories: Object.freeze(categories.map((category) => Object.freeze({ ...category }))), transactions,
        summary: Object.freeze(summarizeExact(transactions)),
        categoriesStatus: categories.length ? "success" : "empty",
        transactionsStatus: transactions.length ? "success" : "empty",
        coverage: Object.freeze({ ...period, complete: true, scope: "period" }),
      });
      next = snapshot(categories.length || transactions.length ? "success" : "empty", period, data);
    } catch (error) {
      observeSession();
      if (!ownsIntent() || operation !== op || owner !== op.generation) return staleResult(op);
      next = error?.code === "ERR_CANCELED" || op.controller.signal.aborted
        ? snapshot("cancelled", period) : snapshot("error", period, null, classify(error));
    } finally {
      op.pending = false;
      input.signal?.removeEventListener("abort", abort);
    }
    observeSession();
    if (!ownsIntent() || operation !== op || owner !== op.generation) return staleResult(op);
    state = next;
    emit();
    return ownsIntent() && operation === op && getSessionSnapshot()?.generation === op.generation ? next : staleResult(op);
  }

  return Object.freeze({ getSnapshot, load, cancel,
    subscribe(listener) { if (!disposed) listeners.add(listener); return () => listeners.delete(listener); },
    dispose() {
      if (disposed) return;
      disposed = true;
      intent = Symbol();
      // Abort dispatches synchronously: reentrant reads must already see no data.
      state = snapshot("cancelled");
      unsubscribeSession();
      clearTimeout(expiryTimer);
      invalidate("LOAD_CANCELLED");
      listeners.clear();
    },
  });
}
