export const CATEGORY_META = {
  Moradia: { color: "#00d084", icon: "🏠" },
  Alimentação: { color: "#7c3aed", icon: "🍽️" },
  Transporte: { color: "#f59e0b", icon: "🚌" },
  Saúde: { color: "#3b82f6", icon: "💊" },
  Lazer: { color: "#ec4899", icon: "🎮" },
  Renda: { color: "#00d084", icon: "💼" },
};

const SEED = [
  { id: "t01", date: "2026-08-01", category: "Renda", desc: "Salário", amount: 4000, icon: "💼" },
  { id: "t02", date: "2026-08-02", category: "Moradia", desc: "Aluguel", amount: -500, icon: "🏠" },
  { id: "t03", date: "2026-08-03", category: "Alimentação", desc: "Supermercado", amount: -180, icon: "🍽️" },
  { id: "t04", date: "2026-08-05", category: "Transporte", desc: "Combustível", amount: -145, icon: "🚌" },
  { id: "t05", date: "2026-08-07", category: "Saúde", desc: "Farmácia", amount: -60, icon: "💊" },
  { id: "t06", date: "2026-08-09", category: "Lazer", desc: "Cinema", amount: -40, icon: "🎮" },
];

const TRANSACTIONS_KEY = "junta_transactions";
const CATEGORIES_KEY = "junta_categories";
const RANGE_KEY = "junta_date_range";

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { return SEED; }
  return SEED;
}

export function saveTransactions(transactions) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  const range = loadDateRange();
  const dates = transactions.map((transaction) => transaction.date).filter(Boolean).sort();
  if (dates.length && (dates[0] < range.start || dates[dates.length - 1] > range.end)) {
    saveDateRange({
      start: dates[0] < range.start ? dates[0] : range.start,
      end: dates[dates.length - 1] > range.end ? dates[dates.length - 1] : range.end,
    });
  }
  window.dispatchEvent(new Event("junta:transactions-changed"));
}

export function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { return Object.keys(CATEGORY_META); }
  return Object.keys(CATEGORY_META);
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  window.dispatchEvent(new Event("junta:categories-changed"));
}

export function loadDateRange() {
  try {
    const raw = localStorage.getItem(RANGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { return { start: "2026-08-01", end: "2026-08-31" }; }
  return { start: "2026-08-01", end: "2026-08-31" };
}

export function saveDateRange(range) {
  localStorage.setItem(RANGE_KEY, JSON.stringify(range));
}

export function filterByRange(transactions, range) {
  if (!range) return transactions;
  return transactions.filter((transaction) => transaction.date >= range.start && transaction.date <= range.end);
}

export function aggregateByCategory(transactions, categories = []) {
  const values = {};
  categories.filter((category) => category !== "Renda").forEach((category) => {
    values[category] = 0;
  });
  transactions.filter((transaction) => transaction.amount < 0).forEach((transaction) => {
    values[transaction.category] = (values[transaction.category] || 0) + Math.abs(transaction.amount);
  });
  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  return Object.entries(values).sort(([, a], [, b]) => b - a).map(([name, value]) => ({
    name,
    value,
    pct: total ? Math.round((value / total) * 1000) / 10 : 0,
    color: CATEGORY_META[name]?.color || "#888",
    icon: CATEGORY_META[name]?.icon || "💰",
  }));
}

export function aggregateByMonth(transactions) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const values = {};
  transactions.forEach((transaction) => {
    const key = transaction.date.slice(0, 7);
    values[key] ||= { entradas: 0, saidas: 0 };
    if (transaction.amount > 0) values[key].entradas += transaction.amount;
    else values[key].saidas += Math.abs(transaction.amount);
  });
  return Object.entries(values).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => ({
    mes: `${months[Number(key.slice(5)) - 1]}/${key.slice(2, 4)}`,
    ...value,
  }));
}

export function formatMoney(value) {
  return `R$ ${Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateBR(date) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
