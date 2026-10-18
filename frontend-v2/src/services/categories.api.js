import { isResource, resourcePath, resourceRequest } from "./resource-http";

export const CATEGORY_TYPES = Object.freeze(["INCOME", "EXPENSE", "BOTH"]);
const base = "/categories";
const payload = ({ name, type }) => ({ name, type });

export function listCategories() {
  return resourceRequest("get", base, { validate: (data) => Array.isArray(data) && data.every(isResource) });
}

export function createCategory(body) {
  return resourceRequest("post", base, { data: payload(body) });
}

export function updateCategory(id, body) {
  return resourceRequest("put", resourcePath(base, id), { data: payload(body) });
}

export function deleteCategory(id) {
  return resourceRequest("delete", resourcePath(base, id));
}
