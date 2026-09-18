const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function formatCurrency(value) {
  return currencyFormatter.format(value);
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
  }).format(value);
}
