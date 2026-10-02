import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CATEGORY_META,
  aggregateByCategory,
  aggregateByMonth,
  aggregateCategoryHistory,
  filterByRange,
  formatDateBR,
  formatMoney,
  getCurrentMonthRange,
  loadCategories,
  loadCategoryColors,
  loadDateRange,
  loadGoals,
  loadTransactions,
  saveCategories,
  saveCategoryColors,
  saveDateRange,
  saveGoals,
  saveTransactions,
  summarizeTransactions,
} from "./store";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("finance store date and persistence helpers", () => {
  it("returns UTC month boundaries, including leap years and year rollover", () => {
    expect(getCurrentMonthRange(new Date("2024-02-15T23:00:00-08:00"))).toEqual({
      start: "2024-02-01",
      end: "2024-02-29",
    });
    expect(getCurrentMonthRange(new Date("2025-12-31T12:00:00Z"))).toEqual({
      start: "2025-12-01",
      end: "2025-12-31",
    });
  });

  it("loads saved transactions and falls back to seed data for missing or malformed JSON", () => {
    const seed = loadTransactions();
    expect(seed).toHaveLength(6);
    expect(seed[0]).toMatchObject({ id: "t01", category: "Renda", amount: 4000 });

    localStorage.setItem("junta_transactions", JSON.stringify([{ id: "saved", amount: 25 }]));
    expect(loadTransactions()).toEqual([{ id: "saved", amount: 25 }]);

    localStorage.setItem("junta_transactions", "{");
    expect(loadTransactions()).toEqual(seed);
  });

  it("uses safe defaults when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(loadTransactions()).toHaveLength(6);
    expect(loadCategories()).toEqual(Object.keys(CATEGORY_META));
    expect(loadCategoryColors().Moradia).toBe(CATEGORY_META.Moradia.color);
    expect(loadDateRange()).toEqual({ start: "2026-08-01", end: "2026-08-31" });
    expect(loadGoals()[0]).toMatchObject({ id: "goal-emergency", target: 6000 });
  });

  it("persists transactions, expands the date range and emits its change event", () => {
    const onChange = vi.fn();
    window.addEventListener("junta:transactions-changed", onChange);
    saveDateRange({ start: "2026-08-01", end: "2026-08-31" });
    const transactions = [
      { id: "old", date: "2026-08-01", amount: 100 },
      { id: "new", date: "2026-09-02", amount: -20 },
    ];

    saveTransactions(transactions);

    expect(JSON.parse(localStorage.getItem("junta_transactions"))).toEqual(transactions);
    expect(loadDateRange()).toEqual({ start: "2026-08-01", end: "2026-09-02" });
    expect(onChange).toHaveBeenCalledOnce();
    window.removeEventListener("junta:transactions-changed", onChange);
  });

  it("persists categories, colors, goals, and explicit date ranges", () => {
    const categoryListener = vi.fn();
    const goalListener = vi.fn();
    window.addEventListener("junta:categories-changed", categoryListener);
    window.addEventListener("junta:goals-changed", goalListener);

    saveCategories(["Moradia", "Viagem"]);
    saveCategoryColors({ Viagem: "#123456" });
    saveGoals([{ id: "trip", name: "Viagem", target: 500 }]);
    saveDateRange({ start: "2026-01-01", end: "2026-01-31" });

    expect(loadCategories()).toEqual(["Moradia", "Viagem"]);
    expect(loadCategoryColors()).toMatchObject({ Moradia: CATEGORY_META.Moradia.color, Viagem: "#123456" });
    expect(loadGoals()).toEqual([{ id: "trip", name: "Viagem", target: 500 }]);
    expect(loadDateRange()).toEqual({ start: "2026-01-01", end: "2026-01-31" });
    expect(categoryListener).toHaveBeenCalledTimes(2);
    expect(goalListener).toHaveBeenCalledOnce();
    window.removeEventListener("junta:categories-changed", categoryListener);
    window.removeEventListener("junta:goals-changed", goalListener);
  });

  it("returns defaults for invalid stored JSON", () => {
    localStorage.setItem("junta_categories", "not-json");
    localStorage.setItem("junta_category_colors", "not-json");
    localStorage.setItem("junta_date_range", "not-json");
    localStorage.setItem("junta_goals", "not-json");

    expect(loadCategories()).toEqual(Object.keys(CATEGORY_META));
    expect(loadCategoryColors()).toEqual(Object.fromEntries(Object.entries(CATEGORY_META).map(([name, meta]) => [name, meta.color])));
    expect(loadDateRange()).toEqual({ start: "2026-08-01", end: "2026-08-31" });
    expect(loadGoals()[0].id).toBe("goal-emergency");
  });
});

