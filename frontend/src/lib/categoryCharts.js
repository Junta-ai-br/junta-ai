import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/finance";
const DATE_RANGE_STORAGE_KEY = "grana-ai:category-range";
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});
function formatCurrency(value) {
  return currencyFormatter.format(Math.abs(value));
}
function formatDateBR(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
function countDays(range) {
  if (!range.start || !range.end) return 1;
  const start = /* @__PURE__ */ new Date(`${range.start}T00:00:00.000Z`);
  const end = /* @__PURE__ */ new Date(`${range.end}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 864e5) + 1);
}
function getDefaultRange(transactions) {
  const validDates = transactions.map((transaction) => new Date(transaction.date)).filter((date) => !Number.isNaN(date.getTime()));
  if (validDates.length === 0) {
    const today = /* @__PURE__ */ new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: firstDay.toISOString().slice(0, 10),
      end: today.toISOString().slice(0, 10)
    };
  }
  const sorted = [...validDates].sort((left, right) => left.getTime() - right.getTime());
  return {
    start: sorted[0].toISOString().slice(0, 10),
    end: sorted[sorted.length - 1].toISOString().slice(0, 10)
  };
}
function loadDateRange(fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(DATE_RANGE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      start: typeof parsed.start === "string" ? parsed.start : fallback.start,
      end: typeof parsed.end === "string" ? parsed.end : fallback.end
    };
  } catch {
    return fallback;
  }
}
function saveDateRange(range) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify(range));
}
function filterByRange(transactions, range) {
  return transactions.filter((transaction) => transaction.date >= range.start && transaction.date <= range.end);
}
function aggregateByCategory(transactions) {
  const expenses = transactions.filter((transaction) => transaction.amount < 0 && transaction.category !== "Renda");
  const totals = {};
  for (const transaction of expenses) {
    totals[transaction.category] = (totals[transaction.category] ?? 0) + Math.abs(transaction.amount);
  }
  const totalValue = Object.values(totals).reduce((sum, value) => sum + value, 0);
  return Object.entries(totals).sort((left, right) => right[1] - left[1]).map(([name, value]) => ({
    name,
    value,
    pct: totalValue > 0 ? Math.round(value / totalValue * 1e3) / 10 : 0,
    color: CATEGORY_COLORS[name] ?? "#888",
    icon: CATEGORY_ICONS[name] ?? "\u{1F4B0}"
  }));
}
function aggregateByMonth(transactions) {
  const monthMap = {};
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  for (const transaction of transactions) {
    const [year, month] = transaction.date.split("-");
    const key = `${year}-${month}`;
    const monthIndex = Number.parseInt(month, 10) - 1;
    if (!monthMap[key]) {
      monthMap[key] = {
        mes: months[monthIndex] ?? month,
        entradas: 0,
        saidas: 0
      };
    }
    if (transaction.amount > 0) monthMap[key].entradas += transaction.amount;
    if (transaction.amount < 0) monthMap[key].saidas += Math.abs(transaction.amount);
  }
  return Object.entries(monthMap).sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value);
}
export {
  DATE_RANGE_STORAGE_KEY,
  aggregateByCategory,
  aggregateByMonth,
  countDays,
  filterByRange,
  formatCurrency,
  formatDateBR,
  getDefaultRange,
  loadDateRange,
  saveDateRange
};
