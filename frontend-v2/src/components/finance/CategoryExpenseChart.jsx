import { useId, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoneyBRL } from "@/services/finance/signed-money";
import { categoryColor } from "@/utils/category-colors";
import "./CategoryExpenseChart.css";

// Only bounded coordinates reach Recharts. Monetary ticks are mapped back to
// exact BigInt cents; financial amounts and totals never go through Number.
const COORDINATE_MAX = 1_000_000;
const TICKS = [0, 250_000, 500_000, 750_000, COORDINATE_MAX];
const compactMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
});
const decimalPercent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1, maximumFractionDigits: 1,
});

function moneyTick(coordinate, maximumCents) {
  const cents = BigInt(Math.round(coordinate)) * maximumCents / BigInt(COORDINATE_MAX);
  return cents >= 1_000_000n ? compactMoney.format(cents / 100n) : formatMoneyBRL(cents);
}

function expenseShare(cents, totalCents) {
  if (totalCents <= 0n) return "0,0%";
  const tenths = (cents * 1000n + totalCents / 2n) / totalCents;
  if (cents > 0n && tenths === 0n) return "< 0,1%";
  return `${decimalPercent.format(Number(tenths) / 10)}%`;
}

function CategoryTick({ x, y, payload, categories, maxCharacters }) {
  const name = categories.find((category) => category.id === payload.value)?.name ?? "";
  const characters = Array.from(name);
  const label = characters.length > maxCharacters ? `${characters.slice(0, maxCharacters - 1).join("")}…` : name;
  return <g transform={`translate(${x},${y})`}>
    <text transform="rotate(-30)" textAnchor="end" dy={12} fill="var(--text-secondary)" fontSize={12}>
      <title>{name}</title>{label}
    </text>
  </g>;
}

function ExpenseTooltip({ active, payload, totalExpensesCents }) {
  const category = payload?.[0]?.payload;
  if (!active || !category) return null;
  return <div className="category-expense-tooltip" role="status">
    <strong>{category.name}</strong>
    <p>Valor: {formatMoneyBRL(category.expensesCents)}</p>
    <p>Participação nas despesas: {expenseShare(category.expensesCents, totalExpensesCents)}</p>
  </div>;
}

export default function CategoryExpenseChart({ categories, totalExpensesCents }) {
  const [width, setWidth] = useState(0);
  const [tooltipPortal, setTooltipPortal] = useState(null);
  const hintId = useId();
  const expenses = categories.filter((category) => category.expensesCents > 0n);
  const maximumCents = expenses.reduce((maximum, category) => category.expensesCents > maximum ? category.expensesCents : maximum, 0n);
  if (!expenses.length) return <p className="category-expense-empty" role="status">Nenhuma despesa neste período.</p>;

  const data = expenses.map((category) => ({ ...category,
    // Preserve a visible column for positive amounts below the drawing resolution.
    height: Math.max(1, Number(category.expensesCents * BigInt(COORDINATE_MAX) / maximumCents)),
  }));
  const manyCategories = data.length > 6;
  return <div className="category-expense-chart">
    <p id={hintId} className="category-expense-hint">
      Valores em reais. Consulte cada coluna para ver o valor exato e a participação no total de despesas.
      {manyCategories && " Deslize o gráfico ou use as setas para consultar todas as categorias."}
    </p>
    <div className="category-expense-body">
      <div ref={setTooltipPortal} className="category-expense-tooltip-layer" />
    <div className="category-expense-viewport" role="region" aria-label="Colunas de despesas por categoria" aria-describedby={hintId} tabIndex={manyCategories ? 0 : undefined}>
      <div className="category-expense-plot" style={{ minWidth: manyCategories ? data.length * 72 + 112 : undefined }}>
        <ResponsiveContainer width="100%" height="100%" onResize={(nextWidth) => setWidth(nextWidth)}>
          <BarChart data={data} layout="horizontal" margin={{ top: 12, right: 16, bottom: 8, left: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis type="category" dataKey="id" interval={0} height={84} tickLine={false}
              tick={<CategoryTick categories={data} maxCharacters={width < 480 ? 8 : 14} />} />
            <YAxis type="number" domain={[0, COORDINATE_MAX]} ticks={maximumCents < 4n ? [0, COORDINATE_MAX] : TICKS} width={92} tickLine={false} axisLine={false}
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }} tickFormatter={(coordinate) => moneyTick(coordinate, maximumCents)} />
            <Tooltip portal={tooltipPortal} cursor={{ fill: "var(--surface-hover)", opacity: 0.4 }} content={<ExpenseTooltip totalExpensesCents={totalExpensesCents} />} />
            <Bar dataKey="height" name="Despesas" radius={[5, 5, 0, 0]} maxBarSize={64} minPointSize={2}>
              {data.map((category) => <Cell key={category.id} fill={categoryColor(category.id)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    </div>
  </div>;
}
