import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from "recharts";
import { useFinance } from "@/lib/useFinance";
import DateRangeFilter from "@/components/DateRangeFilter";
import {
  aggregateByCategory,
  aggregateByMonth,
  countDays,
  filterByRange,
  formatCurrency,
  formatDateBR,
  getDefaultRange,
  loadDateRange,
  saveDateRange
} from "@/lib/categoryCharts";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/finance";
function getTransactionDateLabel(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(parsed);
}
function formatRangeLabel(range) {
  return `${formatDateBR(range.start)} \u2192 ${formatDateBR(range.end)}`;
}
function ExpensesCategoryPage() {
  const navigate = useNavigate();
  const { state } = useFinance();
  const allTransactions = state.transactions;
  const defaultRange = useMemo(() => getDefaultRange(allTransactions), [allTransactions]);
  const [range, setRange] = useState(() => loadDateRange(defaultRange));
  const [tab, setTab] = useState("visao-geral");
  const [activeCategory, setActiveCategory] = useState(null);
  useEffect(() => {
    saveDateRange(range);
  }, [range]);
  useEffect(() => {
    if (!range.start && defaultRange.start) {
      setRange((current) => ({ ...current, start: defaultRange.start }));
    }
    if (!range.end && defaultRange.end) {
      setRange((current) => ({ ...current, end: defaultRange.end }));
    }
  }, [defaultRange.end, defaultRange.start, range.end, range.start]);
  const filteredTransactions = useMemo(() => filterByRange(allTransactions, range), [allTransactions, range]);
  const categoryTotals = useMemo(() => aggregateByCategory(filteredTransactions), [filteredTransactions]);
  const monthlyData = useMemo(() => aggregateByMonth(filteredTransactions), [filteredTransactions]);
  const totalExpenses = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    [filteredTransactions]
  );
  const totalIncome = useMemo(
    () => filteredTransactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0),
    [filteredTransactions]
  );
  const days = useMemo(() => countDays(range), [range]);
  const topCategory = categoryTotals[0];
  const activeCategoryMeta = activeCategory ? CATEGORY_ICONS[activeCategory] : null;
  const displayedTransactions = useMemo(() => {
    const base = filteredTransactions.filter((transaction) => transaction.category !== "Renda" || !activeCategory);
    return activeCategory ? base.filter((transaction) => transaction.category === activeCategory) : base;
  }, [filteredTransactions, activeCategory]);
  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
    setActiveCategory(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0f0f0f] text-[#f0f0f0]", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-wrap items-center gap-4 border-b border-[#1e1e1e] px-8 py-4", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => navigate("/"),
          className: "flex items-center gap-2 rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-sm text-[#aaa] transition hover:border-[#7c3aed] hover:text-white",
          children: "\u2190 Voltar"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c3aed,#00d084)] text-sm", children: "\u{1F4CA}" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-[15px] font-bold text-white", children: "Gastos por Categoria" }),
          /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-[#555]", children: [
            formatRangeLabel(range),
            " \xB7 ",
            filteredTransactions.length,
            " transa\xE7\xF5es"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsx(DateRangeFilter, { value: range, onChange: handleRangeChange }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-3 px-8 pt-4 md:grid-cols-2 xl:grid-cols-4", children: [
      /* @__PURE__ */ jsx(KpiCard, { label: "Total Despesas", value: formatCurrency(totalExpenses), sub: `${days} dia${days > 1 ? "s" : ""} no per\xEDodo`, color: "#ff4444" }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Total Receitas", value: formatCurrency(totalIncome), sub: "no per\xEDodo selecionado", color: "#00d084" }),
      /* @__PURE__ */ jsx(
        KpiCard,
        {
          label: "Maior Categoria",
          value: topCategory ? topCategory.name : "\u2014",
          sub: topCategory ? `${formatCurrency(topCategory.value)} (${topCategory.pct.toFixed(1)}%)` : "sem dados",
          color: topCategory?.color ?? "#888"
        }
      ),
      /* @__PURE__ */ jsx(
        KpiCard,
        {
          label: "M\xE9dia Di\xE1ria",
          value: formatCurrency(totalExpenses / days),
          sub: "em despesas",
          color: "#f59e0b"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 px-8 pt-4", children: [
      ["visao-geral", "\u{1F4C8} Vis\xE3o Geral"],
      ["historico", "\u{1F4C5} Hist\xF3rico"],
      ["transacoes", "\u{1F4CB} Transa\xE7\xF5es"]
    ].map(([id, label]) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setTab(id),
        className: [
          "rounded-xl border px-4 py-2 text-sm transition",
          tab === id ? "border-[#7c3aed] bg-[#7c3aed] font-semibold text-white" : "border-[#2e2e2e] bg-[#1a1a1a] text-[#888] hover:text-white"
        ].join(" "),
        children: label
      },
      id
    )) }),
    /* @__PURE__ */ jsx("main", { className: "px-8 py-4", children: categoryTotals.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { message: "Nenhuma despesa no per\xEDodo selecionado." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      tab === "visao-geral" && /* @__PURE__ */ jsxs("div", { className: "grid gap-4 xl:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("section", { className: cardClass, children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Distribui\xE7\xE3o por Categoria" }),
          /* @__PURE__ */ jsxs("div", { className: "relative h-[220px]", children: [
            /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
              /* @__PURE__ */ jsx(
                Pie,
                {
                  data: categoryTotals,
                  cx: "50%",
                  cy: "50%",
                  innerRadius: 70,
                  outerRadius: 95,
                  dataKey: "value",
                  strokeWidth: 2,
                  stroke: "#0f0f0f",
                  children: categoryTotals.map((category) => /* @__PURE__ */ jsx(
                    Cell,
                    {
                      fill: category.color,
                      opacity: activeCategory && activeCategory !== category.name ? 0.25 : 1,
                      style: { cursor: "pointer" },
                      onClick: () => setActiveCategory(activeCategory === category.name ? null : category.name)
                    },
                    category.name
                  ))
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: tooltipStyle,
                  formatter: (value) => [formatCurrency(value), ""]
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center", children: activeCategory ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "text-base", children: activeCategoryMeta }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-[#c4b5fd]", children: activeCategory })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[#555]", children: "TOTAL" }),
              /* @__PURE__ */ jsx("div", { className: "text-[16px] font-bold text-white", children: formatCurrency(totalExpenses) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 space-y-2", children: categoryTotals.map((category) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setActiveCategory(activeCategory === category.name ? null : category.name),
              className: [
                "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition",
                activeCategory === category.name ? "bg-white/5" : "hover:bg-white/3"
              ].join(" "),
              children: [
                /* @__PURE__ */ jsx("span", { className: "h-2.5 w-2.5 shrink-0 rounded-[3px]", style: { backgroundColor: category.color } }),
                /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1 truncate text-[#ccc]", children: [
                  category.icon,
                  " ",
                  category.name
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-[#555]", children: [
                  category.pct.toFixed(1),
                  "%"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "w-24 text-right text-sm font-medium text-[#ff4444]", children: formatCurrency(category.value) })
              ]
            },
            category.name
          )) })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: cardClass, children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Valor por Categoria no Per\xEDodo" }),
          /* @__PURE__ */ jsx("div", { className: "h-[240px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: categoryTotals, layout: "vertical", margin: { left: 8, right: 20, top: 4, bottom: 4 }, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e1e1e", horizontal: false }),
            /* @__PURE__ */ jsx(XAxis, { type: "number", tick: { fill: "#555", fontSize: 11 }, axisLine: false, tickLine: false, tickFormatter: (value) => `R$${value}` }),
            /* @__PURE__ */ jsx(YAxis, { type: "category", dataKey: "name", tick: { fill: "#aaa", fontSize: 12 }, axisLine: false, tickLine: false, width: 85 }),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                contentStyle: tooltipStyle,
                formatter: (value) => [formatCurrency(value), "Despesa"],
                cursor: { fill: "#ffffff06" }
              }
            ),
            /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [0, 6, 6, 0], children: categoryTotals.map((category) => /* @__PURE__ */ jsx(Cell, { fill: category.color, opacity: activeCategory && activeCategory !== category.name ? 0.25 : 1 }, category.name)) })
          ] }) }) }),
          topCategory && /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-xl bg-[#111] p-3", children: [
            /* @__PURE__ */ jsx("div", { className: "mb-1 text-[10px] text-[#444]", children: "\u{1F4A1} Insight" }),
            /* @__PURE__ */ jsxs("div", { className: "text-sm leading-6 text-[#aaa]", children: [
              /* @__PURE__ */ jsx("span", { style: { color: topCategory.color, fontWeight: 600 }, children: topCategory.name }),
              " representa",
              " ",
              /* @__PURE__ */ jsxs("span", { className: "font-semibold text-white", children: [
                topCategory.pct.toFixed(1),
                "%"
              ] }),
              " das suas despesas no per\xEDodo."
            ] })
          ] })
        ] }),
        activeCategory && /* @__PURE__ */ jsxs("section", { className: `${cardClass} xl:col-span-2`, children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs(CardTitle, { children: [
              activeCategoryMeta,
              " ",
              activeCategory,
              " \xB7 ",
              displayedTransactions.length,
              " lan\xE7amento",
              displayedTransactions.length !== 1 ? "s" : ""
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveCategory(null),
                className: "text-sm text-[#666] transition hover:text-white",
                children: "\u2715 Limpar filtro"
              }
            )
          ] }),
          /* @__PURE__ */ jsx(TransactionList, { transactions: displayedTransactions })
        ] })
      ] }),
      tab === "historico" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxs("section", { className: cardClass, children: [
          /* @__PURE__ */ jsx(CardTitle, { children: "Evolu\xE7\xE3o Mensal por Categoria" }),
          /* @__PURE__ */ jsx("div", { className: "h-[300px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: monthlyData, margin: { left: 0, right: 20, top: 10, bottom: 0 }, children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1e1e1e" }),
            /* @__PURE__ */ jsx(XAxis, { dataKey: "mes", tick: { fill: "#666", fontSize: 12 }, axisLine: false, tickLine: false }),
            /* @__PURE__ */ jsx(YAxis, { tick: { fill: "#666", fontSize: 11 }, axisLine: false, tickLine: false, tickFormatter: (value) => `R$${value}` }),
            /* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle, formatter: (value) => [formatCurrency(value), ""] }),
            /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: 12, color: "#888" } }),
            /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "entradas", stroke: "#00d084", strokeWidth: 2, dot: false, name: "Entradas" }),
            /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "saidas", stroke: "#ff4444", strokeWidth: 2, dot: false, name: "Sa\xEDdas" })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3 md:grid-cols-5", children: categoryTotals.map((category) => /* @__PURE__ */ jsxs("section", { className: miniCardClass, children: [
          /* @__PURE__ */ jsx("div", { className: "mb-2 text-xl", children: category.icon }),
          /* @__PURE__ */ jsx("div", { className: "mb-1 text-xs text-[#888]", children: category.name }),
          /* @__PURE__ */ jsx("div", { className: "text-lg font-bold", style: { color: category.color }, children: formatCurrency(category.value) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 text-[11px] text-[#555]", children: [
            category.pct.toFixed(1),
            "% do total"
          ] })
        ] }, category.name)) })
      ] }),
      tab === "transacoes" && /* @__PURE__ */ jsxs("section", { className: cardClass, children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsxs(CardTitle, { children: [
            "Transa\xE7\xF5es no per\xEDodo \xB7 ",
            filteredTransactions.length,
            " lan\xE7amento",
            filteredTransactions.length !== 1 ? "s" : ""
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
            categoryTotals.map((category) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setActiveCategory(activeCategory === category.name ? null : category.name),
                className: "rounded-full border px-3 py-1 text-[11px] transition",
                style: {
                  backgroundColor: activeCategory === category.name ? `${category.color}33` : "#111",
                  borderColor: activeCategory === category.name ? category.color : "#2e2e2e",
                  color: activeCategory === category.name ? category.color : "#888"
                },
                children: [
                  category.icon,
                  " ",
                  category.name
                ]
              },
              category.name
            )),
            activeCategory && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setActiveCategory(null),
                className: "rounded-full border border-[#333] px-3 py-1 text-[11px] text-[#666] transition hover:text-white",
                children: "\u2715 Limpar"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(TransactionList, { transactions: displayedTransactions.length ? displayedTransactions : filteredTransactions })
      ] })
    ] }) })
  ] });
}
function TransactionList({ transactions }) {
  if (!transactions.length) {
    return /* @__PURE__ */ jsx(EmptyState, { message: "Nenhuma transa\xE7\xE3o encontrada." });
  }
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: [...transactions].sort((left, right) => right.date.localeCompare(left.date)).map((transaction, index) => /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex items-center gap-4 rounded-xl px-3 py-2.5",
      style: { backgroundColor: index % 2 === 0 ? "#111" : "transparent" },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base",
            style: { backgroundColor: `${CATEGORY_COLORS[transaction.category] ?? "#64748b"}22` },
            children: CATEGORY_ICONS[transaction.category] ?? "\u{1F4E6}"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm text-[#e0e0e0]", children: transaction.description }),
          /* @__PURE__ */ jsxs("div", { className: "mt-0.5 text-[11px] text-[#555]", children: [
            getTransactionDateLabel(transaction.date),
            " \xB7 ",
            transaction.category
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold", style: { color: transaction.amount < 0 ? "#ff4444" : "#00d084" }, children: [
          transaction.amount < 0 ? "-" : "+",
          formatCurrency(transaction.amount)
        ] })
      ]
    },
    transaction.id
  )) });
}
function CardTitle({ children }) {
  return /* @__PURE__ */ jsx("div", { className: "mb-4 text-sm font-semibold tracking-[0.02em] text-[#aaa]", children });
}
function KpiCard({ label, value, sub, color }) {
  return /* @__PURE__ */ jsxs("section", { className: miniCardClass, children: [
    /* @__PURE__ */ jsx("div", { className: "mb-2 text-[11px] font-semibold tracking-[0.08em] text-[#555]", children: label.toUpperCase() }),
    /* @__PURE__ */ jsx("div", { className: "text-[22px] font-bold", style: { color }, children: value }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 text-[11px] text-[#555]", children: sub })
  ] });
}
function EmptyState({ message }) {
  return /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-dashed border-[#2e2e2e] px-4 py-5 text-center text-sm text-[#666]", children: message });
}
const cardClass = "rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-5";
const miniCardClass = "rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-4";
const tooltipStyle = {
  backgroundColor: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 10,
  fontSize: 13,
  color: "#fff"
};
export {
  ExpensesCategoryPage as default
};
