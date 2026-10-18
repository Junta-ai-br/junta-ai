import { requireDate, resourcePath, resourceRequest } from "./resource-http";
import { TRANSACTION_TYPES, FinancialContractError, decodeTransactions, encodeTransaction, isObject, isTransaction, isTransactionPage, isUuid, normalizeMoney } from "./financial-contracts";

export { TRANSACTION_TYPES } from "./financial-contracts";
const base = "/transactions";
const responseContract = { validate: isTransaction, transformResponse: decodeTransactions };

function payload(body) {
  if (!isObject(body)) throw new FinancialContractError("Invalid transaction request.", "ERR_API_REQUEST");
  const { categoryId, type, description, amount, transactionDate } = body;
  if (!isUuid(categoryId) || !TRANSACTION_TYPES.includes(type)
    || !(description == null || typeof description === "string") || (description?.length ?? 0) > 500) {
    throw new FinancialContractError("Invalid transaction request.", "ERR_API_REQUEST");
  }
  return { categoryId, type, description: description ?? null, amount: normalizeMoney(amount), transactionDate: requireDate(transactionDate) };
}

/** Returns the original Spring Page, with content and pagination metadata.
 * Both bounds are required: omitting them on the backend selects only one month.
 * page is zero-based; sort accepts Spring's "transactionDate,desc" syntax.
 */
export async function listTransactions({ from, to, page = 0, size = 20, sort, signal } = {}) {
  requireDate(from);
  requireDate(to);
  if (from > to) throw new FinancialContractError("from must be on or before to.", "ERR_API_REQUEST");
  if (!Number.isSafeInteger(page) || page < 0 || !Number.isSafeInteger(size) || size < 1
    || (sort !== undefined && (typeof sort !== "string" || !sort.trim()))) {
    throw new FinancialContractError("Invalid pagination parameters.", "ERR_API_REQUEST");
  }
  return resourceRequest("get", base, {
    signal,
    params: { from, to, page, size, ...(sort ? { sort } : {}) },
    transformResponse: decodeTransactions,
    validate: isTransactionPage,
  });
}

export async function createTransaction(body) {
  return resourceRequest("post", base, { ...responseContract, data: payload(body), transformRequest: encodeTransaction });
}

export async function updateTransaction(id, body) {
  return resourceRequest("put", resourcePath(base, id), { ...responseContract, data: payload(body), transformRequest: encodeTransaction });
}

export function deleteTransaction(id) {
  return resourceRequest("delete", resourcePath(base, id));
}
