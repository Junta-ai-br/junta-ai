import { api } from "./api";
import { getSessionSnapshot } from "./auth/session";
import { FinancialContractError, isDate, isUuid } from "./financial-contracts";

export function invalidResponse() {
  return new FinancialContractError("Resposta inesperada do servidor; operação não confirmada.");
}

export function resourcePath(base, id) {
  if (!isUuid(id)) throw new FinancialContractError("A valid UUID is required.", "ERR_API_REQUEST");
  return `${base}/${encodeURIComponent(id)}`;
}

export async function resourceRequest(method, url, { data, params, validate, transformRequest, transformResponse, signal, sessionGeneration } = {}) {
  // Axios request interceptors run asynchronously. Check again at dispatch time,
  // before serialization/adapter, so an old command cannot be sent as a new user.
  const generationGuard = (body) => {
    if (getSessionSnapshot()?.generation !== sessionGeneration) {
      throw Object.assign(new Error("Command session changed before dispatch."), { code: "SESSION_CHANGED" });
    }
    return body;
  };
  const response = await api.request({ method, url, data, params, requiresAuth: true,
    ...(sessionGeneration ? { transformRequest: [generationGuard, ...(transformRequest ? [transformRequest] : api.defaults.transformRequest)] }
      : transformRequest ? { transformRequest } : {}),
    ...(signal ? { signal } : {}),
    ...(transformResponse ? { transformResponse: [transformResponse, ...api.defaults.transformResponse] } : {}),
  });
  if (method === "delete") {
    if (response.status !== 204 || !(response.data == null || response.data === "")) throw invalidResponse();
    return;
  }
  if (response.status !== 200 || !validate(response.data)) throw invalidResponse();
  return response.data;
}

// Validate the wire format only. Financial and ownership rules belong to the backend.
export function requireDate(value) {
  if (!isDate(value)) {
    throw new FinancialContractError("Date must be a valid YYYY-MM-DD string.", "ERR_API_REQUEST");
  }
  return value;
}
