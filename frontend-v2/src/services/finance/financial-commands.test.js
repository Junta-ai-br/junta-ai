import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const id = "76870c4b-f8df-4eab-b3c2-de1738a07a4e";
const categoryId = "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3";
const otherCategoryId = "a0d3efc5-222f-4576-99d1-1694c80445cf";
const period = { from: "2026-10-01", to: "2026-10-31" };
const previous = { from: "2026-09-01", to: "2026-09-30" };
const category = { id: categoryId, name: " \u00a0\u2003Educação 💜 ", type: "BOTH", createdAt: "2026-10-18T12:00:00Z" };
const input = { categoryId, type: "EXPENSE", amount: "0.01", description: null, transactionDate: "2026-10-18" };
const dto = { ...input, id, categoryName: category.name, createdAt: category.createdAt };
const tokens = { accessToken: "same-access", refreshToken: "same-refresh", expiresInSeconds: 900 };
const page = (content = []) => ({ content, number: 0, size: 100, totalElements: content.length,
  totalPages: content.length ? 1 : 0, numberOfElements: content.length, first: true, last: true, empty: !content.length });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const wire = (data) => JSON.stringify(data).replace(/"amount":"(\d+\.\d{2})"/g, '"amount":$1');

let session, api, createFinancialCommands, createFinancialLoader, owners;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear(); localStorage.clear();
  session = await import("../auth/session");
  session.saveSession(tokens);
  ({ api } = await import("../api"));
  ({ createFinancialLoader } = await import("./financial-loader"));
  ({ createFinancialCommands } = await import("./financial-commands"));
  owners = [];
});
afterEach(() => { owners.forEach((owner) => owner.dispose()); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers(); });

function setup() {
  const fetchCategories = vi.fn().mockResolvedValue([category]);
  const fetchTransactions = vi.fn().mockResolvedValue(page([dto]));
  const loader = createFinancialLoader({ fetchCategories, fetchTransactions });
  const services = {
    createTransaction: vi.fn(async (body) => ({ ...dto, ...body })),
    updateTransaction: vi.fn(async (key, body) => ({ ...dto, ...body, id: key })),
    deleteTransaction: vi.fn().mockResolvedValue(undefined),
    createCategory: vi.fn(async (body) => ({ ...category, ...body })),
    updateCategory: vi.fn(async (key, body) => ({ ...category, ...body, id: key })),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
  };
  const commands = createFinancialCommands({ loader, services });
  owners.push(commands);
  return { commands, loader, services, fetchCategories, fetchTransactions };
}
async function called(mock, count = 1) { await vi.waitFor(() => expect(mock).toHaveBeenCalledTimes(count)); }

