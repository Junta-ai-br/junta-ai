import { describe, expect, it } from "vitest";
import { MAX_PLANNER_AMOUNT, plannerDecimal, simulationPayload } from "./store";

const snapshot = () => ({ period: { type: "current_month" }, goal: { name: " Reserva ", amount: 12000, deadlineMonths: 12 },
  simulation: { monthlyAmount: 1000.01, estimatedMonths: 12 },
  historyContext: { income: 1000 / 3, fixedExpenses: 10 / 3, totalExpenses: 100 / 3, available: 300, commitmentRate: 100 / 3 } });

describe("Planner contract and precision", () => {
  it("normalizes derived aggregates without changing calculations or user input", () => {
    const input = snapshot();
    expect(simulationPayload(input)).toEqual({ goalName: "Reserva", goalAmount: 12000, deadlineMonths: 12,
      analysisBase: "current_month", monthlyAmount: 1000.01, estimatedMonths: 12,
      historyContext: { income: 333.33, fixedExpenses: 3.33, totalExpenses: 33.33, available: 300, commitmentRate: 33.3333 } });
    expect(input.historyContext.income).toBe(1000 / 3);
  });
  it("supports zero, negative available and commitment above 100 percent", () => {
    const input = snapshot(); input.historyContext = { income: 0, fixedExpenses: 0, totalExpenses: 10, available: -10, commitmentRate: 150.123456 };
    expect(simulationPayload(input).historyContext).toMatchObject({ income: 0, available: -10, commitmentRate: 150.1235 });
  });
  it("accepts minimum cents, maximum safe amount and documented month limits", () => {
    const input = snapshot(); input.goal.amount = MAX_PLANNER_AMOUNT; input.goal.deadlineMonths = 1200;
    input.simulation = { monthlyAmount: 0.01, estimatedMonths: 12000 };
    expect(simulationPayload(input).monthlyAmount).toBe(0.01);
    input.goal.amount = 0.01; expect(simulationPayload(input).goalAmount).toBe(0.01);
  });
  it.each([0, -1, NaN, Infinity, 1.001, MAX_PLANNER_AMOUNT + 1, "1.00"])("rejects invalid input amounts without rounding %s", (value) => {
    const input = snapshot(); input.goal.amount = value; expect(() => simulationPayload(input)).toThrow();
  });
  it.each([0, 1201, 1.5])("rejects invalid deadlines %s", (value) => {
    const input = snapshot(); input.goal.deadlineMonths = value; expect(() => simulationPayload(input)).toThrow();
  });
  it.each([0, 12001, 1.5])("rejects invalid estimated months %s", (value) => {
    const input = snapshot(); input.simulation.estimatedMonths = value; expect(() => simulationPayload(input)).toThrow();
  });
  it.each(["", " ", "x".repeat(151)])("rejects invalid names", (value) => {
    const input = snapshot(); input.goal.name = value; expect(() => simulationPayload(input)).toThrow();
  });
  it("rejects incomplete contexts and unknown bases, accepting no_history only without context", () => {
    const input = snapshot(); input.historyContext = { income: 10 }; expect(() => simulationPayload(input)).toThrow();
    input.historyContext = { ...snapshot().historyContext, income: -1 }; expect(() => simulationPayload(input)).toThrow();
    input.historyContext = null; input.period.type = "unknown"; expect(() => simulationPayload(input)).toThrow();
    input.period.type = "no_history"; expect(simulationPayload(input).historyContext).toBeNull();
    input.historyContext = snapshot().historyContext; expect(() => simulationPayload(input)).toThrow();
    expect(() => plannerDecimal(1.12345, 4)).toThrow();
  });
});
