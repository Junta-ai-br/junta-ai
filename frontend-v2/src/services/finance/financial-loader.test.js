import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const categoryId = "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3";
const category = { id: categoryId, name: " \u00a0\u2003💜 ", type: "BOTH", createdAt: "2026-10-18T12:00:00Z" };
const period = { from: "2026-10-01", to: "2026-10-31" };
const previous = { from: "2026-09-01", to: "2026-09-30" };
const tokens = { accessToken: "same-access", refreshToken: "same-refresh", expiresInSeconds: 900 };
const transaction = (index = 1, fields = {}) => ({ id: `76870c4b-f8df-4eab-b3c2-${String(index).padStart(12, "0")}`,
  categoryId, categoryName: category.name, type: "EXPENSE", amount: "0.01", description: null,
  transactionDate: "2026-10-18", createdAt: category.createdAt, ...fields });

function page(content = [], { number = 0, size = 2, totalElements = content.length } = {}) {
  const totalPages = Math.ceil(totalElements / size);
  return { content, number, size, totalElements, totalPages, numberOfElements: content.length,
    first: number === 0, last: number + 1 >= totalPages, empty: content.length === 0 };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let createFinancialLoader, session, api, loaders;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear();
  localStorage.clear();
  session = await import("../auth/session");
  session.saveSession(tokens);
  ({ api } = await import("../api"));
  ({ createFinancialLoader } = await import("./financial-loader"));
  loaders = [];
});
afterEach(() => {
  loaders.forEach((loader) => loader.dispose());
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function setup(options = {}) {
  const fetchCategories = vi.fn().mockResolvedValue([category]);
  const fetchTransactions = vi.fn().mockResolvedValue(page([transaction()]));
  const loader = createFinancialLoader({ pageSize: 2, fetchCategories, fetchTransactions, ...options });
  loaders.push(loader);
  return { loader, fetchCategories: options.fetchCategories ?? fetchCategories,
    fetchTransactions: options.fetchTransactions ?? fetchTransactions };
}

async function dispatched(fetcher, count = 1) {
  await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(count));
}

describe("financial loader state and coverage", () => {
  it("starts idle and publishes only one complete, immutable result", async () => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    const seen = [];
    loader.subscribe(() => seen.push(loader.getSnapshot()));
    expect(loader.getSnapshot().status).toBe("idle");
    const result = await loader.load(period);
    expect(seen.map((item) => item.status)).toEqual(["loading", "success"]);
    expect(seen[0].data).toBeNull();
    expect(result.data.categories[0]).toEqual(category);
    expect(result.data.transactions[0].signedAmount).toBe("-0.01");
    expect(result.data.summary.balance).toBe("-0.01");
    expect(result.data.coverage).toEqual({ ...period, scope: "period", complete: true });
    expect(fetchCategories.mock.calls[0][0].signal).toBeInstanceOf(AbortSignal);
    expect(fetchTransactions).toHaveBeenCalledWith(expect.objectContaining({ ...period, page: 0, size: 2, sort: "transactionDate,id,asc" }));
    expect(Object.isFrozen(result.data.categories[0])).toBe(true);
    expect(Object.isFrozen(result.data.transactions)).toBe(true);
    expect(result).toBe(loader.getSnapshot());
  });

  it("returns empty only after categories and every transaction page confirm emptiness", async () => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchCategories.mockResolvedValue([]);
    fetchTransactions.mockResolvedValue(page());
    const result = await loader.load(period);
    expect(result.status).toBe("empty");
    expect(result.data).toMatchObject({ categories: [], transactions: [], categoriesStatus: "empty", transactionsStatus: "empty" });
    expect(fetchTransactions).toHaveBeenCalledOnce();
  });

  it("distinguishes an empty transaction period from a nonempty category catalog", async () => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page());
    expect((await loader.load(period)).data).toMatchObject({ categoriesStatus: "success", transactionsStatus: "empty" });
  });

  it("loads all pages privately and preserves exact large cents and a deficit", async () => {
    const last = deferred();
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValueOnce(page([transaction(1, { type: "INCOME", amount: "100.00" }), transaction(2, { amount: "120.00" })], { totalElements: 3 }))
      .mockReturnValueOnce(last.promise);
    const pending = loader.load(period);
    await dispatched(fetchTransactions, 2);
    expect(loader.getSnapshot()).toMatchObject({ status: "loading", data: null });
    last.resolve(page([transaction(3, { amount: "99999999999999999.99" })], { number: 1, totalElements: 3 }));
    const result = await pending;
    expect(result.data.transactions).toHaveLength(3);
    expect(result.data.summary.balance).toBe("-100000000000000019.99");
  });

  it("accepts the effective server page size and reuses it on subsequent pages", async () => {
    const { loader, fetchTransactions } = setup({ pageSize: 100 });
    fetchTransactions.mockResolvedValueOnce(page([transaction(1)], { size: 1, totalElements: 2 }))
      .mockResolvedValueOnce(page([transaction(2)], { number: 1, size: 1, totalElements: 2 }));
    expect((await loader.load(period)).status).toBe("success");
    expect(fetchTransactions.mock.calls[1][0].size).toBe(1);
  });

  it.each([{}, { from: period.from }, null, { from: "2026-02-30", to: period.to }, { from: period.to, to: period.from }])(
    "rejects unknown or invalid coverage %j before HTTP", async (input) => {
      const { loader, fetchCategories, fetchTransactions } = setup();
      expect((await loader.load(input)).status).toBe("error");
      expect(fetchCategories).not.toHaveBeenCalled();
      expect(fetchTransactions).not.toHaveBeenCalled();
    },
  );

  it.each([
    { content: [] }, { number: 1 }, { size: 0 }, { totalPages: 9 }, { last: false },
  ])("rejects anomalous initial pages %j", async (fields) => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue({ ...page([transaction()]), ...fields });
    expect((await loader.load(period)).status).toBe("error");
    expect(loader.getSnapshot().data).toBeNull();
  });

  it("rejects a repeated page rather than looping", async () => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page([transaction(1), transaction(2)], { totalElements: 3 }));
    expect((await loader.load(period)).error.code).toBe("PAGINATION_INVALID");
    expect(fetchTransactions).toHaveBeenCalledTimes(2);
  });

  it("rejects changing totals across individually valid pages", async () => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValueOnce(page([transaction(1), transaction(2)], { totalElements: 3 }))
      .mockResolvedValueOnce(page([transaction(3), transaction(4)], { number: 1, totalElements: 4 }));
    expect((await loader.load(period)).error.code).toBe("COVERAGE_UNKNOWN");
  });

  it("does not call a short nonfinal page complete", async () => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page([transaction(1)], { totalElements: 3 }));
    expect((await loader.load(period)).error.code).toBe("COVERAGE_UNKNOWN");
    expect(fetchTransactions).toHaveBeenCalledOnce();
  });

  it.each([{ maxPages: 1 }, { maxRecords: 2 }])("enforces defensive limits %j", async (options) => {
    const { loader, fetchTransactions } = setup(options);
    fetchTransactions.mockResolvedValue(page([transaction(1), transaction(2)], { totalElements: 3 }));
    expect((await loader.load(period)).error.code).toBe("COVERAGE_UNKNOWN");
    expect(fetchTransactions).toHaveBeenCalledOnce();
  });

  it("rejects an out-of-period record and an unresolved category catalog", async () => {
    const { loader, fetchTransactions, fetchCategories } = setup();
    fetchTransactions.mockResolvedValue(page([transaction(1, { transactionDate: "2026-09-30" })]));
    expect((await loader.load(period)).error.code).toBe("INVALID_RESPONSE");
    fetchTransactions.mockResolvedValue(page([transaction()]));
    fetchCategories.mockResolvedValue([]);
    expect((await loader.load(period)).error.code).toBe("COVERAGE_UNKNOWN");
  });

  it("deduplicates safely but refuses coverage if unique IDs cannot match totalElements", async () => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page([transaction(), { ...transaction() }]));
    expect((await loader.load(period)).error.code).toBe("COVERAGE_UNKNOWN");
    expect(loader.getSnapshot().data).toBeNull();
    fetchTransactions.mockResolvedValue(page([transaction(), transaction(1, { amount: "1.00" })]));
    expect((await loader.load(period)).error.code).toBe("DUPLICATE_CONFLICT");
  });

  it("propagates an intermediate HTTP failure without publishing the collected page", async () => {
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValueOnce(page([transaction(1), transaction(2)], { totalElements: 3 }))
      .mockRejectedValueOnce({ response: { status: 503, data: { mensagem: "Server detail" } } });
    const result = await loader.load(period);
    expect(result).toMatchObject({ status: "error", data: null, error: { code: "HTTP_ERROR", status: 503 } });
    expect(result.error).not.toHaveProperty("data");
  });

  it.each([
    [{ response: { status: 403, data: { internal: "hidden" } } }, "HTTP_ERROR"],
    [{ code: "ERR_NETWORK" }, "NETWORK_ERROR"], [{ code: "ERR_API_RESPONSE" }, "INVALID_RESPONSE"],
  ])("classifies category failure without returning empty data case %#", async (failure, code) => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchCategories.mockRejectedValue(failure);
    const result = await loader.load(period);
    expect(result).toMatchObject({ status: "error", data: null, error: { code } });
    expect(fetchTransactions).not.toHaveBeenCalled();
  });

  it("never reads financial storage, creates default categories or emits sensitive logs", async () => {
    const { loader, fetchCategories } = setup();
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
      if (this === localStorage) throw new Error("Local financial fallback is forbidden");
      return original.call(this, key);
    });
    const write = vi.spyOn(Storage.prototype, "setItem");
    const log = vi.spyOn(console, "log");
    const error = vi.spyOn(console, "error");
    fetchCategories.mockRejectedValue({ code: "ERR_NETWORK" });
    expect((await loader.load(period)).error.code).toBe("NETWORK_ERROR");
    expect(write).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});

