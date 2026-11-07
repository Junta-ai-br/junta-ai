import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dailyCumulative } from "@/services/finance/daily-cumulative";
import { formatMoneyBRL } from "@/services/finance/signed-money";

const compactMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const MAX = 1_000_000;
const dateBR = (date) => date.split("-").reverse().join("/");

function moneyTick(coordinate, maximum) {
  const cents = BigInt(Math.round(coordinate)) * maximum / BigInt(MAX);
  return cents >= 1_000_000n ? compactMoney.format(cents / 100n) : formatMoneyBRL(cents);
}

export function CumulativeTooltip({ active, payload }) {
  const day = payload?.[0]?.payload;
  if (!active || !day) return null;
  return <div role="status" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 12, color: "var(--text-primary)", maxWidth: "min(280px, 70vw)", overflowWrap: "anywhere" }}>
    <strong>{dateBR(day.date)}</strong>
    <p>Receitas acumuladas: {formatMoneyBRL(day.incomeCents)}</p>
    <p>Despesas acumuladas: {formatMoneyBRL(day.expensesCents)}</p>
  </div>;
}

export default function DailyHistoryChart({ transactions, period }) {
  const days = useMemo(() => dailyCumulative(transactions, period), [transactions, period]);
  const maximum = days.reduce((max, day) => [day.incomeCents, day.expensesCents].reduce((m, value) => value > m ? value : m, max), 0n) || 1n;
  const data = days.map((day) => ({ ...day, incomePlot: Number(day.incomeCents * BigInt(MAX) / maximum), expensesPlot: Number(day.expensesCents * BigInt(MAX) / maximum) }));
  if (!days.length) return <p role="status">Não há dias decorridos no período consultado. Nenhuma projeção é exibida.</p>;
  const last = days.at(-1);
  return <>
    <p className="finance-chart-caption">Evolução acumulada até hoje. Os indicadores consideram todo o período selecionado, incluindo movimentações futuras.</p>
    <p className="finance-chart-caption">Acumulado diário desde {dateBR(period.from)} até {dateBR(last.date)}, em reais. Dias sem movimentações mantêm o acumulado; datas futuras não são exibidas. A granularidade permanece diária também em períodos com vários meses.</p>
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={data} accessibilityLayer margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="var(--border)" />
        <XAxis dataKey="date" tickFormatter={(date) => period.from.slice(0, 4) === period.to.slice(0, 4) ? dateBR(date).slice(0, 5) : dateBR(date)} minTickGap={32} interval="preserveStartEnd" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
        <YAxis domain={[0, MAX]} ticks={[0, MAX / 2, MAX]} width={100} tickFormatter={(value) => moneyTick(value, maximum)} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
        <Tooltip content={<CumulativeTooltip />} />
        <Legend />
        <Line type="stepAfter" dataKey="incomePlot" name="Receitas acumuladas" stroke="var(--success)" dot={days.length === 1} isAnimationActive={false} />
        <Line type="stepAfter" dataKey="expensesPlot" name="Despesas acumuladas" stroke="var(--error)" dot={days.length === 1} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
    <p>Acumulado até {dateBR(last.date)}: receitas {formatMoneyBRL(last.incomeCents)} · despesas {formatMoneyBRL(last.expensesCents)}</p>
  </>;
}
