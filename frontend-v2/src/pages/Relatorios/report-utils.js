import { filterByRange } from "@/services/finance/store";
import { formatCurrency, formatPeriod } from "@/utils/formatters";

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
  const start = new Date(`${range.start}T00:00:00Z`);
  const end = new Date(`${range.end}T00:00:00Z`);
  const duration = Math.round((end - start) / 86400000) + 1;
  const previousEnd = new Date(start.getTime() - 86400000);
  const previousStart = new Date(previousEnd.getTime() - (duration - 1) * 86400000);
  return { start: previousStart.toISOString().slice(0, 10), end: previousEnd.toISOString().slice(0, 10) };
}

export function getChange(current, previous) {
  if (!previous) return current ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1).replace(".", ",")}%`;
}

export function buildReport(transactions, range, previousRange) {
  const current = filterByRange(transactions, range);
  const previous = filterByRange(transactions, previousRange);
  const summarize = (items) => {
    const income = items.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const expenses = items.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
    return { income, expenses, balance: income - expenses };
  };
  const summary = summarize(current);
  const previousSummary = summarize(previous);
  const weeks = Array.from({ length: 5 }, (_, index) => ({ label: `Semana ${index + 1}`, income: 0, expenses: 0 }));
  current.forEach((item) => {
    const day = Number(item.date.slice(8, 10));
    const week = Math.min(4, Math.floor((day - 1) / 7));
    if (item.amount > 0) weeks[week].income += item.amount;
    else weeks[week].expenses += Math.abs(item.amount);
  });
  const activeWeeks = weeks.filter((week) => week.income || week.expenses);
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
      { label: "Maior receita", value: biggestIncome ? formatCurrency(biggestIncome.amount) : formatCurrency(0), detail: biggestIncome?.desc || "Nenhuma entrada", tone: "positive" },
      { label: "Maior despesa", value: biggestExpense ? formatCurrency(Math.abs(biggestExpense.amount)) : formatCurrency(0), detail: biggestExpense?.desc || "Nenhuma saída", tone: "negative" },
      { label: "Total de movimentações", value: `${current.length} lançamentos`, detail: `${current.filter((item) => item.amount > 0).length} entradas · ${current.filter((item) => item.amount < 0).length} saídas`, tone: "neutral" },
    ],
    hasTransactions: current.length > 0,
  };
}