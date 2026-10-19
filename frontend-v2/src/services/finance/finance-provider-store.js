import { getSessionSnapshot, subscribeSession } from "../auth/session";
import { createFinancialCommands } from "./financial-commands";
import { requirePeriod } from "./financial-load";

const EMPTY = Object.freeze([]);
const readResult = (status) => Object.freeze({ status, period: null, data: null, error: null });

// Calendar policy: UTC civil month. Transport always receives date-only strings.
export function currentCivilMonth(date = new Date()) {
  const from = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return requirePeriod({ from, to });
}

/** Pure bridge construction: subscriptions, timers and HTTP begin only in mount(). */
export function createFinanceProviderStore(initialPeriod) {
  let period = requirePeriod(initialPeriod);
  let active = null;
  let loadIntent;
  let cached, cachedSource, cachedPeriod, cachedAuthenticated;
  const listeners = new Set();

  function getSnapshot() {
    const lease = active;
    const source = lease?.commands.getSnapshot() ?? null;
    const authenticated = !!getSessionSnapshot();
    // commands.getSnapshot may synchronously trigger abort callbacks on a session change.
    if (active !== lease) return getSnapshot();
    if (cached && cachedSource === source && cachedPeriod === period && cachedAuthenticated === authenticated) return cached;
    const view = source?.view;
    const matches = view?.period?.from === period.from && view?.period?.to === period.to;
    const data = authenticated && matches && view?.data?.coverage.complete ? view.data : null;
    cachedSource = source;
    cachedPeriod = period;
    cachedAuthenticated = authenticated;
    cached = Object.freeze({
      sessionStatus: authenticated ? "authenticated" : "unauthenticated",
      status: view && (!view.period || matches) ? view.status : "idle",
      period, coverage: data?.coverage ?? null,
      transactions: data?.transactions ?? EMPTY, categories: data?.categories ?? EMPTY,
      summary: data?.summary ?? null, error: view?.error ?? null,
      pending: source?.pending ?? 0, lastResult: source?.lastResult ?? null,
      refreshRequired: source?.refreshRequired ?? false,
    });
    return cached;
  }

  function emit() {
    const published = getSnapshot();
    for (const listener of [...listeners]) {
      if (getSnapshot() !== published) break;
      if (listeners.has(listener)) listener();
    }
  }

  async function load(next = period) {
    const previousIntent = loadIntent;
    const intent = Symbol();
    loadIntent = intent;
    let selected;
    try { selected = requirePeriod(next); }
    catch (error) {
      // Rejected validation does not supersede a valid load. A getter may have
      // started a newer load synchronously: never restore over its intention.
      if (loadIntent === intent) loadIntent = previousIntent;
      throw error;
    }
    if (loadIntent !== intent) return readResult("stale");
    if (selected.from !== period.from || selected.to !== period.to) period = selected;
    const lease = active;
    if (!lease) { emit(); return readResult("cancelled"); }
    const generation = getSessionSnapshot()?.generation;
    lease.requestedGeneration = generation ?? null;
    // No bridge notification before commands.load: its intent must be established
    // before any subscriber can request a newer period.
    const loaded = await lease.commands.load(period);
    if (active !== lease) return readResult("cancelled");
    const view = lease.commands.getSnapshot().view;
    if (active !== lease) return readResult("cancelled");
    const code = getSessionSnapshot()?.generation !== generation ? "STALE_SESSION"
      : loadIntent !== intent || (["success", "empty"].includes(loaded.status) && view !== loaded) ? "LOAD_SUPERSEDED" : null;
    return code ? Object.freeze({ status: "stale", period: loaded.period, data: null, error: Object.freeze({ code }) }) : loaded;
  }

  function readSession(lease) {
    if (active !== lease) return;
    const session = getSessionSnapshot();
    if (!session) { lease.requestedGeneration = null; return; }
    if (session.generation === lease.requestedGeneration) return;
    lease.requestedGeneration = session.generation;
    // Expected transport/contract failures are results of commands.load, not retries.
    return load();
  }

  function mount() {
    if (active) throw new Error("Financial owner is already mounted.");
    const lease = { commands: createFinancialCommands(), requestedGeneration: null };
    active = lease;
    const offCommands = lease.commands.subscribe(emit);
    const offSession = subscribeSession(() => { readSession(lease); emit(); });
    const detach = () => {
      if (active === lease) active = null; // Hide data before dispose/abort callbacks.
      offSession();
      offCommands();
      try { emit(); }
      finally { lease.commands.dispose(); }
    };
    try { emit(); readSession(lease); }
    catch (error) { detach(); throw error; }
    return detach;
  }

  const invoke = async (operation, args) => {
    const lease = active;
    if (!lease) return Object.freeze({ operation, status: "cancelled" });
    const generation = getSessionSnapshot()?.generation;
    const result = await lease.commands[operation](...args);
    if (active !== lease) return Object.freeze({ operation, status: "cancelled" });
    return getSessionSnapshot()?.generation === generation ? result : Object.freeze({ operation, status: "stale" });
  };
  const actions = Object.freeze({ getSnapshot, load, reload: () => load(),
    createTransaction: (body) => invoke("createTransaction", [body]),
    updateTransaction: (id, body) => invoke("updateTransaction", [id, body]),
    deleteTransaction: (id) => invoke("deleteTransaction", [id]),
    createCategory: (body) => invoke("createCategory", [body]),
    updateCategory: (id, body) => invoke("updateCategory", [id, body]),
    deleteCategory: (id) => invoke("deleteCategory", [id]),
  });
  return Object.freeze({ getSnapshot, actions, mount,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  });
}
