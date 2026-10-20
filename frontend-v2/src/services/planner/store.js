import { resourcePath, resourceRequest } from "../resource-http";
import { isTimestamp, isUuid } from "../financial-contracts";
import { assertPlannerSession, requirePlannerSession } from "./session";

export const PERIOD_LABELS = { current_month: "Mês atual", last_30_days: "Últimos 30 dias",
  last_3_months: "Média dos últimos 3 meses", no_history: "Sem histórico" };
// Conservative Number range, shared with the existing financial contracts.
export const MAX_PLANNER_AMOUNT = 9999999999.99;
const invalid = () => Object.assign(new Error("Invalid planner values."), { code: "PLANNER_INVALID" });
const integer = (value, max) => Number.isInteger(value) && value >= 1 && value <= max;

export function plannerDecimal(value, places = 2, { derived = false, negative = false } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > MAX_PLANNER_AMOUNT || (!negative && value < 0)) throw invalid();
  const normalized = Number(value.toFixed(places));
  if (!derived && normalized !== value) throw invalid();
  return normalized;
}

function context(value, derived) {
  if (value == null) return null;
  return Object.fromEntries(["income", "fixedExpenses", "totalExpenses", "available", "commitmentRate"].map((field) =>
    [field, plannerDecimal(value[field], field === "commitmentRate" ? 4 : 2, { derived, negative: field === "available" })]));
}

function validatePayload(body) {
  if (typeof body.goalName !== "string" || !body.goalName.trim() || body.goalName.length > 150
    || !Object.hasOwn(PERIOD_LABELS, body.analysisBase) || !integer(body.deadlineMonths, 1200)
    || !integer(body.estimatedMonths, 12000)) throw invalid();
  if (plannerDecimal(body.goalAmount) < 0.01 || plannerDecimal(body.monthlyAmount) < 0.01) throw invalid();
  context(body.historyContext, false);
  return true;
}

export function simulationPayload(simulation) {
  const body = {
    goalName: simulation.goal?.name?.trim(), goalAmount: simulation.goal?.amount,
    deadlineMonths: simulation.goal?.deadlineMonths, analysisBase: simulation.period?.type,
    monthlyAmount: simulation.simulation?.monthlyAmount, estimatedMonths: simulation.simulation?.estimatedMonths,
    historyContext: context(simulation.historyContext, true),
  };
  validatePayload(body);
  if (body.analysisBase === "no_history" && body.historyContext !== null) throw invalid();
  return body;
}

function validResponse(body) {
  try { return !!body && isUuid(body.id) && isTimestamp(body.createdAt) && validatePayload(body); }
  catch { return false; }
}

export function simulationView(body) {
  return { id: body.id, createdAt: body.createdAt,
    period: { type: body.analysisBase, label: PERIOD_LABELS[body.analysisBase], usesHistory: body.analysisBase !== "no_history" },
    goal: { name: body.goalName, amount: body.goalAmount, deadlineMonths: body.deadlineMonths },
    simulation: { monthlyAmount: body.monthlyAmount, estimatedMonths: body.estimatedMonths },
    historyContext: context(body.historyContext, false) };
}

const base = "/planner/simulations";
export async function loadPlannerSimulations({ signal } = {}) {
  const generation = requirePlannerSession();
  const data = await resourceRequest("get", base, { signal, sessionGeneration: generation,
    validate: (body) => Array.isArray(body) && body.every(validResponse) && new Set(body.map((item) => item.id.toLowerCase())).size === body.length });
  assertPlannerSession(generation);
  return data.map(simulationView);
}

export async function savePlannerSimulation(simulation) {
  const generation = requirePlannerSession();
  const data = await resourceRequest("post", base, { data: simulationPayload(simulation), sessionGeneration: generation, validate: validResponse });
  assertPlannerSession(generation);
  return simulationView(data);
}

export async function removePlannerSimulation(id) {
  const generation = requirePlannerSession();
  await resourceRequest("delete", resourcePath(base, id), { sessionGeneration: generation });
  assertPlannerSession(generation);
}
