import { describe, expect, it } from "vitest";

import { formatCompactCurrency, formatCurrency, formatPeriod } from "./formatters";

describe("report formatters", () => {
  it("formats currency with Brazilian separators and two decimal places", () => {
    expect(formatCurrency(1234.5)).toBe("R$\u00a01.234,50");
    expect(formatCurrency(-12)).toBe("-R$\u00a012,00");
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
    expect(formatCurrency(null)).toBe("R$\u00a00,00");
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