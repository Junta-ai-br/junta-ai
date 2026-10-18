import { isResource, requireDate, resourcePath, resourceRequest } from "./resource-http";

export const TRANSACTION_TYPES = Object.freeze(["INCOME", "EXPENSE"]);
const base = "/transactions";

function payload({ categoryId, type, description, amount, transactionDate }) {
  return { categoryId, type, description, amount, transactionDate: requireDate(transactionDate) };
}

/** Returns the original Spring Page, with content and pagination metadata.
 * Both bounds are required: omitting them on the backend selects only one month.
 * page is zero-based; sort accepts Spring's "transactionDate,desc" syntax.
 */
export async function listTransactions({ from, to, page = 0, size = 20, sort } = {}) {
  requireDate(from);
  requireDate(to);
  if (from > to) throw new Error("from must be on or before to.");
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1) {
    throw new Error("Invalid pagination parameters.");
  }
  return resourceRequest("get", base, {
    params: { from, to, page, size, ...(sort ? { sort } : {}) },
    validate: (data) => data && Array.isArray(data.content) && data.content.every(isResource)
      && Number.isInteger(data.number) && Number.isInteger(data.size)
      && Number.isInteger(data.totalElements) && Number.isInteger(data.totalPages)
      && typeof data.last === "boolean",
  });
}

export function createTransaction(body) {
  return resourceRequest("post", base, { data: payload(body) });
}

export function updateTransaction(id, body) {
  return resourceRequest("put", resourcePath(base, id), { data: payload(body) });
}

export function deleteTransaction(id) {
  return resourceRequest("delete", resourcePath(base, id));
}
