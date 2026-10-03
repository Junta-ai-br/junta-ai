const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function normalizeNumber(value, fallback = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizeNumber(value)).replace(/\u00a0/g, " ");
}

export function formatMoney(value) {
  return formatCurrency(Math.abs(normalizeNumber(value)));
}

export function formatPercent(value) {
  const numeric = normalizeNumber(value);
  const normalized = Math.abs(numeric) > 1 ? numeric / 100 : numeric;

  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(normalized).replace(/\u00a0/g, " ");
}

export function formatPeriod(value) {
  if (!value) return "Selecione um período";
  const [year, month] = value.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, 1));
}

export function formatCompactCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(normalizeNumber(value)).replace(/\u00a0/g, " ");
}
