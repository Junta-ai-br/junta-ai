import { afterEach, describe, expect, it, vi } from "vitest";
import { assertTransactionView, prepareTransactionRequest, transactionDtoToView, transactionViewToRequest } from "./transaction-adapter";

const dto = Object.freeze({
  id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3",
  categoryName: " \u00a0Educação 💜\u2003 ", type: "EXPENSE", description: 'Aspas " e barra \\ Unicode 💜\n',
  amount: "120.05", transactionDate: "2026-10-18", createdAt: "2026-10-18T12:34:56.123456789Z",
});
afterEach(() => { vi.unstubAllEnvs(); sessionStorage.clear(); });

describe("pure transaction adaptation", () => {
  it.each([["INCOME", "120.05", 12005n], ["EXPENSE", "-120.05", -12005n]])(
    "derives %s signs exactly once and preserves DTO metadata", (type, signedAmount, signedCents) => {
      const input = Object.freeze({ ...dto, type });
      const view = transactionDtoToView(input);
      expect(view).toEqual({ ...input, signedAmount, signedCents });
      expect(view).not.toBe(input);
      expect(input).not.toHaveProperty("signedAmount");
      // Re-adapting response fields cannot invert an expense a second time.
      expect(transactionDtoToView(view)).toEqual(view);
      expect(assertTransactionView(view)).toBe(view);
    },
  );

  it.each(["INCOME", "EXPENSE"])("round-trips %s through request fields only", (type) => {
    const input = Object.freeze({ ...dto, type });
    const view = Object.freeze(transactionDtoToView(input));
    const request = transactionViewToRequest(view);
    expect(request).toEqual({ categoryId: dto.categoryId, type, description: dto.description,
      amount: "120.05", transactionDate: dto.transactionDate });
    expect(JSON.parse(JSON.stringify(request))).toEqual(request);
    expect(request).not.toHaveProperty("id");
    expect(request).not.toHaveProperty("categoryName");
    expect(request).not.toHaveProperty("createdAt");
    expect(request).not.toHaveProperty("signedCents");
    expect(() => JSON.stringify(view)).toThrow(TypeError);
    expect(input).toEqual({ ...dto, type });
  });

  it("supports one cent and the full positive transaction limit", () => {
    for (const amount of ["0.01", "99999999999999999.99"]) {
      const view = transactionDtoToView({ ...dto, amount });
      expect(view.signedAmount).toBe(`-${amount}`);
      expect(transactionViewToRequest(view).amount).toBe(amount);
    }
  });

  it.each([
    { type: undefined }, { type: "TRANSFER" }, { amount: "-120.05" }, { amount: "0.00" },
    { amount: "-0.00" }, { amount: "100000000000000000.00" }, { amount: "0.001" },
    { amount: "1e2" }, { amount: 120.05 }, { categoryId: "Educação" },
    { transactionDate: "2026-02-30" }, { description: 1 }, { description: "a".repeat(501) },
  ])("rejects invalid writes without guessing type or changing magnitude %j", (fields) => {
    expect(() => prepareTransactionRequest({ ...dto, ...fields })).toThrow();
  });

  it.each([
    { signedAmount: "120.05" }, { signedCents: 12005n }, { signedCents: "-12005" },
    { type: "INCOME" }, { amount: "120.06" }, { signedAmount: "-120.06" },
  ])("rejects inconsistent view case %#", (fields) => {
    expect(() => transactionViewToRequest({ ...transactionDtoToView(dto), ...fields }))
      .toThrow(expect.objectContaining({ code: "ERR_TRANSACTION_ADAPTER" }));
  });

  it("requires valid response fields and keeps null description", () => {
    expect(transactionDtoToView({ ...dto, description: null }).description).toBeNull();
    expect(() => transactionDtoToView({ ...dto, id: "local-id" })).toThrow();
    expect(() => transactionDtoToView({ ...dto, amount: "-120.05" })).toThrow();
    expect(() => transactionDtoToView({ ...dto, categoryName: undefined })).toThrow();
    expect(() => prepareTransactionRequest(null)).toThrow();
  });

  it("prepares forms with explicit positive magnitude and no response metadata", () => {
    const request = prepareTransactionRequest({ ...dto, amount: "000120.5", description: undefined });
    expect(request.amount).toBe("120.50");
    expect(request.description).toBeNull();
    expect(dto.amount).toBe("120.05");
  });

  it("feeds the unchanged HTTP service without BigInt or precision loss on the wire", async () => {
    vi.stubEnv("VITE_API_URL", "https://backend.example.test");
    const { api } = await import("../api");
    const { saveSession } = await import("../auth/session");
    const { createTransaction } = await import("../transactions.api");
    saveSession({ accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 });
    const input = { ...dto, amount: "99999999999999999.99" };
    const raw = JSON.stringify(input).replace('"amount":"99999999999999999.99"', '"amount":99999999999999999.99');
    let sent;
    api.defaults.adapter = async (config) => {
      sent = config.data;
      return { config, status: 200, data: raw, headers: {} };
    };
    expect(await createTransaction(transactionViewToRequest(transactionDtoToView(input)))).toEqual(input);
    expect(sent).toContain('"amount":99999999999999999.99');
    expect(sent).not.toContain("signedCents");
    expect(sent).not.toContain("signedAmount");
    expect(JSON.parse(sent).description).toBe(dto.description);
  });
});
