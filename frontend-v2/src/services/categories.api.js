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

export async function createCategory(body) {
  return resourceRequest("post", base, { validate: isCategory, data: payload(body) });
}

export async function updateCategory(id, body) {
  return resourceRequest("put", resourcePath(base, id), { validate: isCategory, data: payload(body) });
}

export function deleteCategory(id) {
  return resourceRequest("delete", resourcePath(base, id));
}