describe("session generation, concurrency and cancellation", () => {
  it("does not start without a session", async () => {
    session.clearSession();
    const { loader, fetchCategories } = setup();
    expect(await loader.load(period)).toMatchObject({ status: "stale", data: null, error: { code: "SESSION_INVALID" } });
    expect(fetchCategories).not.toHaveBeenCalled();
  });

  it("clears published financial data immediately on logout or identical-token login", async () => {
    const { loader } = setup();
    await loader.load(period);
    session.saveSession(tokens);
    expect(loader.getSnapshot()).toMatchObject({ status: "idle", data: null });
    await loader.load(period);
    session.clearSession();
    expect(loader.getSnapshot()).toMatchObject({ status: "stale", data: null });
  });

  it("expires published data even without a mounted UserProvider", async () => {
    session.saveSession({ ...tokens, expiresInSeconds: 1 });
    const { loader } = setup();
    await loader.load(period);
    vi.advanceTimersByTime(1000);
    expect(loader.getSnapshot()).toMatchObject({ status: "stale", data: null });
  });

  it("guards reads synchronously if storage becomes unavailable without a session event", async () => {
    const { loader } = setup();
    await loader.load(period);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Denied"); });
    expect(loader.getSnapshot()).toMatchObject({ status: "stale", data: null });
  });

  it.each(["new login", "logout/login"])("discards an old 200 after %s with identical tokens", async (transition) => {
    const blocked = deferred();
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockReturnValueOnce(blocked.promise).mockResolvedValue(page([transaction(2, { type: "INCOME", amount: "2.00" })]));
    const old = loader.load(period);
    await dispatched(fetchTransactions);
    if (transition === "logout/login") session.clearSession();
    session.saveSession(tokens);
    const fresh = await loader.load(period);
    blocked.resolve(page([transaction(1)]));
    expect(await old).toMatchObject({ status: "stale", data: null });
    expect(loader.getSnapshot()).toBe(fresh);
    expect(fresh.data.summary.balance).toBe("2.00");
  });

  it("does not start transactions after categories from an old session resolve", async () => {
    const blocked = deferred();
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchCategories.mockReturnValueOnce(blocked.promise);
    const pending = loader.load(period);
    session.clearSession();
    session.saveSession(tokens);
    blocked.resolve([category]);
    expect((await pending).status).toBe("stale");
    expect(fetchTransactions).not.toHaveBeenCalled();
  });

  it("does not let an old error overwrite a newer success for another period", async () => {
    const blocked = deferred();
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockReturnValueOnce(blocked.promise).mockResolvedValue(page([transaction(2, { transactionDate: "2026-09-15" })]));
    const old = loader.load(period);
    await dispatched(fetchTransactions);
    const fresh = await loader.load(previous);
    blocked.reject({ code: "ERR_NETWORK" });
    expect((await old).status).toBe("stale");
    expect(loader.getSnapshot()).toBe(fresh);
    expect(fresh.period).toEqual(previous);
  });

  it("does not let an old finally stop a newer loading state", async () => {
    const first = deferred(), second = deferred();
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const old = loader.load(period);
    await dispatched(fetchTransactions);
    const fresh = loader.load(previous);
    await dispatched(fetchTransactions, 2);
    first.reject({ response: { status: 500 } });
    await old;
    expect(loader.getSnapshot()).toMatchObject({ status: "loading", period: previous, data: null });
    second.resolve(page());
    await fresh;
    expect(loader.getSnapshot().data.transactionsStatus).toBe("empty");
  });

  it.each(["explicit", "external", "pre-aborted"])("treats %s cancellation as cancellation, not a financial error", async (kind) => {
    const blocked = deferred();
    const abort = new AbortController();
    const { loader, fetchCategories } = setup();
    fetchCategories.mockReturnValueOnce(blocked.promise);
    if (kind === "pre-aborted") abort.abort();
    const pending = loader.load({ ...period, signal: abort.signal });
    if (kind === "explicit") loader.cancel();
    if (kind === "external") abort.abort();
    expect(loader.getSnapshot()).toMatchObject({ status: "cancelled", data: null, error: null });
    blocked.resolve([category]);
    expect((await pending).status).toBe("cancelled");
  });

  it("disposes subscriptions and cannot expose completed data afterward", async () => {
    const { loader } = setup();
    await loader.load(period);
    loader.dispose();
    session.saveSession(tokens);
    expect(loader.getSnapshot()).toMatchObject({ status: "cancelled", data: null });
    expect((await loader.load(period)).status).toBe("cancelled");
  });
});

