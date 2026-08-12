import { jsx, jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});
function formatCurrency(value) {
  return currencyFormatter.format(Math.abs(value));
}
function ExpensesSummaryCard({ chartData, recentTransactions, className }) {
  const navigate = useNavigate();
  const totalValue = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const hasChartData = chartData.length > 0 && totalValue > 0;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => navigate("/gastos-por-categoria"),
      className: cn(
        "flex h-full min-h-0 w-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-[0_18px_55px_rgba(0,0,0,0.28)]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { size: 14, className: "text-primary" }),
          /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Gastos por categoria" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "h-40 w-40 max-w-full", children: hasChartData ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsx(PieChart, { children: /* @__PURE__ */ jsx(
            Pie,
            {
              data: chartData,
              dataKey: "value",
              nameKey: "name",
              cx: "50%",
              cy: "50%",
              innerRadius: 46,
              outerRadius: 68,
              paddingAngle: 2,
              stroke: "none",
              children: chartData.map((entry) => /* @__PURE__ */ jsx(Cell, { fill: entry.color ?? "#4ade80" }, entry.name))
            }
          ) }) }) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground", children: "Sem dados" }) }) }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: chartData.map((entry) => {
            const percentage = totalValue > 0 ? entry.value / totalValue * 100 : 0;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: "h-2.5 w-2.5 flex-shrink-0 rounded-full",
                  style: { backgroundColor: entry.color ?? "#4ade80" }
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "flex-1 truncate text-foreground", children: entry.name }),
              /* @__PURE__ */ jsxs("span", { className: "whitespace-nowrap tabular-nums text-muted-foreground", children: [
                formatCurrency(entry.value),
                " ",
                /* @__PURE__ */ jsxs("span", { className: "opacity-70", children: [
                  "(",
                  percentage.toFixed(0),
                  "%)"
                ] })
              ] })
            ] }, entry.name);
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-border pt-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Recentes" }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-1.5", children: recentTransactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const valueColor = isIncome ? "text-success" : "text-foreground";
              return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "w-5 shrink-0 text-center text-sm leading-none", children: transaction.icon }),
                /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate text-foreground/90", children: transaction.description }),
                /* @__PURE__ */ jsxs("span", { className: cn("tabular-nums whitespace-nowrap font-medium", valueColor), children: [
                  isIncome ? "+" : "-",
                  formatCurrency(transaction.value)
                ] })
              ] }, transaction.id);
            }) })
          ] })
        ] })
      ]
    }
  );
}
export {
  ExpensesSummaryCard as default
};
