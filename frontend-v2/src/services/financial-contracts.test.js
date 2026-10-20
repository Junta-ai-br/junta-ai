import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { decodeTransactions, FinancialContractError, isCategory, isCategoryName, isTimestamp, isTransaction, normalizeMoney } from "./financial-contracts";

const id = "76870c4b-f8df-4eab-b3c2-de1738a07a4e";
const categoryId = "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3";
const createdAt = "2026-10-18T12:34:56.123456789Z";
const transaction = { id, categoryId, categoryName: "Mercado", type: "EXPENSE", description: null, amount: "12.34", transactionDate: "2026-10-18", createdAt };
const category = { id: categoryId, name: "Mercado", type: "BOTH", createdAt };
const body = { categoryId, type: "EXPENSE", amount: "12.34", transactionDate: "2026-10-18" };
const period = { from: "2020-01-01", to: "2026-10-18" };
const emptyPage = { content: [], number: 0, size: 20, totalElements: 0, totalPages: 0, numberOfElements: 0, first: true, last: true, empty: true };
const page = { ...emptyPage, content: [transaction], totalElements: 1, totalPages: 1, numberOfElements: 1, empty: false };
// Model Jackson's numeric JSON, never stringify a JS Number for arbitrary decimals.
const wire = (data) => JSON.stringify(data).replace(/"amount":"([^"\\]*)"/g, '"amount":$1');
let api, transactions, categories;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear();
  ({ api } = await import("./api"));
  const { saveSession } = await import("./auth/session");
  saveSession({ accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 });
  transactions = await import("./transactions.api");
  categories = await import("./categories.api");
});
afterEach(() => { vi.unstubAllEnvs(); sessionStorage.clear(); });

function respond(data, status = 200) {
  api.defaults.adapter = vi.fn(async (config) => ({ config, data, status, headers: {} }));
}

describe("DTO response contracts", () => {
  it("accepts all mandatory fields and nullable description", () => {
    expect(isTransaction(transaction)).toBe(true);
    expect(isCategory(category)).toBe(true);
    expect(isTransaction({ ...transaction, description: "Mercado" })).toBe(true);
  });

  it.each(Object.keys(transaction))("rejects missing TransactionResponse.%s", (field) => {
    const incomplete = { ...transaction };
    delete incomplete[field];
    expect(isTransaction(incomplete)).toBe(false);
  });
  it.each(Object.keys(category))("rejects missing CategoryResponse.%s", (field) => {
    const incomplete = { ...category };
    delete incomplete[field];
    expect(isCategory(incomplete)).toBe(false);
  });
  it.each([
    { id: "" }, { categoryId: "not-a-uuid" }, { categoryName: null }, { type: "BOTH" },
    { description: 42 }, { transactionDate: "2026-02-30" }, { transactionDate: "18/10/2026" },
    { createdAt: "2026-10-18" }, { createdAt: "2026-02-30T12:00:00Z" }, { createdAt: null },
    { amount: 12.34 },
  ])("rejects invalid transaction fields %j", (fields) => expect(isTransaction({ ...transaction, ...fields })).toBe(false));

  it.each([{ id: "bad" }, { name: " " }, { type: "UNKNOWN" }, { createdAt: "tomorrow" }])(
    "rejects invalid category fields %j", (fields) => expect(isCategory({ ...category, ...fields })).toBe(false),
  );
  it.each(["2026-10-18T24:00:00Z", "2026-10-18T12:60:00Z", "2026-10-18T12:00:00", "2026-02-29T12:00:00Z"])(
    "rejects invalid Instant %s", (value) => expect(isTimestamp(value)).toBe(false),
  );
});

describe("category names match Hibernate Validator 8.0.1.Final", () => {
  const validNames = ["Mercado", "  Mercado  ", "\u00a0\u00a0", "\u2003\u2003",
    " A\u00a0é💜\u2003 ", "a".repeat(2), "a".repeat(120), "💜".repeat(60), " \u00a0"];
  const invalidNames = [null, undefined, "", "a", "\u00a0", "\u2003", "  ", "\t\n", "\u0000\u0020",
    "a".repeat(121), "💜".repeat(61)];

  it.each(validNames)("accepts original UTF-16 name %j in GET, POST and PUT", async (name) => {
    expect(isCategoryName(name)).toBe(true);
    const response = { ...category, name };
    expect(isCategory(response)).toBe(true);
    respond(JSON.stringify([category, response]));
    expect((await categories.listCategories())[1].name).toBe(name);
    for (const method of ["createCategory", "updateCategory"]) {
      respond(JSON.stringify(response));
      const result = method.startsWith("update")
        ? await categories[method](categoryId, { name, type: "BOTH" })
        : await categories[method]({ name, type: "BOTH" });
      expect(result.name).toBe(name);
      const request = api.defaults.adapter.mock.calls[0][0];
      expect(JSON.parse(request.data).name).toBe(name);
    }
  });

  it.each(invalidNames)("rejects name %j according to @NotBlank and @Size", async (name) => {
    expect(isCategoryName(name)).toBe(false);
    expect(isCategory({ ...category, name })).toBe(false);
    respond(category);
    await expect(categories.createCategory({ name, type: "BOTH" })).rejects.toMatchObject({ code: "ERR_API_REQUEST" });
    await expect(categories.updateCategory(categoryId, { name, type: "BOTH" })).rejects.toMatchObject({ code: "ERR_API_REQUEST" });
    expect(api.defaults.adapter).not.toHaveBeenCalled();
  });
});

