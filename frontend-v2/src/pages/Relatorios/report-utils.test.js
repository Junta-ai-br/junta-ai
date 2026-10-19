import { describe, expect, it } from "vitest";

import { buildReport, getPreviousRange } from "./report-utils";

describe("report-utils month-calendar logic", () => {
  it("keeps the previous range aligned to the previous calendar month", () => {
    expect(getPreviousRange({ start: "2024-03-01", end: "2024-03-31" })).toEqual({
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });

  it("handles the year transition with a full calendar month boundary", () => {
    expect(getPreviousRange({ start: "2025-01-01", end: "2025-01-31" })).toEqual({
      start: "2024-12-01",
      end: "2024-12-31",
    });
  });

  it("keeps 30-day and 31-day months aligned to month boundaries", () => {
    expect(getPreviousRange({ start: "2025-05-01", end: "2025-05-31" })).toEqual({
      start: "2025-04-01",
      end: "2025-04-30",
    });
  });

  it("handles leap-year February correctly", () => {
    expect(getPreviousRange({ start: "2024-02-01", end: "2024-02-29" })).toEqual({
      start: "2024-01-01",
      end: "2024-01-31",
    });
  });

  it("compares March against the complete February in a leap year", () => {
    const marchRange = { start: "2024-03-01", end: "2024-03-31" };
    const februaryRange = getPreviousRange(marchRange);
    const report = buildReport([
      { date: "2024-01-31", amount: -9000, desc: "Janeiro" },
      { date: "2024-02-01", amount: -10, desc: "Início de fevereiro" },
      { date: "2024-02-29", amount: -20, desc: "Fim de fevereiro" },
      { date: "2024-03-01", amount: -60, desc: "Março" },
      { date: "2024-04-01", amount: -8000, desc: "Abril" },
    ], marchRange, februaryRange);

    expect(februaryRange).toEqual({ start: "2024-02-01", end: "2024-02-29" });
    expect(report.summary).toMatchObject({ expenses: 60, expensesChange: "+100,0%" });
  });
  it("preserves exact cents in totals, balance, weekly buckets and comparisons", () => {
    const report = buildReport([
      { date: "2026-08-01", amount: 0.1 }, { date: "2026-08-02", amount: 0.2 },
      { date: "2026-08-03", amount: -0.01 }, { date: "2026-07-01", amount: 0.2 },
    ], { start: "2026-08-01", end: "2026-08-31" }, { start: "2026-07-01", end: "2026-07-31" });
    expect(report.summary).toMatchObject({ income: 0.3, expenses: 0.01, balance: 0.29, incomeChange: "+50,0%" });
    expect(report.chart).toEqual([{ label: "Semana 1", income: 0.3, expenses: 0.01 }]);
  });
  it("preserves the existing day-of-month week grouping across multiple months", () => {
    const report = buildReport([
      { date: "2026-08-01", amount: 10 }, { date: "2026-09-01", amount: 20 }, { date: "2026-10-29", amount: -5 },
    ], { start: "2026-08-01", end: "2026-10-31" }, { start: "2026-05-01", end: "2026-07-31" });
    expect(report.chart).toEqual([{ label: "Semana 1", income: 30, expenses: 0 }, { label: "Semana 5", income: 0, expenses: 5 }]);
  });
});