describe("financial command contracts", () => {
  it.each(["INCOME", "EXPENSE"])("creates %s with exact positive cents and reloads the full period", async (type) => {
    const { commands, services, fetchTransactions } = setup();
    await commands.load(period);
    const completed = await commands.createTransaction({ ...input, type, amount: "99999999999999999.99" });
    expect(completed).toMatchObject({ status: "confirmed", id, refresh: { status: "synced" } });
    expect(services.createTransaction).toHaveBeenCalledWith(expect.objectContaining({ type, amount: "99999999999999999.99" }),
      expect.objectContaining({ signal: expect.any(AbortSignal), sessionGeneration: session.getSessionSnapshot().generation }));
    expect(fetchTransactions).toHaveBeenCalledTimes(2);
    expect(commands.getSnapshot()).toMatchObject({ pending: 0, lastResult: completed, refreshRequired: false });
  });

  it("updates using the literal UUID and strips response-only fields without input mutation", async () => {
    const { commands, services } = setup();
    await commands.load(period);
    const source = Object.freeze({ ...dto, id: id.toUpperCase(), signedCents: -1n, signedAmount: "-0.01" });
    const updated = await commands.updateTransaction(source.id, source);
    expect(updated.id).toBe(source.id);
    expect(services.updateTransaction.mock.calls[0][0]).toBe(source.id);
    expect(services.updateTransaction.mock.calls[0][1]).toEqual(input);
    expect(source.signedCents).toBe(-1n);
  });

  it("deletes only after HTTP confirmation, without local removal or a retry", async () => {
    const { commands, services } = setup();
    await commands.load(period);
    const held = deferred();
    services.deleteTransaction.mockReturnValueOnce(held.promise);
    const pending = commands.deleteTransaction(id);
    await called(services.deleteTransaction);
    expect(commands.getSnapshot()).toMatchObject({ pending: 1, lastResult: null });
    expect(commands.getSnapshot().view.data.transactions).toHaveLength(1);
    held.resolve();
    expect(await pending).toMatchObject({ status: "confirmed", id });
    expect(services.deleteTransaction).toHaveBeenCalledOnce();
  });

  it.each(["createCategory", "updateCategory", "deleteCategory"])("supports %s with literal Unicode names and UUID identity", async (operation) => {
    const { commands, services, fetchCategories } = setup();
    await commands.load(period);
    const body = { name: category.name, type: "BOTH" };
    const completed = await (operation.startsWith("create") ? commands[operation](body)
      : operation.startsWith("update") ? commands[operation](categoryId, body) : commands[operation](categoryId));
    expect(completed).toMatchObject({ status: "confirmed", id: categoryId, refresh: { status: "synced" } });
    expect(services[operation]).toHaveBeenCalledOnce();
    expect(fetchCategories).toHaveBeenCalledTimes(2);
    expect(commands.getSnapshot().view.data.categories[0].name).toBe(category.name);
  });

  it("does not identify categories by their equal names", async () => {
    const { commands, services, fetchCategories } = setup();
    fetchCategories.mockResolvedValue([category, { ...category, id: otherCategoryId }]);
    await commands.load(period);
    const completed = await commands.updateCategory(otherCategoryId, { name: category.name, type: "INCOME" });
    expect(completed.id).toBe(otherCategoryId);
    expect(services.updateCategory.mock.calls[0][0]).toBe(otherCategoryId);
    expect(commands.getSnapshot().view.data.categories).toHaveLength(2);
  });

  it.each(["0", "-1.00", "0.001", "100000000000000000.00", "1e2", "1,00", 0.01, 1n])(
    "rejects invalid exact command amount %s before HTTP", async (amount) => {
      const { commands, services } = setup();
      expect(await commands.createTransaction({ ...input, amount })).toMatchObject({ status: "error", error: { kind: "validation" } });
      expect(services.createTransaction).not.toHaveBeenCalled();
    },
  );

  it.each([{ type: "BANK" }, { categoryId: "name" }, { transactionDate: "2026-02-30" }, { description: "x".repeat(501) }])(
    "rejects invalid transaction input %j", async (fields) => {
      const { commands, services } = setup();
      expect((await commands.createTransaction({ ...input, ...fields })).status).toBe("error");
      expect(services.createTransaction).not.toHaveBeenCalled();
    },
  );

  it.each([{ name: "a", type: "BOTH" }, { name: "  ", type: "BOTH" }, { name: "OK", type: "INVALID" }])(
    "rejects invalid category input %j", async (body) => {
      const { commands, services } = setup();
      expect((await commands.createCategory(body)).status).toBe("error");
      expect(services.createCategory).not.toHaveBeenCalled();
    },
  );

  it("takes a copy of input while queued, so later caller mutation cannot change the write", async () => {
    const { commands, services } = setup();
    const held = deferred();
    services.deleteTransaction.mockReturnValueOnce(held.promise);
    const first = commands.deleteTransaction(id);
    const body = { ...input };
    const second = commands.createTransaction(body);
    body.amount = "999.99";
    held.resolve();
    await first; await second;
    expect(services.createTransaction.mock.calls[0][0].amount).toBe("0.01");
  });
});