describe("reentrancy regressions", () => {
  it.each(["invalid period", "missing session"])("returns stale instead of B's snapshot after a reentrant %s notification", async (kind) => {
    if (kind === "missing session") session.clearSession();
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page());
    let newer;
    loader.subscribe(() => {
      const status = loader.getSnapshot().status;
      if (status === "error" || status === "stale") {
        if (kind === "missing session") session.saveSession(tokens);
        newer = loader.load(previous);
      }
    });
    const old = await loader.load(kind === "invalid period" ? {} : period);
    expect(old).toMatchObject({ status: "stale", data: null, error: { code: "LOAD_SUPERSEDED" } });
    const fresh = await newer;
    expect(fresh).toMatchObject({ status: "success", period: previous });
    expect(loader.getSnapshot()).toBe(fresh);
  });

  it.each(["cancel", "replacement"])("keeps B authoritative when %s aborts A and its abort listener starts B", async (action) => {
    const blocked = deferred();
    let newer;
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchCategories.mockImplementationOnce(({ signal }) => {
      signal.addEventListener("abort", () => { newer = loader.load(previous); }, { once: true });
      return blocked.promise;
    });
    fetchTransactions.mockResolvedValue(page([transaction(2, { transactionDate: "2026-09-15" })]));
    const old = loader.load(period);
    let interrupted;
    if (action === "cancel") loader.cancel();
    else interrupted = loader.load(period);
    expect(loader.getSnapshot()).toMatchObject({ status: "loading", period: previous });
    const fresh = await newer;
    expect(fresh).toMatchObject({ status: "success", period: previous });
    blocked.resolve([category]);
    expect(await old).toMatchObject({ status: "stale", data: null });
    if (interrupted) expect(await interrupted).toMatchObject({ status: "stale", data: null });
    expect(loader.getSnapshot()).toBe(fresh);
  });

  it("lets the newer subscriber load win during observeSession's idle notification", async () => {
    const { loader, fetchTransactions } = setup();
    await loader.load(period);
    const stored = JSON.parse(sessionStorage.getItem("junta_auth_session"));
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...stored, accessToken: "changed" }));
    let newer;
    const off = loader.subscribe(() => {
      if (loader.getSnapshot().status === "idle") newer = loader.load(previous);
    });
    fetchTransactions.mockResolvedValue(page([transaction(2, { transactionDate: "2026-09-15" })]));
    const old = await loader.load(period);
    const fresh = await newer;
    expect(old).toMatchObject({ status: "stale", data: null });
    expect(fresh).toMatchObject({ status: "success", period: previous });
    expect(loader.getSnapshot()).toBe(fresh);
    off();
  });

  it("keeps the new generation when abort synchronously switches the session", async () => {
    const blocked = deferred();
    let newer;
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page());
    fetchCategories.mockImplementationOnce(({ signal }) => {
      signal.addEventListener("abort", () => {
        session.saveSession(tokens);
        newer = loader.load(previous);
      });
      return blocked.promise;
    });
    const old = loader.load(period);
    session.clearSession();
    const fresh = await newer;
    expect(fresh).toMatchObject({ status: "success", period: previous });
    blocked.resolve([category]);
    expect((await old).status).toBe("stale");
    expect(loader.getSnapshot()).toBe(fresh);
  });

  it("clears completed session data before synchronous dispose abort callbacks run", async () => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    let controllerSignal, inside, attempted;
    fetchCategories.mockImplementationOnce(({ signal }) => {
      controllerSignal = signal;
      signal.addEventListener("abort", () => {
        session.saveSession({ ...tokens, accessToken: "account-B", refreshToken: "refresh-B" });
        inside = loader.getSnapshot();
        loader.cancel();
        attempted = loader.load(previous);
        loader.dispose();
      }, { once: true });
      return Promise.resolve([category]);
    });
    const loaded = await loader.load(period);
    expect(loaded.status).toBe("success");
    expect(loaded.data.transactions).toHaveLength(1);
    expect(controllerSignal.aborted).toBe(false);
    const generationA = session.getSessionSnapshot().generation;
    const observer = vi.fn();
    loader.subscribe(observer);
    loader.dispose();
    expect(controllerSignal.aborted).toBe(true);
    expect(session.getSessionSnapshot().generation).not.toBe(generationA);
    expect(inside).toEqual({ status: "cancelled", period: null, data: null, error: null });
    expect(loader.getSnapshot()).toBe(inside);
    expect(await attempted).toMatchObject({ status: "cancelled", data: null });
    expect(await loader.load(period)).toMatchObject({ status: "cancelled", data: null });
    expect(fetchCategories).toHaveBeenCalledOnce();
    expect(fetchTransactions).toHaveBeenCalledOnce();
    expect(observer).not.toHaveBeenCalled();
  });

  it("does not let abort callbacks resurrect a disposed loader", async () => {
    const blocked = deferred();
    let attempted, signal;
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchCategories.mockImplementationOnce((options) => {
      signal = options.signal;
      signal.addEventListener("abort", () => { attempted = loader.load(previous); });
      return blocked.promise;
    });
    const listener = vi.fn();
    loader.subscribe(listener);
    const pending = loader.load(period);
    const notifications = listener.mock.calls.length;
    loader.dispose();
    expect(signal.aborted).toBe(true);
    expect(await attempted).toMatchObject({ status: "cancelled", data: null });
    blocked.resolve([category]);
    expect(await pending).toMatchObject({ status: "cancelled", data: null });
    session.saveSession(tokens);
    expect(listener).toHaveBeenCalledTimes(notifications);
    expect(fetchCategories).toHaveBeenCalledOnce();
    expect(fetchTransactions).not.toHaveBeenCalled();
    expect(loader.getSnapshot()).toMatchObject({ status: "cancelled", data: null });
  });

  it("does not publish an old cancellation after abort establishes a new session without loading", async () => {
    const blocked = deferred();
    const { loader, fetchCategories } = setup();
    fetchCategories.mockImplementationOnce(({ signal }) => {
      signal.addEventListener("abort", () => session.saveSession(tokens));
      return blocked.promise;
    });
    const old = loader.load(period);
    loader.cancel();
    expect(loader.getSnapshot()).toMatchObject({ status: "idle", period: null, data: null });
    blocked.resolve([category]);
    expect(await old).toMatchObject({ status: "stale", data: null, error: { code: "STALE_SESSION" } });
    expect(loader.getSnapshot().status).toBe("idle");
  });

  it("lets a loading subscriber cancel before any fetcher runs", async () => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    loader.subscribe(() => { if (loader.getSnapshot().status === "loading") loader.cancel(); });
    expect(await loader.load(period)).toMatchObject({ status: "cancelled", data: null, error: null });
    expect(fetchCategories).not.toHaveBeenCalled();
    expect(fetchTransactions).not.toHaveBeenCalled();
  });

  it("lets a loading subscriber start a newer period without invoking the old fetcher", async () => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    let newer;
    loader.subscribe(() => {
      const current = loader.getSnapshot();
      if (current.status === "loading" && current.period.from === period.from) newer = loader.load(previous);
    });
    fetchTransactions.mockResolvedValue(page());
    expect((await loader.load(period)).status).toBe("stale");
    const fresh = await newer;
    expect(loader.getSnapshot()).toBe(fresh);
    expect(fresh.period).toEqual(previous);
    expect(fetchCategories).toHaveBeenCalledOnce();
  });

  it("honors unsubscribe during notification and excludes newly added subscribers from that publication", async () => {
    const { loader } = setup();
    const removed = vi.fn(), added = vi.fn();
    let remove;
    loader.subscribe(() => {
      if (loader.getSnapshot().status === "loading") { remove(); loader.subscribe(added); }
    });
    remove = loader.subscribe(removed);
    await loader.load(period);
    expect(removed).not.toHaveBeenCalled();
    expect(added).toHaveBeenCalledOnce(); // success only, not the ongoing loading publication
  });

  it("stops an obsolete publication when a subscriber changes session", async () => {
    const { loader } = setup();
    let changed = false;
    loader.subscribe(() => {
      if (!changed && loader.getSnapshot().status === "success") {
        changed = true;
        session.clearSession();
        session.saveSession(tokens);
      }
    });
    const seen = [];
    loader.subscribe(() => seen.push(loader.getSnapshot()));
    expect((await loader.load(period)).status).toBe("stale");
    expect(seen.every((item) => item.data === null)).toBe(true);
    expect(loader.getSnapshot()).toMatchObject({ status: "idle", data: null });
  });

  it("guards a synchronous fetcher that starts another load before returning", async () => {
    const { loader, fetchCategories, fetchTransactions } = setup();
    let newer;
    fetchCategories.mockImplementationOnce(() => { newer = loader.load(previous); return Promise.resolve([category]); });
    fetchTransactions.mockResolvedValue(page());
    expect((await loader.load(period)).status).toBe("stale");
    const fresh = await newer;
    expect(loader.getSnapshot()).toBe(fresh);
    expect(fetchTransactions).toHaveBeenCalledOnce();
    expect(fresh.period).toEqual(previous);
  });

  it("cancels an intermediate page without publishing partial data", async () => {
    const blocked = deferred();
    let pageSignal;
    const { loader, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValueOnce(page([transaction(1), transaction(2)], { totalElements: 3 }))
      .mockImplementationOnce(({ signal }) => { pageSignal = signal; return blocked.promise; });
    const seen = [];
    loader.subscribe(() => seen.push(loader.getSnapshot()));
    const pending = loader.load(period);
    await dispatched(fetchTransactions, 2);
    loader.cancel();
    expect(pageSignal.aborted).toBe(true);
    blocked.resolve(page([transaction(3)], { number: 1, totalElements: 3 }));
    expect(await pending).toMatchObject({ status: "cancelled", data: null });
    expect(seen.map((item) => item.status)).toEqual(["loading", "cancelled"]);
    expect(seen.every((item) => item.data === null)).toBe(true);
  });

  it("does not let an old finally stop B started synchronously by abort", async () => {
    const first = deferred(), second = deferred();
    let newer;
    const { loader, fetchCategories, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page());
    fetchCategories.mockImplementationOnce(({ signal }) => {
      signal.addEventListener("abort", () => { newer = loader.load(previous); });
      return first.promise;
    }).mockReturnValueOnce(second.promise);
    const old = loader.load(period);
    loader.cancel();
    first.reject({ code: "ERR_NETWORK" });
    expect((await old).status).toBe("stale");
    expect(loader.getSnapshot()).toMatchObject({ status: "loading", period: previous, data: null });
    second.resolve([]);
    const fresh = await newer;
    expect(fresh.status).toBe("empty");
    expect(loader.getSnapshot()).toBe(fresh);
  });

  it("preserves B when a genuinely delivered old-generation 401 reaches the interceptor", async () => {
    const blocked = deferred();
    let config;
    api.defaults.adapter = (request) => { config = request; return blocked.promise; };
    // This request intentionally has no AbortSignal, so Axios cannot replace the 401 with cancellation.
    const request = api.get("/categories", { requiresAuth: true }).catch((error) => error);
    await vi.waitFor(() => expect(config).toBeDefined());
    const { loader, fetchTransactions } = setup();
    await loader.load(period);
    session.clearSession();
    session.saveSession(tokens);
    fetchTransactions.mockResolvedValue(page());
    const fresh = await loader.load(previous);
    blocked.reject(new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, data: "{}", config }));
    expect(await request).toMatchObject({ response: { status: 401 } });
    expect(session.getSessionSnapshot()).not.toBeNull();
    expect(loader.getSnapshot()).toBe(fresh);
  });

  it("preserves the session when Axios converts a cancelled request's 401 into ERR_CANCELED", async () => {
    const blocked = deferred();
    let config;
    let cancellationCode;
    api.interceptors.response.use(undefined, (error) => {
      cancellationCode = error.code;
      return Promise.reject(error);
    });
    api.defaults.adapter = (request) => { config = request; return blocked.promise; };
    const loader = createFinancialLoader();
    loaders.push(loader);
    const pending = loader.load(period);
    await vi.waitFor(() => expect(config).toBeDefined());
    loader.cancel();
    blocked.reject(new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, data: "{}", config }));
    expect(await pending).toMatchObject({ status: "cancelled", data: null });
    expect(cancellationCode).toBe("ERR_CANCELED");
    expect(session.getSessionSnapshot()).not.toBeNull();
  });
});

