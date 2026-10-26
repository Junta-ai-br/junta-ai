import { resourcePath, resourceRequest } from "../resource-http";
import { FinancialContractError, isDate, isUuid } from "../financial-contracts";
import { decodeGoals, isGoal } from "../goals.api";
import { assertPlannerSession, requirePlannerSession } from "./session";

export async function importPlannerGoal(id, body, key, { signal, sessionGeneration = requirePlannerSession() } = {}) {
  assertPlannerSession(sessionGeneration);
  if (!isUuid(key) || (body.deadline !== null && !isDate(body.deadline)) || typeof body.confirmReimport !== "boolean") {
    throw new FinancialContractError("Dados de importação inválidos.", "ERR_API_REQUEST");
  }
  const goal = await resourceRequest("post", `${resourcePath("/planner/simulations", id)}/goal`, {
    data: { deadline: body.deadline, confirmReimport: body.confirmReimport },
    headers: { "Idempotency-Key": key }, signal, sessionGeneration,
    transformResponse: decodeGoals, validate: isGoal,
  });
  assertPlannerSession(sessionGeneration);
  return goal;
}
