import { describe, expect, it } from "vitest";
import { comparePeriods, groupByCategoryId, groupByMonth, summarizeExact, summarizePeriod } from "./exact-aggregates";
import { transactionDtoToView } from "./transaction-adapter";

const categoryA = "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3";
const categoryB = "a0d3efc5-222f-4576-99d1-1694c80445cf";
function view(fields = {}) {
  return Object.freeze(transactionDtoToView({
    id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: categoryA, categoryName: "Mesmo nome 💜",
    type: "INCOME", description: null, amount: "100.00", transactionDate: "2026-10-18",
    createdAt: "2026-10-18T12:00:00Z", ...fields,
  }));
}
const september = Object.freeze({ from: "2026-09-01", to: "2026-09-30" });
const october = Object.freeze({ from: "2026-10-01", to: "2026-10-31" });

describe("exact transaction aggregates", () => {
  it("returns an explicit zero summary for an empty input", () => {
    expect(summarizeExact([])).toEqual({ income: "0.00", expenses: "0.00", balance: "0.00",
      incomeCents: 0n, expensesCents: 0n, balanceCents: 0n, transactionCount: 0 });
    expect(groupByCategoryId([])).toEqual([]);
    expect(groupByMonth([])).toEqual([]);
  });

  it("preserves a deficit and separates positive expense totals from signed records", () => {
    const transactions = Object.freeze([view(), view({ type: "EXPENSE", amount: "120.00" })]);
    expect(summarizeExact(transactions)).toEqual({ income: "100.00", expenses: "120.00", balance: "-20.00",
      incomeCents: 10000n, expensesCents: 12000n, balanceCents: -2000n, transactionCount: 2 });
    expect(transactions[1].signedAmount).toBe("-120.00");
    expect(transactions[1].amount).toBe("120.00");
  });

  it("sums fractions exactly and cancels equal income and expense magnitudes", () => {
    expect(summarizeExact([view({ amount: "0.10" }), view({ amount: "0.20" })]).income).toBe("0.30");
    expect(summarizeExact([view({ amount: "120.05" }), view({ type: "EXPENSE", amount: "120.05" })]).balance).toBe("0.00");
  });

  it("does not cap aggregate totals to one NUMERIC(19,2) transaction", () => {
    const amount = "99999999999999999.99";
    expect(summarizeExact([view({ amount }), view({ amount })]).income).toBe("199999999999999999.98");
    expect(summarizeExact([view({ amount, type: "EXPENSE" }), view({ amount, type: "EXPENSE" })]).balance)
      .toBe("-199999999999999999.98");
  });

  it("groups distinct UUIDs separately even when category names are identical", () => {
    const result = groupByCategoryId([
      view({ categoryId: categoryA, amount: "0.10" }),
      view({ categoryId: categoryB, amount: "0.20" }),
      view({ categoryId: categoryA, amount: "0.01", type: "EXPENSE" }),
    ]);
    expect(result.map((item) => [item.categoryId, item.balance])).toEqual([[categoryA, "0.09"], [categoryB, "0.20"]]);
    expect(result[0].transactionCount).toBe(2);
  });

  it("does not infer income from a category name or split a UUID after a rename", () => {
    const result = groupByCategoryId([
      view({ categoryName: "Renda", type: "EXPENSE" }),
      view({ categoryName: "Nome atualizado", amount: "20.00" }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ categoryId: categoryA, income: "20.00", expenses: "100.00", balance: "-80.00" });
  });

  it("groups calendar months in order across years without mutating inputs", () => {
    const input = Object.freeze([
      view({ transactionDate: "2026-10-01", type: "EXPENSE", amount: "0.01" }),
      view({ transactionDate: "2025-12-31", amount: "0.10" }),
      view({ transactionDate: "2026-10-31", amount: "0.20" }),
    ]);
    expect(groupByMonth(input).map(({ month, balance }) => [month, balance]))
      .toEqual([["2025-12", "0.10"], ["2026-10", "0.19"]]);
    expect(input[0].transactionDate).toBe("2026-10-01");
  });

  it("uses inclusive period bounds and distinguishes no records from invalid input", () => {
    const input = [view({ transactionDate: "2026-09-30", amount: "9.00" }),
      view({ transactionDate: "2026-10-01", amount: "0.01" }), view({ transactionDate: "2026-10-31", amount: "0.02" })];
    expect(summarizePeriod(input, october).income).toBe("0.03");
    expect(summarizePeriod(input, september).income).toBe("9.00");
    expect(summarizePeriod(input, { from: "2026-10-02", to: "2026-10-30" }).transactionCount).toBe(0);
  });

  it("returns current-minus-previous signed differences, including lower expenses", () => {
    const input = [view({ transactionDate: "2026-09-01", amount: "100.00" }),
      view({ transactionDate: "2026-09-30", type: "EXPENSE", amount: "50.00" }),
      view({ transactionDate: "2026-10-01", amount: "20.00" }),
      view({ transactionDate: "2026-10-31", type: "EXPENSE", amount: "40.00" })];
    const result = comparePeriods(input, october, september);
    expect(result.current.balance).toBe("-20.00");
    expect(result.previous.balance).toBe("50.00");
    expect(result.difference).toEqual({ income: "-80.00", expenses: "-10.00", balance: "-70.00",
      incomeCents: -8000n, expensesCents: -1000n, balanceCents: -7000n });
  });

  it.each([null, {}, { from: "2026-02-30", to: "2026-10-31" }, { from: "2026-11-01", to: "2026-10-31" }])(
    "rejects invalid periods %j", (period) => {
      expect(() => summarizePeriod([], period)).toThrow();
      expect(() => comparePeriods([], october, period)).toThrow();
    },
  );

  it("rejects inconsistent or unadapted records instead of silently skipping them", () => {
    expect(() => summarizeExact(null)).toThrow();
    expect(() => summarizeExact(new Array(1))).toThrow();
    const inconsistent = { ...view(), signedCents: -10000n };
    for (const aggregate of [summarizeExact, groupByCategoryId, groupByMonth]) {
      expect(() => aggregate([inconsistent])).toThrow();
      expect(() => aggregate([{ amount: "1.00", type: "INCOME" }])).toThrow();
    }
    expect(() => summarizePeriod([{ ...view(), signedAmount: "-100.00" }], september)).toThrow();
  });
});
