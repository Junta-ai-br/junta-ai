import { loadTransactionPages, requirePeriod } from "@/services/finance/financial-load";
import { decodeTransactions, isTransactionPage } from "@/services/financial-contracts";
import { resourceRequest } from "@/services/resource-http";
import { assertPlannerSession as assertSession, requirePlannerSession as requireSession } from "@/services/planner/session";
import { buildReport, getPeriodRange, getPreviousRange } from "./report-utils";

export function isReportSelection(date, period) {
  return typeof date === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(date)
    // The previous period must also avoid Date.UTC's special handling of years 0–99.
    && Number(date.slice(0, 4)) >= 101 && Number(date.slice(0, 4)) <= 9998
    && ["monthly", "quarterly", "half-year", "yearly"].includes(period);
}

export async function loadReportData({ date, period, signal }) {
  const generation = requireSession();
  if (!isReportSelection(date, period)) throw Object.assign(new Error("Invalid report period."), { code: "INVALID_PERIOD" });
  const range = getPeriodRange(date, period);
  const previousRange = getPreviousRange(range);
  const assertCurrent = () => assertSession(generation);
  // Both calendar periods are contiguous. Collect every page privately before publishing.
  const records = await loadTransactionPages({
    period: requirePeriod({ from: previousRange.start, to: range.end }), signal, assertCurrent,
    pageSize: 100, maxPages: 1000, maxRecords: 100000,
    fetchPage: ({ signal: pageSignal, ...params }) => resourceRequest("get", "/transactions", {
      params, signal: pageSignal, sessionGeneration: generation, transformResponse: decodeTransactions, validate: isTransactionPage,
    }),
  });
  assertCurrent();
  const magnitude = records.reduce((total, item) => total + (item.signedCents < 0n ? -item.signedCents : item.signedCents), 0n);
  // Preserve cents when adapting exact decimals to the existing chart/export Number model.
  if (magnitude > 999999999999n) throw Object.assign(new Error("Report numeric range exceeded."), { code: "REPORT_PRECISION" });
  const transactions = records.map((item) => ({ id: item.id, date: item.transactionDate,
    category: item.categoryName, desc: item.description, amount: Number(item.signedCents) / 100 }));
  return { report: buildReport(transactions, range, previousRange), generation };
}

export function reportErrorMessage(error) {
  if (["SESSION_EXPIRED", "SESSION_CHANGED", "STALE_SESSION"].includes(error?.code) || error?.response?.status === 401) return "Sessão expirada ou alterada. Entre novamente.";
  if (error?.response?.status === 403) return "Você não tem permissão para consultar estas movimentações.";
  if (error?.code === "REPORT_PRECISION") return "Os valores do período excedem o limite seguro para gerar o relatório.";
  return "Não foi possível carregar todas as movimentações. Tente novamente.";
}