describe("confirmation, uncertainty and synchronization", () => {
  it.each([400, 403, 404, 409, 422, 500, 503])("preserves real HTTP %s without inventing an integrity code", async (status) => {
    const { commands, services, fetchCategories } = setup();
    await commands.load(period);
    services.deleteCategory.mockRejectedValueOnce({ response: { status, data: {
      mensagem: "Mensagem real", campos: { name: "Campo real", Authorization: "forbidden" }, internal: "hidden",
    } } });
    const completed = await commands.deleteCategory(categoryId);
    expect(completed.status).toBe(status >= 500 ? "indeterminate" : "error");
    expect(completed.error).toEqual({ kind: "http", status, mensagem: "Mensagem real", campos: { name: "Campo real" } });
    expect(commands.getSnapshot().view.data.categories).toHaveLength(1);
    expect(commands.getSnapshot().refreshRequired).toBe(status >= 500);
    expect(fetchCategories).toHaveBeenCalledOnce();
    expect(services.deleteCategory).toHaveBeenCalledOnce();
  });

  it.each(["ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK", "ERR_API_RESPONSE", "ERR_MONEY_PRECISION"])(
    "treats post-send %s as indeterminate and never retries", async (code) => {
      const { commands, services } = setup();
      await commands.load(period);
      services.createTransaction.mockRejectedValueOnce({ code });
      expect(await commands.createTransaction(input)).toMatchObject({ status: "indeterminate" });
      expect(commands.getSnapshot()).toMatchObject({ refreshRequired: true, pending: 0 });
      expect(services.createTransaction).toHaveBeenCalledOnce();
      await commands.load(period);
      expect(commands.getSnapshot().refreshRequired).toBe(false);
    },
  );

  it("keeps a confirmed mutation distinct from a failed refresh", async () => {
    const { commands, fetchCategories } = setup();
    await commands.load(period);
    fetchCategories.mockRejectedValueOnce({ code: "ERR_NETWORK" });
    const completed = await commands.createTransaction(input);
    expect(completed).toMatchObject({ status: "confirmed", refresh: { status: "error", error: { code: "NETWORK_ERROR" } } });
    expect(commands.getSnapshot()).toMatchObject({ refreshRequired: true, view: { status: "error", data: null } });
  });

  it("confirms writes without inventing a period when no view is loaded", async () => {
    const { commands, fetchTransactions } = setup();
    expect(await commands.createTransaction(input)).toMatchObject({ status: "confirmed", refresh: { status: "required", reason: "NO_PERIOD" } });
    expect(fetchTransactions).not.toHaveBeenCalled();
    expect(commands.getSnapshot().refreshRequired).toBe(true);
  });

  it("reloads the selected period even if the mutation belongs elsewhere", async () => {
    const { commands, services, fetchTransactions } = setup();
    fetchTransactions.mockResolvedValue(page());
    await commands.load(previous);
    expect((await commands.createTransaction(input)).status).toBe("confirmed");
    expect(services.createTransaction.mock.calls[0][0].transactionDate).toBe(input.transactionDate);
    expect(fetchTransactions.mock.calls.at(-1)[0]).toMatchObject(previous);
    expect(commands.getSnapshot().view.data.transactions).toEqual([]);
  });

  it("serializes two writes and their full refreshes rather than refreshing out of order", async () => {
    const { commands, services, fetchCategories } = setup();
    await commands.load(period);
    const firstWrite = deferred(), firstRefresh = deferred();
    services.createTransaction.mockReturnValueOnce(firstWrite.promise);
    fetchCategories.mockReturnValueOnce(firstRefresh.promise);
    const first = commands.createTransaction(input);
    const second = commands.deleteTransaction(id);
    await called(services.createTransaction);
    expect(services.deleteTransaction).not.toHaveBeenCalled();
    firstWrite.resolve(dto);
    await called(fetchCategories, 2);
    expect(services.deleteTransaction).not.toHaveBeenCalled();
    expect(commands.getSnapshot().view).toMatchObject({ status: "loading", data: null });
    firstRefresh.resolve([category]);
    expect((await first).status).toBe("confirmed");
    const latest = await second;
    expect(latest.status).toBe("confirmed");
    expect(fetchCategories).toHaveBeenCalledTimes(3);
    expect(commands.getSnapshot()).toMatchObject({ pending: 0, lastResult: latest });
  });

  it("does not overwrite a newer selected period with a delayed refresh", async () => {
    const { commands, fetchTransactions } = setup();
    await commands.load(period);
    const held = deferred();
    fetchTransactions.mockReturnValueOnce(held.promise).mockResolvedValueOnce(page());
    const mutation = commands.createTransaction(input);
    await called(fetchTransactions, 2);
    const newest = await commands.load(previous);
    held.resolve(page([dto]));
    expect((await mutation).status).toBe("confirmed");
    expect(commands.getSnapshot().view).toBe(newest);
    expect(commands.getSnapshot().view.period).toEqual(previous);
  });

  it("does not trust an update response with a different UUID", async () => {
    const { commands, services } = setup();
    services.updateTransaction.mockResolvedValueOnce({ ...dto, id: otherCategoryId });
    expect(await commands.updateTransaction(id, input)).toMatchObject({ status: "indeterminate" });
  });
});

