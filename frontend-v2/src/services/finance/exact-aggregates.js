import { FinancialContractError, isDate } from "../financial-contracts";
import { assertTransactionView } from "./transaction-adapter";
import { centsToDecimal } from "./signed-money";

function requireTransactions(transactions) {
  if (!Array.isArray(transactions)) throw new FinancialContractError("Expected transaction views.", "ERR_FINANCE_AGGREGATE");
  for (const transaction of transactions) assertTransactionView(transaction);
  return transactions;
}

export function summarizeExact(transactions) {
  let incomeCents = 0n;
  let expensesCents = 0n;
  for (const transaction of requireTransactions(transactions)) {
    if (transaction.type === "INCOME") incomeCents += transaction.signedCents;
    else expensesCents -= transaction.signedCents;
  }
  const balanceCents = incomeCents - expensesCents;
  return {
    income: centsToDecimal(incomeCents), expenses: centsToDecimal(expensesCents), balance: centsToDecimal(balanceCents),
    incomeCents, expensesCents, balanceCents, transactionCount: transactions.length,
  };
}

function grouped(transactions, keyOf) {
  const groups = new Map();
  for (const transaction of requireTransactions(transactions)) {
    const key = keyOf(transaction);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(transaction);
  }
  return [...groups].map(([key, items]) => ({ key, ...summarizeExact(items) }));
}

// Category labels belong to the backend category catalog, never to a grouping heuristic.
export function groupByCategoryId(transactions) {
  return grouped(transactions, (transaction) => transaction.categoryId)
    .map(({ key, ...summary }) => ({ categoryId: key, ...summary }));
}

export function groupByMonth(transactions) {
  return grouped(transactions, (transaction) => transaction.transactionDate.slice(0, 7))
    .map(({ key, ...summary }) => ({ month: key, ...summary }))
    .sort((left, right) => left.month.localeCompare(right.month));
}

export function summarizePeriod(transactions, period) {
  if (!isDate(period?.from) || !isDate(period?.to) || period.from > period.to) {
    throw new FinancialContractError("Expected an inclusive YYYY-MM-DD period.", "ERR_FINANCE_AGGREGATE");
  }
  const items = requireTransactions(transactions).filter((transaction) =>
    transaction.transactionDate >= period.from && transaction.transactionDate <= period.to);
  return summarizeExact(items);
}

/** Differences are current minus previous; expense differences may also be negative.
 * These are differences of declared records, not transfers or new transactions.
 */
export function comparePeriods(transactions, currentPeriod, previousPeriod) {
  const current = summarizePeriod(transactions, currentPeriod);
  const previous = summarizePeriod(transactions, previousPeriod);
  const incomeCents = current.incomeCents - previous.incomeCents;
  const expensesCents = current.expensesCents - previous.expensesCents;
  const balanceCents = current.balanceCents - previous.balanceCents;
  return { current, previous, difference: {
    income: centsToDecimal(incomeCents), expenses: centsToDecimal(expensesCents), balance: centsToDecimal(balanceCents),
    incomeCents, expensesCents, balanceCents,
  } };
}
