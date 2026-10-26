import { resourcePath, resourceRequest } from "./resource-http";
import { FinancialContractError, isDate, isUuid, normalizeMoney } from "./financial-contracts";
import { getSessionSnapshot } from "./auth/session";
import { decimalToCents, normalizeSignedMoney } from "./finance/signed-money";

export function goalPayload({ name, targetAmount, deadline }) {
  name = name.trim();
  if (name.length < 2 || name.length > 150 || (deadline && !isDate(deadline))) throw new FinancialContractError("Informe nome, valor e prazo válidos.");
  const amount = normalizeMoney(targetAmount, { numericInput: false });
  if (decimalToCents(amount) > 99999999999999999n) throw new FinancialContractError("Valor acima do limite da meta.");
  return { name, targetAmount: amount, deadline: deadline || null };
}

export function decodeGoals(raw, _headers, status) {
  if (status !== 200) return raw;
  if (typeof raw !== "string") throw new FinancialContractError("Resposta de metas inválida.");
  JSON.parse(raw); // Do not repair malformed JSON.
  let money = false;
  const exact = raw.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token, offset) => {
    if (money) {
      money = false;
      if (!/^\d/.test(token)) throw new FinancialContractError("Valor de meta inválido.");
      return JSON.stringify(token === "0" || /^0\.0+$/.test(token) ? "0.00" : normalizeMoney(token, { numericInput: false }));
    }
    if (token.startsWith('"') && /^\s*:/.test(raw.slice(offset + token.length))) money = ["targetAmount", "currentAmount"].includes(JSON.parse(token));
    return token;
  });
  return JSON.parse(exact);
}

export function isGoal(value) {
  try {
    return !!value && isUuid(value.id) && typeof value.name === "string" && value.name.trim().length >= 2 && value.name.length <= 150
      && normalizeMoney(value.targetAmount, { numericInput: false }) === value.targetAmount
      && typeof value.currentAmount === "string" && normalizeSignedMoney(value.currentAmount) === value.currentAmount
      && decimalToCents(value.currentAmount) >= 0n && decimalToCents(value.currentAmount) <= 9999999999999999999n
      && (value.deadline === null || isDate(value.deadline)) && ["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(value.status);
  } catch { return false; }
}

function assertOwner(owner) {
  if (!owner || getSessionSnapshot()?.generation !== owner) throw Object.assign(new Error("Sessão alterada."), { code: "SESSION_CHANGED" });
}
export async function listGoals(owner, signal) {
  assertOwner(owner);
  const result = await resourceRequest("get", "/goals", { signal, sessionGeneration: owner, transformResponse: decodeGoals,
    validate: (data) => Array.isArray(data) && data.every(isGoal) && new Set(data.map((g) => g.id.toLowerCase())).size === data.length });
  assertOwner(owner);
  return result;
}
export async function executeGoalCommand(command, owner, signal) {
  assertOwner(owner);
  const options = { signal, sessionGeneration: owner, headers: { "Idempotency-Key": command.key } };
  const result = command.type === "delete"
    ? await resourceRequest("delete", resourcePath("/goals", command.id), options)
    : await resourceRequest("post", "/goals", { ...options, data: command.body, transformResponse: decodeGoals, validate: isGoal });
  assertOwner(owner);
  return result;
}