describe("session and reentrancy", () => {
  it("does not return a previously resolved financial read after the session changes before its continuation", async () => {
    const { commands, loader } = setup();
    let changed = false;
    loader.subscribe(() => {
      if (!changed && loader.getSnapshot().status === "success") {
        changed = true;
        Promise.resolve().then(() => session.saveSession(tokens));
      }
    });
    expect(await commands.load(period)).toMatchObject({ status: "stale", data: null });
    expect(commands.getSnapshot().view.data).toBeNull();
  });

  it("does not enforce category/type compatibility absent from the backend", async () => {
    const { commands, services, fetchCategories } = setup();
    fetchCategories.mockResolvedValue([{ ...category, type: "INCOME" }]);
    await commands.load(period);
    expect((await commands.createTransaction(input)).status).toBe("confirmed");
    expect(services.createTransaction.mock.calls[0][0].type).toBe("EXPENSE");
  });

  it("discards an older unqueued submission if an input getter synchronously submits B", async () => {
    const { commands, services } = setup();
    let newer;
    const body = { ...input, get description() { newer = commands.deleteTransaction(id); return null; } };
    expect((await commands.createTransaction(body)).status).toBe("stale");
    expect((await newer).status).toBe("confirmed");
    expect(services.createTransaction).not.toHaveBeenCalled();
    expect(services.deleteTransaction).toHaveBeenCalledOnce();
  });

  it("does not write without authentication", async () => {
    const { commands, services } = setup();
    session.clearSession();
    expect((await commands.createTransaction(input)).status).toBe("stale");
    expect(services.createTransaction).not.toHaveBeenCalled();
  });

  it.each(["login", "logout/login"])("isolates delayed A results after %s with identical tokens", async (transition) => {
    const { commands, services, fetchTransactions } = setup();
    await commands.load(period);
    const oldWrite = deferred();
    services.createTransaction.mockReturnValueOnce(oldWrite.promise);
    const old = commands.createTransaction(input);
    const queued = commands.deleteTransaction(id);
    await called(services.createTransaction);
    if (transition === "logout/login") session.clearSession();
    session.saveSession(tokens);
    fetchTransactions.mockResolvedValue(page());
    const fresh = await commands.createCategory({ name: category.name, type: "BOTH" });
    expect(fresh.status).toBe("confirmed");
    oldWrite.resolve(dto);
    expect((await old).status).toBe("stale");
    expect((await queued).status).toBe("stale");
    expect(services.deleteTransaction).not.toHaveBeenCalled();
    expect(commands.getSnapshot()).toMatchObject({ pending: 0, lastResult: fresh });
    expect(commands.getSnapshot().view.data).toBeNull();
  });

  it("cannot expose data or restart from abort callbacks during dispose", async () => {
    const { commands, services } = setup();
    await commands.load(period);
    const held = deferred();
    let inside, attempted;
    services.createTransaction.mockImplementationOnce((_body, { signal }) => {
      signal.addEventListener("abort", () => {
        session.saveSession(tokens);
        inside = commands.getSnapshot();
        attempted = commands.createTransaction(input);
      });
      return held.promise;
    });
    const old = commands.createTransaction(input);
    await called(services.createTransaction);
    commands.dispose();
    expect(inside).toMatchObject({ pending: 0, lastResult: null, view: { status: "cancelled", data: null } });
    expect((await attempted).status).toBe("cancelled");
    held.resolve(dto);
    expect((await old).status).toBe("cancelled");
    expect(services.createTransaction).toHaveBeenCalledOnce();
  });

  it("allows a subscriber to enqueue B without A overwriting its result", async () => {
    const { commands, services } = setup();
    let next;
    commands.subscribe(() => {
      if (!next && commands.getSnapshot().pending === 1) {
        next = Promise.resolve(); // stop unconditional reentrancy before submitting
        next = commands.deleteTransaction(id);
      }
    });
    const first = await commands.createTransaction(input);
    const second = await next;
    expect(first.status).toBe("confirmed");
    expect(second.status).toBe("confirmed");
    expect(commands.getSnapshot().lastResult).toBe(second);
    expect(services.createTransaction).toHaveBeenCalledOnce();
  });

  it("uses no financial storage fallback and emits no sensitive logs", async () => {
    const { commands, services } = setup();
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
      if (this === localStorage) throw new Error("Forbidden fallback");
      return original.call(this, key);
    });
    const write = vi.spyOn(Storage.prototype, "setItem");
    const log = vi.spyOn(console, "log"), error = vi.spyOn(console, "error");
    services.createTransaction.mockRejectedValueOnce({ code: "ERR_NETWORK" });
    expect((await commands.createTransaction(input)).status).toBe("indeterminate");
    expect(write).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(error).not.toHaveBeenCalled();
  });
});