describe("exact monetary boundary", () => {
  it.each([
    ["0.01", "0.01"], ["00012.3", "12.30"], ["12.3400", "12.34"], ["1e3", "1000.00"],
    ["1E-2", "0.01"], ["99999999999999999.99", "99999999999999999.99"],
    ["90071992547409.91", "90071992547409.91"], ["90071992547409.92", "90071992547409.92"],
    [9999999999.99, "9999999999.99"], [0.29, "0.29"],
  ])("normalizes %s exactly", (input, expected) => expect(normalizeMoney(input)).toBe(expected));

  it.each(["-1.00", "0", "0.00", "1.001", "1,23", "NaN", "Infinity", "", " 1.00", "+1", "1.",
    "100000000000000000.00", "1e999", "0.001", 10000000000, 90071992547409.91, NaN, Infinity, -1, null, undefined, 0.1 + 0.2])(
    "rejects unsafe or invalid money %s", (input) => expect(() => normalizeMoney(input)).toThrow(FinancialContractError),
  );

  it("preserves cents that JSON.parse alone loses", () => {
    const raw = wire({ ...transaction, amount: "99999999999999999.99" });
    expect(JSON.parse(raw).amount).toBe(100000000000000000);
    expect(decodeTransactions(raw, {}, 200).amount).toBe("99999999999999999.99");
  });
  it("rejects extra decimal digits before native parsing can round them away", () => {
    expect(() => decodeTransactions(wire({ ...transaction, amount: "1.00000000000000001" }), {}, 200))
      .toThrow(FinancialContractError);
  });
  it("does not interpret description text as money fields and supports escaped keys", () => {
    const description = 'Texto: "amount":999999999999999999999.123';
    const raw = wire({ ...transaction, description }).replace('"amount":', '"amou\\u006et":');
    expect(decodeTransactions(raw, {}, 200)).toEqual({ ...transaction, description });
  });
  it.each(['{"amount":001}', '{"amount":"12.34"}', '{"amount":1.}', '<html>fallback</html>'])(
    "does not repair incompatible JSON %s", (raw) => expect(() => decodeTransactions(raw, {}, 200)).toThrow(FinancialContractError),
  );
});

