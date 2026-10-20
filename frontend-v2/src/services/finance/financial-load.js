import { isDate, isTransactionPage } from "../financial-contracts";
import { transactionDtoToView } from "./transaction-adapter";

export class FinancialLoadError extends Error {
  constructor(code) {
    super(code);
    this.name = "FinancialLoadError";
    this.code = code;
  }
}

export function requirePeriod(input) {
  const { from, to } = input ?? {};
  if (from == null || to == null) throw new FinancialLoadError("COVERAGE_UNKNOWN");
  if (!isDate(from) || !isDate(to) || from > to) throw new FinancialLoadError("INVALID_PERIOD");
  return Object.freeze({ from, to });
}

// UUID case affects the internal key only. Display fields are compared literally.
const equivalent = (left, right) => left.categoryId.toLowerCase() === right.categoryId.toLowerCase()
  && ["categoryName", "type", "description", "amount", "transactionDate", "createdAt"]
    .every((field) => left[field] === right[field]);

function transactionConsolidator() {
  const unique = new Map();
  return {
    add(dtos) {
      for (const dto of dtos) {
        const view = transactionDtoToView(dto);
        const key = view.id.toLowerCase();
        if (unique.has(key) && !equivalent(unique.get(key), view)) throw new FinancialLoadError("DUPLICATE_CONFLICT");
        if (!unique.has(key)) unique.set(key, Object.freeze(view));
      }
    },
    values: () => Object.freeze([...unique.values()]),
  };
}

export function consolidateTransactions(dtos) {
  const consolidator = transactionConsolidator();
  consolidator.add(dtos);
  return consolidator.values();
}

/** Collect privately; never return an intermediate page as a complete result. */
export async function loadTransactionPages({ period, fetchPage, assertCurrent, signal, pageSize, maxPages, maxRecords }) {
  const consolidator = transactionConsolidator();
  let received = 0;
  let baseline;
  for (let index = 0; index < maxPages; index += 1) {
    assertCurrent();
    const page = await fetchPage({ ...period, page: index, size: baseline?.size ?? pageSize,
      sort: "transactionDate,id,asc", signal });
    assertCurrent();
    if (!isTransactionPage(page) || page.number !== index) throw new FinancialLoadError("PAGINATION_INVALID");
    if (!baseline) baseline = { size: page.size, totalPages: page.totalPages, totalElements: page.totalElements };
    if (page.size !== baseline.size || page.totalPages !== baseline.totalPages || page.totalElements !== baseline.totalElements) {
      throw new FinancialLoadError("COVERAGE_UNKNOWN");
    }
    if (page.totalPages > maxPages || page.totalElements > maxRecords || received + page.content.length > maxRecords) {
      throw new FinancialLoadError("COVERAGE_UNKNOWN");
    }
    const expectedCount = Math.min(page.size, Math.max(0, page.totalElements - index * page.size));
    if (page.content.length !== expectedCount) throw new FinancialLoadError("COVERAGE_UNKNOWN");
    if (page.content.some((item) => item.transactionDate < period.from || item.transactionDate > period.to)) {
      throw new FinancialLoadError("INVALID_RESPONSE");
    }
    received += page.content.length;
    // Detect conflicting duplicates as soon as they appear, even before the final page.
    consolidator.add(page.content);
    if (page.last) {
      const transactions = consolidator.values();
      if (transactions.length !== page.totalElements) throw new FinancialLoadError("COVERAGE_UNKNOWN");
      return transactions;
    }
  }
  throw new FinancialLoadError("COVERAGE_UNKNOWN");
}
