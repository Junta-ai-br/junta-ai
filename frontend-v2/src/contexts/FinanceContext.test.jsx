import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { FinanceProvider } from "@/contexts/FinanceContext";
import useFinanceData from "@/contexts/useFinanceData";
import { saveTransactions } from "@/services/finance/store";

describe("FinanceProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("synchronizes store events and exposes transaction summaries and mutations", () => {
    const { result } = renderHook(() => useFinanceData(), { wrapper: FinanceProvider });

    act(() => {
      saveTransactions([
        { id: "income", amount: 1000, date: "2026-08-01" },
        { id: "expense", amount: -250, date: "2026-08-02" },
      ]);
    });

    expect(result.current.transactions).toHaveLength(2);
    expect(result.current.summary).toEqual({
      income: 1000,
      expenses: 250,
      balance: 750,
      transactionCount: 2,
    });

    act(() => {
      result.current.addTransaction({ id: "extra", amount: -50, date: "2026-08-03" });
    });

    expect(result.current.transactions).toHaveLength(3);
    expect(result.current.summary.balance).toBe(700);
  });
});