describe("HTTP financial services", () => {
  it.each(["createTransaction", "updateTransaction"])("preserves combined description escapes in %s requests and responses", async (method) => {
    const description = 'Aspas " / barra \\ Unicode: ação 💜\n\t literal \\u0061 \\"amount\\":0.001';
    const response = { ...transaction, description, amount: "99999999999999999.99" };
    respond(wire(response));
    const requestBody = { ...body, description, amount: response.amount };
    const result = method.startsWith("update")
      ? await transactions[method](id, requestBody) : await transactions[method](requestBody);
    expect(result).toEqual(response);
    const raw = api.defaults.adapter.mock.calls[0][0].data;
    const parsed = JSON.parse(raw);
    expect(parsed.description).toBe(description);
    expect(parsed.categoryId).toBe(categoryId);
    expect(parsed.type).toBe(body.type);
    expect(parsed.transactionDate).toBe(body.transactionDate);
    expect(raw).toContain('"amount":99999999999999999.99');
  });

  it("preserves a financial 401 raw JSON error and invalidates the current session", async () => {
    const { getSessionState } = await import("./auth/session");
    expect(getSessionState().isAuthenticated).toBe(true);
    const data = { timestamp: createdAt, status: 401, erro: "Unauthorized", mensagem: "Credenciais inválidas." };
    api.defaults.adapter = vi.fn(async (config) => {
      expect(config.headers.get("Authorization")).toBe("Bearer access");
      throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, data: JSON.stringify(data), config, headers: {} });
    });
    await expect(transactions.listTransactions(period)).rejects.toMatchObject({ response: { status: 401, data } });
    expect(getSessionState()).toEqual({ isAuthenticated: false, expiresAt: null });
    expect(api.defaults.adapter).toHaveBeenCalledOnce();
  });
  it.each(["createTransaction", "updateTransaction"])("validates and preserves %s request/response exactly", async (method) => {
    respond(wire({ ...transaction, amount: "99999999999999999.99" }));
    const payload = { ...body, amount: "99999999999999999.99", ignored: "discard" };
    const result = method.startsWith("update") ? await transactions[method](id, payload) : await transactions[method](payload);
    expect(result.amount).toBe("99999999999999999.99");
    const config = api.defaults.adapter.mock.calls[0][0];
    expect(config.data).toContain('"amount":99999999999999999.99');
    expect(config.data).not.toContain('"amount":"');
    expect(config.data).not.toContain("ignored");
    expect(config.headers.get("Content-Type")).toBe("application/json");
  });
  it.each(["createCategory", "updateCategory"])("validates %s", async (method) => {
    respond(category);
    const payload = { name: "Mercado", type: "BOTH" };
    const result = method.startsWith("update") ? await categories[method](categoryId, payload) : await categories[method](payload);
    expect(result).toEqual(category);
    respond({ id });
    await expect(method.startsWith("update") ? categories[method](id, payload) : categories[method](payload))
      .rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
  it.each(["createTransaction", "updateTransaction"])("rejects incomplete %s responses", async (method) => {
    respond('{"id":"' + id + '"}');
    await expect(method.startsWith("update") ? transactions[method](id, body) : transactions[method](body))
      .rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
  it("accepts empty lists and empty Spring Page without substituting errors", async () => {
    respond(wire(emptyPage));
    await expect(transactions.listTransactions(period)).resolves.toEqual(emptyPage);
    respond([]);
    await expect(categories.listCategories()).resolves.toEqual([]);
    respond([category, { ...category, type: "UNKNOWN" }]);
    await expect(categories.listCategories()).rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
  it("rejects one invalid item in an otherwise valid page", async () => {
    respond(wire({ ...page, content: [{ ...transaction, categoryId: "bad" }] }));
    await expect(transactions.listTransactions(period)).rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
  it.each([
    { totalPages: 2 }, { number: -1 }, { size: 0 }, { numberOfElements: 0 }, { empty: true },
    { first: false }, { last: false }, { totalElements: "1" }, { totalElements: 0 }, { content: null },
    { totalElements: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects incompatible page metadata %j", async (fields) => {
    respond(wire({ ...page, ...fields }));
    await expect(transactions.listTransactions(period)).rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
  it.each(["deleteTransaction", "deleteCategory"])("requires empty 204 for %s", async (method) => {
    const service = method === "deleteTransaction" ? transactions : categories;
    respond("", 204);
    await expect(service[method](id)).resolves.toBeUndefined();
    respond({ status: "deleted" }, 204);
    await expect(service[method](id)).rejects.toMatchObject({ code: "ERR_API_RESPONSE" });
  });
  it.each([
    { categoryId: "bad" }, { type: "BOTH" }, { amount: "0" }, { amount: "1.001" },
    { description: 1 }, { transactionDate: "2026-02-30" },
  ])("rejects incompatible requests before HTTP %j", async (fields) => {
    respond(wire(transaction));
    await expect(transactions.createTransaction({ ...body, ...fields })).rejects.toBeInstanceOf(Error);
    expect(api.defaults.adapter).not.toHaveBeenCalled();
  });
  it.each([null, {}, { name: "a", type: "BOTH" }, { name: "Mercado", type: "BAD" }])(
    "rejects invalid category request %j", async (payload) => {
      respond(category);
      await expect(categories.createCategory(payload)).rejects.toMatchObject({ code: "ERR_API_REQUEST" });
      expect(api.defaults.adapter).not.toHaveBeenCalled();
    },
  );
  it.each(["get", "post", "put", "delete"])("preserves HTTP errors on %s", async (method) => {
    const data = { mensagem: "Erro de validação.", campos: { amount: "Inválido" } };
    api.defaults.adapter = vi.fn(async (config) => {
      throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 400, data: JSON.stringify(data), config });
    });
    const operations = {
      get: () => transactions.listTransactions(period), post: () => transactions.createTransaction(body),
      put: () => transactions.updateTransaction(id, body), delete: () => transactions.deleteTransaction(id),
    };
    await expect(operations[method]()).rejects.toMatchObject({ response: { status: 400, data } });
    expect(api.defaults.adapter).toHaveBeenCalledOnce();
  });
});
