import { loadTransactionPages, requirePeriod } from "../finance/financial-load";
import { decodeTransactions, isTransactionPage } from "../financial-contracts";
import { resourceRequest } from "../resource-http";
import { assertPlannerSession, requirePlannerSession } from "./session";
import { MAX_PLANNER_AMOUNT } from "./store";

export async function loadPlannerTransactions({ from, to, signal }) {
  const generation = requirePlannerSession();
  const assertCurrent = () => assertPlannerSession(generation);
  const transactions = await loadTransactionPages({ period: requirePeriod({ from, to }), signal, assertCurrent,
    pageSize: 100, maxPages: 1000, maxRecords: 100000,
    fetchPage: ({ signal: pageSignal, ...params }) => resourceRequest("get", "/transactions", {
      params, signal: pageSignal, sessionGeneration: generation, transformResponse: decodeTransactions, validate: isTransactionPage,
    }),
  });
  assertCurrent();
  const totalCents = transactions.reduce((total, item) => total + (item.signedCents < 0n ? -item.signedCents : item.signedCents), 0n);
  if (totalCents > BigInt(Math.round(MAX_PLANNER_AMOUNT * 100))) {
    throw Object.assign(new Error("Planner numeric range exceeded."), { code: "PLANNER_INVALID" });
  }
  return transactions.map((item) => ({ id: item.id, date: item.transactionDate,
    category: item.categoryName, amount: Number(item.signedCents) / 100 }));
}
