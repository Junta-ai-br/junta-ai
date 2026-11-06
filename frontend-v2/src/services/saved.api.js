import { resourceRequest } from "./resource-http";
import { decodeDashboard } from "./finance/financeHealth";
import { currentCivilMonth } from "./finance/finance-provider-store";
import { decimalToCents, normalizeSignedMoney } from "./finance/signed-money";

const listeners = new Set();
export const invalidateSaved = (owner) => { for (const listener of listeners) listener(owner); };
export const subscribeSaved = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

export async function loadSaved(owner, signal, { withPosition = false } = {}) {
  const dashboard = await resourceRequest("get", "/dashboard", {
    sessionGeneration: owner, signal, params: currentCivilMonth(), transformResponse: decodeDashboard,
    validate: (value) => typeof value?.saved === "string" && normalizeSignedMoney(value.saved) === value.saved
      && decimalToCents(value.saved) >= 0n,
  });
  const complete = ["availableBalance", "totalTracked"].every((key) => typeof dashboard[key] === "string"
    && normalizeSignedMoney(dashboard[key]) === dashboard[key]) && typeof dashboard.reservationInconsistent === "boolean"
    && decimalToCents(dashboard.availableBalance) + decimalToCents(dashboard.saved) === decimalToCents(dashboard.totalTracked);
  if (!withPosition) return dashboard.saved;
  return { value: dashboard.saved, position: complete ? {
    availableBalance: dashboard.availableBalance, totalTracked: dashboard.totalTracked,
    reservationInconsistent: dashboard.reservationInconsistent,
  } : null };
}