describe("public return authority regressions", () => {
  it.each(["new login", "logout/login"])("discards session A after synchronous %s in the final reconciliation emit", async (transition) => {
    const { commands, services } = setup();
    await commands.load(period);
    services.createTransaction.mockRejectedValueOnce({ code: "ERR_NETWORK" });
    await commands.createTransaction(input);
    expect(commands.getSnapshot().refreshRequired).toBe(true);
    let changed = false;
    commands.subscribe(() => {
      const state = commands.getSnapshot();
      if (!changed && !state.refreshRequired && state.view.status === "success") {
        changed = true;
        if (transition === "logout/login") session.clearSession();
        session.saveSession(tokens); // Even identical credentials establish another generation.
      }
    });
    const returned = await commands.load(period);
    expect(changed).toBe(true);
    expect(returned).toMatchObject({ status: "stale", data: null, error: { code: "STALE_SESSION" } });
    expect(commands.getSnapshot().view).toMatchObject({ status: "idle", data: null });
  });

  it.each(["same period", "another period", "empty view"])("discards an older return if the final emit starts a new load for %s", async (kind) => {
    const { commands, services, fetchTransactions, fetchCategories } = setup();
    if (kind === "empty view") fetchCategories.mockResolvedValue([]);
    fetchTransactions.mockResolvedValue(page());
    await commands.load(period);
    services.createTransaction.mockRejectedValueOnce({ code: "ERR_NETWORK" });
    await commands.createTransaction(input);
    const selected = kind === "same period" ? period : previous;
    let newer, changed = false;
    commands.subscribe(() => {
      const state = commands.getSnapshot();
      if (!changed && !state.refreshRequired && ["success", "empty"].includes(state.view.status)) {
        changed = true;
        newer = commands.load(selected);
      }
    });
    expect(await commands.load(period)).toMatchObject({ status: "stale", data: null, error: { code: "LOAD_SUPERSEDED" } });
    const fresh = await newer;
    expect(changed).toBe(true);
    expect(fresh).toMatchObject({ status: kind === "empty view" ? "empty" : "success", period: selected });
    expect(commands.getSnapshot().view).toBe(fresh);
    expect(commands.getSnapshot().refreshRequired).toBe(false);
  });

  it("executes the next queued command after the previous HTTP rejection", async () => {
    const { commands, services } = setup();
    const rejected = deferred();
    services.createTransaction.mockReturnValueOnce(rejected.promise);
    const first = commands.createTransaction(input);
    const second = commands.deleteTransaction(id);
    await called(services.createTransaction);
    expect(services.deleteTransaction).not.toHaveBeenCalled();
    rejected.reject({ response: { status: 409, data: { mensagem: "Conflito real" } } });
    expect(await first).toMatchObject({ status: "error", error: { status: 409 } });
    const completed = await second;
    expect(completed.status).toBe("confirmed");
    expect(services.deleteTransaction).toHaveBeenCalledOnce();
    expect(commands.getSnapshot()).toMatchObject({ pending: 0, lastResult: completed });
  });

  it("preserves confirmed and refreshRequired when the refresh is cancelled", async () => {
    const { commands, loader, fetchTransactions } = setup();
    await commands.load(period);
    const held = deferred();
    fetchTransactions.mockReturnValueOnce(held.promise);
    const pending = commands.createTransaction(input);
    await called(fetchTransactions, 2);
    loader.cancel();
    held.resolve(page([dto]));
    expect(await pending).toMatchObject({ status: "confirmed", refresh: { status: "required" } });
    expect(commands.getSnapshot()).toMatchObject({ pending: 0, refreshRequired: true,
      view: { status: "cancelled", data: null } });
  });

  it("cannot return data after dispose from the final reconciliation notification", async () => {
    const { commands, services } = setup();
    services.createTransaction.mockRejectedValueOnce({ code: "ERR_NETWORK" });
    await commands.createTransaction(input);
    commands.subscribe(() => {
      const state = commands.getSnapshot();
      if (!state.refreshRequired && state.view.status === "success") commands.dispose();
    });
    expect(await commands.load(period)).toMatchObject({ status: "cancelled", data: null });
    expect(commands.getSnapshot().view.data).toBeNull();
  });

  it("revalidates a CRUD result after its completion subscriber changes session", async () => {
    const { commands } = setup();
    commands.subscribe(() => {
      if (commands.getSnapshot().lastResult?.status === "confirmed") session.saveSession(tokens);
    });
    expect((await commands.createTransaction(input)).status).toBe("stale");
    expect(commands.getSnapshot()).toMatchObject({ pending: 0, lastResult: null });
  });
});

