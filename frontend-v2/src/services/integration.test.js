import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let api, session, transactions, categories, requests;
const tokens = { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 };
const transaction = { categoryId: "category-id", type: "EXPENSE", description: "Mercado", amount: 12.34, transactionDate: "2026-10-18" };
const category = { name: "Mercado", type: "BOTH" };
const period = { from: "2020-01-01", to: "2026-10-18" };
const page = { content: [{ id: "transaction-id", ...transaction }], number: 2, size: 10, totalElements: 21, totalPages: 3, last: true };

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear();
  ({ api } = await import("./api"));
  session = await import("./auth/session");
  transactions = await import("./transactions.api");
  categories = await import("./categories.api");
  session.saveSession(tokens);
  requests = [];
  api.defaults.adapter = vi.fn(async (config) => {
    requests.push(config);
    const data = config.method === "get" ? (config.url === "/transactions" ? page : [{ id: "category-id", ...category }])
      : { id: "resource-id", ...JSON.parse(config.data || "{}") };
    return { config, status: config.method === "delete" ? 204 : 200, data, headers: {} };
  });
});

afterEach(() => { vi.unstubAllEnvs(); sessionStorage.clear(); });

describe("authenticated HTTP client", () => {
  it("reads the latest token on every protected request and keeps auth endpoints anonymous", async () => {
    await categories.listCategories();
    session.saveSession({ ...tokens, accessToken: "new-access" });
    await categories.listCategories();
    await api.post("/auth/refresh", { refreshToken: "refresh" });
    expect(requests.map((r) => r.headers.get("Authorization"))).toEqual(["Bearer access", "Bearer new-access", undefined]);
  });

  it.each(["missing", "expired", "logout"])("blocks %s sessions before sending HTTP", async (kind) => {
    if (kind === "expired") {
      sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...tokens, expiresAt: Date.now() - 1 }));
    } else session.clearSession();
    await expect(categories.listCategories()).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(api.defaults.adapter).not.toHaveBeenCalled();
  });

  it("blocks protected requests when the URL is missing", async () => {
    vi.stubEnv("VITE_API_URL", "");
    vi.resetModules();
    const service = await import("./categories.api");
    await expect(service.listCategories()).rejects.toMatchObject({ code: "API_UNAVAILABLE" });
  });

  it.each([401, 403])("propagates %s once and only clears the matching session on 401", async (status) => {
    const listener = vi.fn();
    const unsubscribe = session.subscribeSession(listener);
    api.defaults.adapter = vi.fn(async (config) => {
      throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status, data: "", config });
    });
    await expect(categories.listCategories()).rejects.toMatchObject({ response: { status } });
    expect(api.defaults.adapter).toHaveBeenCalledTimes(1);
    expect(session.getSessionState().isAuthenticated).toBe(status !== 401);
    expect(listener).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
    unsubscribe();
  });

  it("does not clear a newer login when an older request returns 401", async () => {
    api.defaults.adapter = async (config) => {
      session.saveSession({ ...tokens, accessToken: "new-access" });
      throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, config });
    };
    await expect(categories.listCategories()).rejects.toMatchObject({ response: { status: 401 } });
    expect(session.getStoredSession().accessToken).toBe("new-access");
  });

  it("does not end a valid session for an invalid OTP", async () => {
    api.defaults.adapter = async (config) => { throw new AxiosError("Invalid OTP", "ERR_BAD_REQUEST", config, {}, { status: 401, config }); };
    await expect(api.post("/auth/access-code/verify", {})).rejects.toThrow("Invalid OTP");
    expect(session.getStoredSession()).toMatchObject(tokens);
  });
});

describe("resource contracts", () => {
  it("preserves the full Spring Page and explicit historical period", async () => {
    await expect(transactions.listTransactions({ ...period, page: 2, size: 10, sort: "transactionDate,desc" })).resolves.toEqual(page);
    expect(requests[0].params).toEqual({ ...period, page: 2, size: 10, sort: "transactionDate,desc" });
    expect(requests[0].method).toBe("get");
    expect(api.getUri(requests[0])).toContain("from=2020-01-01&to=2026-10-18&page=2&size=10&sort=transactionDate,desc");
  });

  it.each([{}, { from: period.from }, { ...period, from: "2026-02-30" }, { ...period, to: new Date() }, { ...period, from: "2027-01-01" }, { ...period, page: -1 }, { ...period, size: 0 }])("rejects invalid periods/pagination %j", async (params) => {
    await expect(transactions.listTransactions(params)).rejects.toThrow();
    expect(requests).toHaveLength(0);
  });

  it("lists categories with the real enums", async () => {
    await expect(categories.listCategories()).resolves.toEqual([{ id: "category-id", ...category }]);
    expect(categories.CATEGORY_TYPES).toEqual(["INCOME", "EXPENSE", "BOTH"]);
    expect(transactions.TRANSACTION_TYPES).toEqual(["INCOME", "EXPENSE"]);
  });

  it.each(["Transaction", "Category"])("creates, updates and deletes a %s using only DTO fields", async (kind) => {
    const service = kind === "Transaction" ? transactions : categories;
    const body = kind === "Transaction" ? transaction : category;
    const base = kind === "Transaction" ? "/transactions" : "/categories";
    await expect(service[`create${kind}`]({ ...body, userId: "ignored" })).resolves.toEqual({ id: "resource-id", ...body });
    await service[`update${kind}`]("resource-id", body);
    await expect(service[`delete${kind}`]("resource-id")).resolves.toBeUndefined();
    expect(requests.map(({ method, url }) => [method, url])).toEqual([["post", base], ["put", `${base}/resource-id`], ["delete", `${base}/resource-id`]]);
    expect(JSON.parse(requests[0].data)).toEqual(body);
    expect(JSON.parse(requests[1].data)).toEqual(body);
  });

  it.each([400, 401, 403, 404, 409, "ERR_NETWORK", "ECONNABORTED"])("propagates %s from both services without fallback or retry", async (failure) => {
    const data = { timestamp: "2026-10-18T00:00:00Z", status: failure, erro: "Bad Request", mensagem: "Erro de validação.", campos: { amount: "Valor inválido." } };
    api.defaults.adapter = vi.fn(async (config) => {
      throw new AxiosError("Failure", typeof failure === "string" ? failure : "ERR_BAD_REQUEST", config, {}, typeof failure === "number" ? { status: failure, data, config } : undefined);
    });
    for (const operation of [() => transactions.createTransaction(transaction), () => categories.createCategory(category)]) {
      session.saveSession(tokens);
      await expect(operation()).rejects.toMatchObject(typeof failure === "number" ? { response: { status: failure, data } } : { code: failure });
    }
    expect(api.defaults.adapter).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["transactions", 200, []], ["categories", 200, "<html>fallback</html>"],
    ["create", 200, {}], ["delete", 200, ""],
  ])("rejects unconfirmed %s responses", async (kind, status, data) => {
    api.defaults.adapter = async (config) => ({ config, status, data, headers: {} });
    const operations = {
      transactions: () => transactions.listTransactions(period), categories: () => categories.listCategories(),
      create: () => transactions.createTransaction(transaction), delete: () => categories.deleteCategory("id"),
    };
    await expect(operations[kind]()).rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
});
