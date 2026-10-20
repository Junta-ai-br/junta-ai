import { resourcePath, resourceRequest } from "./resource-http";
import { CATEGORY_TYPES, FinancialContractError, isCategory, isCategoryName, isObject } from "./financial-contracts";

export { CATEGORY_TYPES } from "./financial-contracts";
const base = "/categories";
function payload(body) {
  if (!isObject(body)) throw new FinancialContractError("Invalid category request.", "ERR_API_REQUEST");
  const { name, type } = body;
  if (!isCategoryName(name) || !CATEGORY_TYPES.includes(type)) {
    throw new FinancialContractError("Invalid category request.", "ERR_API_REQUEST");
  }
  return { name, type };
}

export function listCategories({ signal } = {}) {
  return resourceRequest("get", base, { signal, validate: (data) => Array.isArray(data) && data.every(isCategory) });
}

export async function createCategory(body, { signal, sessionGeneration } = {}) {
  return resourceRequest("post", base, { validate: isCategory, data: payload(body), signal, sessionGeneration });
}

export async function updateCategory(id, body, { signal, sessionGeneration } = {}) {
  return resourceRequest("put", resourcePath(base, id), { validate: isCategory, data: payload(body), signal, sessionGeneration });
}

export function deleteCategory(id, { signal, sessionGeneration } = {}) {
  return resourceRequest("delete", resourcePath(base, id), { signal, sessionGeneration });
}
