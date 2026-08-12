import { jsx, jsxs } from "react/jsx-runtime";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { getBalance, getMonthlyTotals } from "@/lib/finance";
function formatCurrency(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function SummaryCards({ state }) {
  const balance = getBalance(state);
  const { income, expenses } = getMonthlyTotals(state);
  const cards = [
    {
      label: "Receitas",
      value: income,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10"
    },
    {
      label: "Despesas",
      value: expenses,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10"
    },
    {
      label: "Saldo",
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? "text-foreground" : "text-destructive",
      bg: "bg-primary/10"
    }
  ];
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: cards.map(({ label, value, icon: Icon, color, bg }) => /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-xl px-3 py-2 border border-border flex items-center gap-2.5 min-w-0", children: [
    /* @__PURE__ */ jsx("div", { className: `w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`, children: /* @__PURE__ */ jsx(Icon, { size: 14, className: color }) }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-none mb-0.5", children: label }),
      /* @__PURE__ */ jsx("p", { className: `font-heading font-semibold text-sm md:text-base leading-tight tabular-nums truncate ${color}`, children: formatCurrency(value) })
    ] })
  ] }, label)) });
}
export {
  SummaryCards as default
};
