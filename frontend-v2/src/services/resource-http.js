import { api } from "./api";
import { FinancialContractError, isDate, isUuid } from "./financial-contracts";

export function invalidResponse() {
  return new FinancialContractError("Resposta inesperada do servidor; operação não confirmada.");
}

export function resourcePath(base, id) {
  if (!isUuid(id)) throw new FinancialContractError("A valid UUID is required.", "ERR_API_REQUEST");
  return `${base}/${encodeURIComponent(id)}`;
}

export async function resourceRequest(method, url, { data, params, validate, transformRequest, transformResponse } = {}) {
  const response = await api.request({ method, url, data, params, requiresAuth: true,
    ...(transformRequest ? { transformRequest } : {}),
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