describe("compatibility with the real Axios services", () => {
  it("loads raw GET JSON and sends a compatible PUT without serializing BigInt", async () => {
    const { transactionViewToRequest } = await import("./transaction-adapter");
    const { updateTransaction } = await import("../transactions.api");
    const dto = transaction(1, { amount: "99999999999999999.99" });
    const raw = (data) => JSON.stringify(data).replace('"amount":"99999999999999999.99"', '"amount":99999999999999999.99');
    const configs = [];
    api.defaults.adapter = async (config) => {
      configs.push(config);
      return { config, status: 200, headers: {}, data: config.url === "/categories" ? JSON.stringify([category])
        : config.method === "put" ? raw(dto) : raw(page([dto])) };
    };
    const loader = createFinancialLoader({ pageSize: 2 });
    loaders.push(loader);
    const loaded = await loader.load(period);
    expect(loaded.data.summary.balance).toBe("-99999999999999999.99");
    await expect(updateTransaction(dto.id, transactionViewToRequest(loaded.data.transactions[0]))).resolves.toEqual(dto);
    expect(configs[2].data).toContain('"amount":99999999999999999.99');
    expect(configs[2].data).not.toContain("signedCents");
    expect(configs[0].headers.get("Authorization")).toBe("Bearer same-access");
    expect(configs[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("a current 401 clears loader data, while a late 401 cannot clear a new generation", async () => {
    const blocked = deferred();
    let requests = 0;
    let oldConfig;
    api.defaults.adapter = async (config) => {
      requests += 1;
      if (requests === 1) {
        oldConfig = config;
        return blocked.promise;
      }
      return { config, status: 200, data: config.url === "/categories" ? JSON.stringify([category]) : JSON.stringify(page()), headers: {} };
    };
    const loader = createFinancialLoader({ pageSize: 2 });
    loaders.push(loader);
    const pending = loader.load(period);
    await vi.waitFor(() => expect(requests).toBe(1));
    session.clearSession();
    session.saveSession(tokens);
    const fresh = await loader.load(period);
    blocked.reject(new AxiosError("Rejected", "ERR_BAD_REQUEST", oldConfig, {}, {
      status: 401, data: '{"mensagem":"expired"}', config: oldConfig, headers: {},
    }));
    expect((await pending).status).toBe("stale");
    expect(session.getSessionSnapshot()).not.toBeNull();
    expect(loader.getSnapshot()).toBe(fresh);
    api.defaults.adapter = async (config) => {
      throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, data: '{"mensagem":"expired"}', config, headers: {} });
    };
    await loader.load(period);
    expect(session.getSessionSnapshot()).toBeNull();
    expect(loader.getSnapshot()).toMatchObject({ status: "stale", data: null });
  });
});