describe("finance selectors and aggregations", () => {
  const transactions = [
    { date: "2026-08-01", category: "Renda", amount: 1000 },
    { date: "2026-08-02", category: "Moradia", amount: -300 },
    { date: "2026-08-03", category: "Alimentação", amount: -100 },
    { date: "2026-09-01", category: "Moradia", amount: -50 },
  ];

  it("summarizes income, expenses, balance, and count without mutating transactions", () => {
    const items = [
      { amount: 1000 },
      { amount: -250 },
      { amount: 0 },
    ];

    expect(summarizeTransactions(items)).toEqual({
      income: 1000,
      expenses: 250,
      balance: 750,
      transactionCount: 3,
    });
    expect(summarizeTransactions([])).toEqual({ income: 0, expenses: 0, balance: 0, transactionCount: 0 });
    expect(items).toEqual([{ amount: 1000 }, { amount: -250 }, { amount: 0 }]);
  });

  it("filters inclusively by range and treats a null range as all time", () => {
    expect(filterByRange(transactions, { start: "2026-08-02", end: "2026-08-03" })).toEqual(transactions.slice(1, 3));
    expect(filterByRange(transactions, null)).toBe(transactions);
    expect(filterByRange([], { start: "2026-08-01", end: "2026-08-31" })).toEqual([]);
  });

  it("aggregates expense categories, percentages, ordering and fallback colors", () => {
    expect(aggregateByCategory(transactions, ["Renda", "Moradia", "Alimentação", "Lazer"], { Moradia: "#111111" })).toEqual([
      { name: "Moradia", value: 350, pct: 77.8, color: "#111111", icon: "🏠" },
      { name: "Alimentação", value: 100, pct: 22.2, color: CATEGORY_META.Alimentação.color, icon: "🍽️" },
      { name: "Lazer", value: 0, pct: 0, color: CATEGORY_META.Lazer.color, icon: "🎮" },
    ]);
    expect(aggregateByCategory([], ["Renda"])).toEqual([]);
  });

  it("aggregates months chronologically and separates income from expenses", () => {
    expect(aggregateByMonth([
      { date: "2026-10-01", amount: -25 },
      { date: "2026-02-01", amount: 500 },
      { date: "2026-02-15", amount: -80 },
    ])).toEqual([
      { mes: "Fev/26", entradas: 500, saidas: 80 },
      { mes: "Out/26", entradas: 0, saidas: 25 },
    ]);
    expect(aggregateByMonth([])).toEqual([]);
  });

  it("builds category history across year boundaries and ignores income/unknown categories", () => {
    const history = aggregateCategoryHistory([
      { date: "2025-12-20", category: "Moradia", amount: -60 },
      { date: "2025-12-21", category: "Renda", amount: 1000 },
      { date: "2026-01-10", category: "Desconhecida", amount: -900 },
      { date: "2026-02-01", category: "Alimentação", amount: -20 },
    ], ["Renda", "Moradia", "Alimentação"], { Moradia: "#abcdef" });

    expect(history.months).toEqual([
      { key: "2025-12", label: "Dez/25" },
      { key: "2026-01", label: "Jan/26" },
      { key: "2026-02", label: "Fev/26" },
    ]);
    expect(history.categories).toEqual([
      { name: "Moradia", color: "#abcdef", icon: "🏠", total: 60, pct: 75, values: { "2025-12": 60, "2026-01": 0, "2026-02": 0 } },
      { name: "Alimentação", color: CATEGORY_META.Alimentação.color, icon: "🍽️", total: 20, pct: 25, values: { "2025-12": 0, "2026-01": 0, "2026-02": 20 } },
    ]);
    expect(aggregateCategoryHistory([{ date: "2026-01-01", category: "Renda", amount: 5 }], ["Renda"]))
      .toEqual({ months: [], categories: [] });
  });

  it("formats Brazilian dates and absolute currency values", () => {
    expect(formatDateBR("2026-08-09")).toBe("09/08/2026");
    expect(formatMoney(1234.5)).toBe("R$ 1.234,50");
    expect(formatMoney(-12)).toBe("R$ 12,00");
    expect(formatMoney(0)).toBe("R$ 0,00");
  });

  it("fails clearly when required collection or date inputs are malformed", () => {
    expect(() => aggregateByMonth(null)).toThrow(TypeError);
    expect(() => aggregateByCategory(null, ["Moradia"])).toThrow(TypeError);
    expect(() => getCurrentMonthRange(null)).toThrow(TypeError);
    expect(() => formatDateBR(null)).toThrow(TypeError);
  });
});