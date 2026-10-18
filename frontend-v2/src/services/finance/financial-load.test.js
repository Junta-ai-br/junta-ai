import { describe, expect, it } from "vitest";
import { consolidateTransactions, requirePeriod } from "./financial-load";
import { summarizeExact } from "./exact-aggregates";

const dto = Object.freeze({ id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e",
  categoryId: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", categoryName: " \u00a0Educação 💜\u2003 ",
  type: "EXPENSE", description: null, amount: "99999999999999999.99",
  transactionDate: "2026-10-18", createdAt: "2026-10-18T12:00:00Z" });

describe("financial loading contracts", () => {
  it("requires explicit coverage and valid ordered dates", () => {
    expect(requirePeriod({ from: "2020-01-01", to: "2026-10-18" })).toEqual({ from: "2020-01-01", to: "2026-10-18" });
    for (const input of [null, {}, { from: "2020-01-01" }]) {
      expect(() => requirePeriod(input)).toThrow(expect.objectContaining({ code: "COVERAGE_UNKNOWN" }));
    }
    for (const input of [{ from: "2026-02-30", to: "2026-10-18" }, { from: "2027-01-01", to: "2026-10-18" }]) {
      expect(() => requirePeriod(input)).toThrow(expect.objectContaining({ code: "INVALID_PERIOD" }));
    }
  });

  it("deduplicates equivalent records by case-insensitive UUID, preserving the first literal metadata", () => {
    const copy = { ...dto, id: dto.id.toUpperCase(), categoryId: dto.categoryId.toUpperCase() };
    const result = consolidateTransactions([dto, copy, { ...dto }]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ ...dto, signedAmount: "-99999999999999999.99", signedCents: -9999999999999999999n });
    expect(summarizeExact(result).balance).toBe("-99999999999999999.99");
    expect(copy.id).toBe(dto.id.toUpperCase());
    expect(dto).not.toHaveProperty("signedCents");
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
  });

  it.each([
    { amount: "1.00" }, { type: "INCOME" }, { description: "changed" }, { categoryName: "renamed" },
    { categoryId: "a0d3efc5-222f-4576-99d1-1694c80445cf" },
    { transactionDate: "2026-10-17" }, { createdAt: "2026-10-18T12:00:01Z" },
  ])("rejects conflicting copies instead of choosing a last response %j", (fields) => {
    expect(() => consolidateTransactions([dto, { ...dto, ...fields }]))
      .toThrow(expect.objectContaining({ code: "DUPLICATE_CONFLICT" }));
  });

  it("does not merge categories or transactions by equal names", () => {
    expect(consolidateTransactions([dto, { ...dto, id: "8e38acc5-b6ec-464f-8e09-a743a623154b",
      categoryId: "a0d3efc5-222f-4576-99d1-1694c80445cf" }])).toHaveLength(2);
  });
});
