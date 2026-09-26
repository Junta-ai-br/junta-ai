import { describe, expect, it } from "vitest";

import { calculateFinancialHealth } from "./financeHealth";

describe("calculateFinancialHealth", () => {
  it("returns a neutral empty state when there is no transaction history", () => {
    expect(calculateFinancialHealth([])).toEqual({
      score: 0,
      savingsRate: 0,
      fixedCommitment: 0,
      consistency: 0,
      status: "Sem dados",
      action: "Registre suas entradas e saídas para acompanhar sua saúde financeira.",
    });
  });

  it("scores a month with income and no expenses as excellent", () => {
    expect(calculateFinancialHealth([
      { date: "2026-08-01", category: "Renda", amount: 1000 },
    ])).toEqual({
      score: 100,
      savingsRate: 100,
      fixedCommitment: 0,
      consistency: 100,
      status: "Excelente",
      action: "Continue mantendo suas entradas acima das saídas.",
    });
  });

  it("averages savings by month and calculates fixed costs and consistency", () => {
    expect(calculateFinancialHealth([
      { date: "2026-08-01", category: "Renda", amount: 1000 },
      { date: "2026-08-02", category: "Moradia", amount: -300 },
      { date: "2026-08-03", category: "Lazer", amount: -100 },
      { date: "2026-09-01", category: "Renda", amount: 500 },
      { date: "2026-09-02", category: "Saúde", amount: -250 },
      { date: "2026-09-03", category: "Lazer", amount: -350 },
    ])).toEqual({
      score: 64,
      savingsRate: 30,
      fixedCommitment: 37,
      consistency: 50,
      status: "Estável",
      action: "Mantenha o saldo mensal positivo ou igual a zero.",
    });
  });

  it("clamps savings when expenses exceed income and prioritizes the savings action", () => {
    const result = calculateFinancialHealth([
      { date: "2026-08-01", category: "Renda", amount: 100 },
      { date: "2026-08-02", category: "Moradia", amount: -200 },
    ]);

    expect(result).toMatchObject({
      savingsRate: 0,
      score: 0,
      status: "Crítico",
      action: "Aumente sua margem mensal de economia.",
    });
  });

  it("treats expenses without income as fully committed fixed costs", () => {
    const result = calculateFinancialHealth([
      { date: "2026-08-01", category: "Transporte", amount: -50 },
    ]);

    expect(result).toMatchObject({
      savingsRate: 0,
      fixedCommitment: 100,
      consistency: 0,
      status: "Crítico",
    });
  });

  it("recommends reducing fixed costs when they exceed half of income", () => {
    expect(calculateFinancialHealth([
      { date: "2026-08-01", category: "Renda", amount: 1000 },
      { date: "2026-08-02", category: "Moradia", amount: -600 },
    ])).toMatchObject({
      fixedCommitment: 60,
      status: "Estável",
      action: "Reduza seus custos fixos para diminuir o risco financeiro.",
    });
  });

  it("reports the attention status for inconsistent months", () => {
    expect(calculateFinancialHealth([
      { date: "2026-08-01", category: "Renda", amount: 1000 },
      { date: "2026-09-01", category: "Renda", amount: 1000 },
      { date: "2026-09-02", category: "Moradia", amount: -1100 },
    ])).toMatchObject({
      score: 55,
      status: "Atenção",
    });
  });

  it("rejects malformed transactions instead of silently scoring them", () => {
    expect(() => calculateFinancialHealth([{ amount: 10 }])).toThrow(TypeError);
    expect(() => calculateFinancialHealth(null)).toThrow(TypeError);
  });
});