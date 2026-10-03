import { describe, expect, it } from "vitest";

import { formatCompactCurrency, formatCurrency, formatMoney, formatPercent, formatPeriod } from "./formatters";

describe("report formatters", () => {
  it("formats currency with Brazilian separators and stable negative handling", () => {
    expect(formatCurrency(1234.5)).toBe("R$ 1.234,50");
    expect(formatCurrency(-12)).toBe("-R$ 12,00");
    expect(formatCurrency(0)).toBe("R$ 0,00");
    expect(formatCurrency(null)).toBe("R$ 0,00");
    expect(formatCurrency(undefined)).toBe("R$ 0,00");
  });

  it("rounds long decimal values to cents and falls back for non-finite values", () => {
    expect(formatCurrency(1234.567891)).toBe("R$ 1.234,57");
    expect(formatCurrency(-12.9999)).toBe("-R$ 13,00");
    expect(formatCurrency(Number.NaN)).toBe("R$ 0,00");
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("R$ 0,00");
  });

  it("keeps the legacy monetary alias absolute and stable for UI labels", () => {
    expect(formatMoney(1234.5)).toBe("R$ 1.234,50");
    expect(formatMoney(-12)).toBe("R$ 12,00");
    expect(formatMoney(0)).toBe("R$ 0,00");
    expect(formatMoney(null)).toBe("R$ 0,00");
    expect(formatMoney(undefined)).toBe("R$ 0,00");
    expect(formatMoney(-1234.567891)).toBe("R$ 1.234,57");
  });

  it("formats percentages via Intl.NumberFormat and accepts values above 1 as percent units", () => {
    expect(formatPercent(0.25)).toBe("25%");
    expect(formatPercent(25)).toBe("25%");
    expect(formatPercent(-0.5)).toBe("-50%");
    expect(formatPercent(0.125)).toBe("12,5%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("formats compact values and preserves sign", () => {
    expect(formatCompactCurrency(1250000)).toMatch(/R\$\s*1,3/);
    expect(formatCompactCurrency(-1250000)).toMatch(/-R\$\s*1,3/);
    expect(formatCompactCurrency(0)).toMatch(/R\$\s*0/);
  });

  it("formats a valid period and handles a missing period", () => {
    expect(formatPeriod("2026-08")).toBe("agosto de 2026");
    expect(formatPeriod(null)).toBe("Selecione um período");
    expect(formatPeriod("")).toBe("Selecione um período");
  });

  it("throws for an invalid non-empty period", () => {
    expect(() => formatPeriod("not-a-period")).toThrow(RangeError);
  });
});