describe("real Axios mutation contracts", () => {
  function real() { const commands = createFinancialCommands(); owners.push(commands); return commands; }
  function adapter(config) {
    if (config.method === "delete") return { config, status: 204, data: "", headers: {} };
    return { config, status: 200, headers: {}, data: config.url.startsWith("/categories")
      ? JSON.stringify(config.method === "get" ? [category] : category)
      : wire(config.method === "get" ? page([dto]) : dto) };
  }

  it("sends exact money as a JSON number, keeps Bearer and preserves GET/PUT/DELETE signatures", async () => {
    const configs = [];
    api.defaults.adapter = async (config) => { configs.push(config); return adapter(config); };
    const commands = real();
    await commands.load(period);
    expect((await commands.updateTransaction(id, { ...input, amount: "99999999999999999.99" })).status).toBe("confirmed");
    const put = configs.find((config) => config.method === "put");
    expect(put.url).toBe(`/transactions/${id}`);
    expect(put.data).toContain('"amount":99999999999999999.99');
    expect(put.data).not.toContain("signedCents");
    expect(put.data).not.toContain("sessionGeneration");
    expect(put.headers.get("Authorization")).toBe("Bearer same-access");
    expect(put.signal).toBeInstanceOf(AbortSignal);
    expect((await commands.deleteTransaction(id)).status).toBe("confirmed");
    const { updateCategory } = await import("../categories.api");
    await expect(updateCategory(categoryId, { name: category.name, type: "BOTH" })).resolves.toEqual(category);
  });

  it("blocks dispatch when session changes in the Axios interceptor gap without notification", async () => {
    const commands = real();
    const dispatched = vi.fn();
    api.defaults.adapter = async (config) => { dispatched(); return adapter(config); };
    // Registered later => executes before the existing Bearer interceptor.
    api.interceptors.request.use((config) => {
      const raw = JSON.parse(sessionStorage.getItem("junta_auth_session"));
      sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...raw, accessToken: "B" }));
      return config;
    });
    expect((await commands.createTransaction(input)).status).toBe("stale");
    expect(dispatched).not.toHaveBeenCalled();
  });

  it("propagates future-date validation from the backend without choosing its timezone locally", async () => {
    let sent;
    api.defaults.adapter = async (config) => {
      sent = JSON.parse(config.data);
      throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 400, config, headers: {},
        data: JSON.stringify({ mensagem: "Erro de validação.", campos: { transactionDate: "A data da transação não pode ser no futuro." } }) });
    };
    const commands = real();
    const completed = await commands.createTransaction({ ...input, transactionDate: "2099-01-01" });
    expect(sent.transactionDate).toBe("2099-01-01");
    expect(completed).toMatchObject({ status: "error", error: { status: 400,
      campos: { transactionDate: "A data da transação não pode ser no futuro." } } });
  });

  it.each(["deleteTransaction", "deleteCategory"])("rejects a non-204 %s response as indeterminate", async (operation) => {
    api.defaults.adapter = async (config) => ({ config, status: 200, data: "", headers: {} });
    const commands = real();
    expect((await commands[operation](operation === "deleteCategory" ? categoryId : id)).status).toBe("indeterminate");
  });

  it("clears the current session on a real 401 without confirming a write", async () => {
    api.defaults.adapter = async (config) => { throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, data: '{"mensagem":"expired"}', config }); };
    const commands = real();
    expect((await commands.createTransaction(input)).status).toBe("stale");
    expect(session.getSessionSnapshot()).toBeNull();
    expect(commands.getSnapshot().lastResult).toBeNull();
  });

  it("does not let a late write 401 clear a new identical-token login", async () => {
    const held = deferred(); let oldConfig;
    api.defaults.adapter = (config) => { oldConfig = config; return held.promise; };
    const commands = real();
    const old = commands.createTransaction(input);
    await vi.waitFor(() => expect(oldConfig).toBeDefined());
    session.clearSession(); session.saveSession(tokens);
    api.defaults.adapter = async (config) => adapter(config);
    const fresh = await commands.createCategory({ name: category.name, type: "BOTH" });
    held.reject(new AxiosError("Rejected", "ERR_BAD_REQUEST", oldConfig, {}, { status: 401, data: "{}", config: oldConfig }));
    expect((await old).status).toBe("stale");
    expect(session.getSessionSnapshot()).not.toBeNull();
    expect(commands.getSnapshot().lastResult).toBe(fresh);
  });
});
