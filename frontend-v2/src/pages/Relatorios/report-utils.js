import { filterByRange } from "@/services/finance/store";
import { decimalToCents } from "@/services/finance/signed-money";
import { formatCurrency, formatPeriod } from "@/utils/formatters";

const toUtcDate = (value) => {
  if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  return new Date(`${value}T00:00:00Z`);
};

export function getMonthStart(value) {
  const date = toUtcDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getMonthEnd(value) {
  const date = toUtcDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

export function getRangeMonthCount(range) {
  const start = toUtcDate(range.start);
  const end = toUtcDate(range.end);
  return (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth()) + 1;
}

export function getPeriodRange(month, period) {
  const [year, monthNumber] = month.split("-").map(Number);
  const duration = { monthly: 1, quarterly: 3, "half-year": 6, yearly: 12 }[period];
  const startMonth = period === "yearly" ? 1 : monthNumber;
  const start = new Date(Date.UTC(year, startMonth - 1, 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + duration, 0));
  const dateValue = (date) => date.toISOString().slice(0, 10);
  return { start: dateValue(start), end: dateValue(end) };
}

export function getPreviousRange(range) {
  const start = getMonthStart(range.start);
  const span = getRangeMonthCount(range);
  const previousStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - span, 1));
  const previousEnd = new Date(Date.UTC(previousStart.getUTCFullYear(), previousStart.getUTCMonth() + span, 0));

  return {
    start: previousStart.toISOString().slice(0, 10),
    end: previousEnd.toISOString().slice(0, 10),
  };
}

export function getChange(current, previous) {
  if (!previous) return current ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1).replace(".", ",")}%`;
}

export function buildReport(transactions, range, previousRange) {
  const current = filterByRange(transactions, range);
  const previous = filterByRange(transactions, previousRange);
  // Accumulate exact cents; keep the existing Number model for charts and exports.
  const summarize = (items) => {
    let income = 0n;
    let expenses = 0n;
    for (const item of items) {
      const cents = decimalToCents(String(item.amount));
      if (cents > 0n) income += cents;
      else expenses -= cents;
    }
    return { income: Number(income) / 100, expenses: Number(expenses) / 100, balance: Number(income - expenses) / 100 };
  };
  const summary = summarize(current);
  const previousSummary = summarize(previous);
  const weeks = Array.from({ length: 5 }, (_, index) => ({ label: `Semana ${index + 1}`, income: 0n, expenses: 0n }));
  current.forEach((item) => {
    const day = Number(item.date.slice(8, 10));
    const week = Math.min(4, Math.floor((day - 1) / 7));
    const cents = decimalToCents(String(item.amount));
    if (cents > 0n) weeks[week].income += cents;
    else weeks[week].expenses -= cents;
  });
  const activeWeeks = weeks.filter((week) => week.income || week.expenses)
    .map((week) => ({ ...week, income: Number(week.income) / 100, expenses: Number(week.expenses) / 100 }));
  const biggestIncome = current.filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount)[0];
  const biggestExpense = current.filter((item) => item.amount < 0).sort((a, b) => a.amount - b.amount)[0];
  const startPeriod = range.start.slice(0, 7);
  const endPeriod = range.end.slice(0, 7);
  const periodText = startPeriod === endPeriod
    ? formatPeriod(startPeriod)
    : `${formatPeriod(startPeriod)} a ${formatPeriod(endPeriod)}`;
  return {
    period: periodText,
    summary: {
      income: summary.income,
      expenses: summary.expenses,
      balance: summary.balance,
      incomeChange: getChange(summary.income, previousSummary.income),
      expensesChange: getChange(summary.expenses, previousSummary.expenses),
      balanceChange: getChange(summary.balance, previousSummary.balance),
    },
    chart: activeWeeks,
    insights: [
      { label: "Maior receita", value: biggestIncome ? formatCurrency(biggestIncome.amount) : formatCurrency(0), ...(biggestIncome?.category ? { categoryName: biggestIncome.category } : {}), detail: biggestIncome?.desc || "Nenhuma entrada", tone: "positive" },
      { label: "Maior despesa", value: biggestExpense ? formatCurrency(Math.abs(biggestExpense.amount)) : formatCurrency(0), ...(biggestExpense?.category ? { categoryName: biggestExpense.category } : {}), detail: biggestExpense?.desc || "Nenhuma saída", tone: "negative" },
      { label: "Total de movimentações", value: `${current.length} lançamentos`, detail: `${current.filter((item) => item.amount > 0).length} entradas · ${current.filter((item) => item.amount < 0).length} saídas`, tone: "neutral" },
    ],
    hasTransactions: current.length > 0,
  };
}
