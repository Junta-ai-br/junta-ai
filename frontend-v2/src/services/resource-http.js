import { api } from "./api";

export function invalidResponse() {
  return Object.assign(new Error("Resposta inesperada do servidor; operação não confirmada."), { code: "ERR_API_RESPONSE" });
}

export const isResource = (value) => value !== null && typeof value === "object"
  && !Array.isArray(value) && typeof value.id === "string";

export function resourcePath(base, id) {
  if (typeof id !== "string" || !id.trim()) throw new Error("Resource ID is required.");
  return `${base}/${encodeURIComponent(id)}`;
}

export async function resourceRequest(method, url, { data, params, validate = isResource } = {}) {
  const response = await api.request({ method, url, data, params, requiresAuth: true });
  if (method === "delete") {
    if (response.status !== 204) throw invalidResponse();
    return;
  }
  if (response.status !== 200 || !validate(response.data)) throw invalidResponse();
  return response.data;
}

// Validate the wire format only. Financial and ownership rules belong to the backend.
export function requireDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error("Date must be a valid YYYY-MM-DD string.");
  }
  return value;
}
