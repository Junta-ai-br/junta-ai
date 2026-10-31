import { resourceRequest, requireDate } from "../resource-http";
import { FinancialContractError, isObject } from "../financial-contracts";
import { normalizeSignedMoney } from "./signed-money";

export const HEALTH_METHODOLOGY = "mvp-monthly-v1";
export const HEALTH_COLORS = Object.freeze({
  "Vamos cuidar disso": "var(--red-400)",
  "Hora de ajustar": "var(--amber-600)",
  "Em evolução": "var(--amber-400)",
  "No caminho certo": "var(--purple-300)",
  "Excelente! Tudo tranquilo por aqui!": "var(--green-400)",
});
export const HEALTH_INSUFFICIENT = "Ainda não há lançamentos suficientes para uma avaliação confiável. O indicador será atualizado conforme você registrar suas movimentações.";

export function isOfficialHealthScore(value, period) {
  if (!isObject(value) || value.methodology !== HEALTH_METHODOLOGY
    || value.from !== period.from || value.to !== period.to) return false;
  if (value.status === "INSUFFICIENT_DATA") return value.score === null && value.classification === null;
  return value.status === "CALCULATED" && Number.isInteger(value.score) && value.score >= 0 && value.score <= 100
    && Object.hasOwn(HEALTH_COLORS, value.classification);
}

// Preserve exact monetary lexemes, including zero and negative balances. No score arithmetic here.
export function decodeDashboard(raw) {
  if (typeof raw !== "string") throw new FinancialContractError("Expected dashboard JSON.");
  JSON.parse(raw);
  let monetary = false;
  return JSON.parse(raw.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token, offset) => {
    if (monetary) {
      monetary = false;
      return JSON.stringify(normalizeSignedMoney(token));
    }
    if (token.startsWith('"') && /^\s*:/.test(raw.slice(offset + token.length))) {
      monetary = ["totalIncome", "totalExpense", "balance", "saved"].includes(JSON.parse(token));
    }
    return token;
  }));
}

/** Consume a canonical backend result only when its period and totals match the complete panel read. */
export async function loadOfficialHealthScore(period, summary, options = {}) {
  requireDate(period.from); requireDate(period.to);
  const dashboard = await resourceRequest("get", "/dashboard", {
    ...options, params: period, transformResponse: decodeDashboard,
    validate: (value) => isObject(value) && value.from === period.from && value.to === period.to
      && ["totalIncome", "totalExpense", "balance"].every((key) => typeof value[key] === "string")
      && normalizeSignedMoney(value.totalIncome) === summary.income
      && normalizeSignedMoney(value.totalExpense) === summary.expenses
      && normalizeSignedMoney(value.balance) === summary.balance
      && isOfficialHealthScore(value.healthScore, period),
  });
  return Object.freeze({ ...dashboard.healthScore });
}
