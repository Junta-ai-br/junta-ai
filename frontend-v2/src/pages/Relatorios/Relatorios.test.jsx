import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/utils/formatters";
import { buildReport, getChange, getPeriodRange, getPreviousRange } from "./report-utils";

describe("report period helpers", () => {
  it.each([
    ["2026-02", "monthly", { start: "2026-02-01", end: "2026-02-28" }],
    ["2024-02", "monthly", { start: "2024-02-01", end: "2024-02-29" }],
    ["2026-11", "quarterly", { start: "2026-11-01", end: "2027-01-31" }],
    ["2026-08", "half-year", { start: "2026-08-01", end: "2027-01-31" }],
    ["2026-08", "yearly", { start: "2026-01-01", end: "2026-12-31" }],
  ])("creates the %s %s range", (month, period, expected) => {
    expect(getPeriodRange(month, period)).toEqual(expected);
  });

  it("calculates the immediately preceding range, including leap days", () => {
    expect(getPreviousRange({ start: "2024-03-01", end: "2024-03-31" })).toEqual({
      start: "2024-01-30",
      end: "2024-02-29",
    });
  });
});

describe("report comparison", () => {
  it.each([
    [0, 0, "0%"],
    [200, 0, "+100%"],
    [0, 200, "-100,0%"],
    [125, 100, "+25,0%"],
    [75, 100, "-25,0%"],
    [200, null, "+100%"],
  ])("formats change from %s against %s", (current, previous, expected) => {
    expect(getChange(current, previous)).toBe(expected);
  });
});

describe("buildReport", () => {
  const range = { start: "2026-08-01", end: "2026-08-31" };
  const previousRange = { start: "2026-07-01", end: "2026-07-31" };

  it("summarizes transactions, weekly activity, and period insights", () => {
    const transactions = [
      { date: "2026-08-01", amount: 2000, desc: "Salário" },
      { date: "2026-08-08", amount: -120, desc: "Aluguel" },
      { date: "2026-08-16", amount: -80, desc: "Conta" },
      { date: "2026-08-31", amount: 500, desc: "Freelance" },
      { date: "2026-07-01", amount: 2000, desc: "Salário anterior" },
      { date: "2026-07-08", amount: -100, desc: "Conta anterior" },
      { date: "2026-09-01", amount: 9000, desc: "Fora do período" },
    ];

    const report = buildReport(transactions, range, previousRange);

    expect(report.period).toBe("agosto de 2026");
    expect(report.summary).toEqual({
      income: 2500,
      expenses: 200,
      balance: 2300,
      incomeChange: "+25,0%",
      expensesChange: "+100,0%",
      balanceChange: "+21,1%",
    });
    expect(report.chart).toEqual([
      { label: "Semana 1", income: 2000, expenses: 0 },
      { label: "Semana 2", income: 0, expenses: 120 },
      { label: "Semana 3", income: 0, expenses: 80 },
      { label: "Semana 5", income: 500, expenses: 0 },
    ]);
    expect(report.insights).toEqual([
      { label: "Maior receita", value: formatCurrency(2000), detail: "Salário", tone: "positive" },
      { label: "Maior despesa", value: formatCurrency(120), detail: "Aluguel", tone: "negative" },
      { label: "Total de movimentações", value: "4 lançamentos", detail: "2 entradas · 2 saídas", tone: "neutral" },
    ]);
    expect(report.hasTransactions).toBe(true);
  });

  it("returns stable zero values for an empty period", () => {
    const report = buildReport([], range, previousRange);

    expect(report).toMatchObject({
      period: "agosto de 2026",
      summary: {
        income: 0,
        expenses: 0,
        balance: 0,
        incomeChange: "0%",
        expensesChange: "0%",
        balanceChange: "0%",
      },
      chart: [],
      hasTransactions: false,
    });
    expect(report.insights.map(({ detail }) => detail)).toEqual([
      "Nenhuma entrada",
      "Nenhuma saída",
      "0 entradas · 0 saídas",
    ]);
  });

  it("labels ranges spanning multiple months", () => {
    const report = buildReport(
      [{ date: "2026-08-15", amount: 100, desc: "Receita" }],
      { start: "2026-08-01", end: "2026-09-30" },
      previousRange,
    );

    expect(report.period).toBe("agosto de 2026 a setembro de 2026");
  });
});