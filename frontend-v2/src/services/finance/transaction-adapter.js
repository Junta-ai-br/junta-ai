import { FinancialContractError, isDate, isObject, isTransaction, isUuid, TRANSACTION_TYPES } from "../financial-contracts";
import { centsToDecimal, decimalToCents } from "./signed-money";

const MAX_TRANSACTION_CENTS = 9999999999999999999n;
const invalid = () => new FinancialContractError("Invalid transaction adaptation or inconsistent type/sign.", "ERR_TRANSACTION_ADAPTER");

/** A write request always requires an explicit type and a POSITIVE decimal magnitude.
 * Only backend request fields are returned. No response metadata or BigInt is sent.
 */
export function prepareTransactionRequest(input) {
  if (!isObject(input)) throw invalid();
  const { categoryId, type, description, amount, transactionDate } = input;
  if (!isUuid(categoryId) || !TRANSACTION_TYPES.includes(type) || !isDate(transactionDate)
    || !(description == null || typeof description === "string") || (description?.length ?? 0) > 500) throw invalid();
  const cents = decimalToCents(amount);
  if (cents <= 0n || cents > MAX_TRANSACTION_CENTS) throw invalid();
  return { categoryId, type, description: description ?? null, amount: centsToDecimal(cents), transactionDate };
}

/** In-memory model: amount retains the API's positive magnitude; signedAmount and
 * signedCents are derived exactly once. Do not JSON.stringify this model.
 */
export function transactionDtoToView(dto) {
  if (!isTransaction(dto)) throw invalid();
  const magnitude = decimalToCents(dto.amount);
  const signedCents = dto.type === "EXPENSE" ? -magnitude : magnitude;
  return {
    id: dto.id, categoryId: dto.categoryId, categoryName: dto.categoryName, type: dto.type,
    description: dto.description, amount: dto.amount, transactionDate: dto.transactionDate, createdAt: dto.createdAt,
    signedAmount: centsToDecimal(signedCents), signedCents,
  };
}

export function assertTransactionView(view) {
  if (!isTransaction(view)) throw invalid();
  const magnitude = decimalToCents(view.amount);
  const expected = view.type === "EXPENSE" ? -magnitude : magnitude;
  if (typeof view.signedCents !== "bigint" || view.signedCents !== expected
    || decimalToCents(view.signedAmount) !== expected) throw invalid();
  return view;
}

export function transactionViewToRequest(view) {
  assertTransactionView(view);
  return prepareTransactionRequest(view);
}
