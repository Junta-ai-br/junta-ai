import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "radix-ui";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useCanonicalFinance from "@/contexts/useCanonicalFinance";
import { getSessionSnapshot, subscribeSession } from "@/services/auth/session";
import { groupByCategoryId, groupByMonth } from "@/services/finance/exact-aggregates";
import { formatMoneyBRL } from "@/services/finance/signed-money";
import { FinancialLoadError, requirePeriod } from "@/services/finance/financial-load";
import { CategoryForm, DeleteFinancialRecordForm, TransactionForm } from "@/components/finance/forms/FinancialForms";
import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";
import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import "./VisaoMes.css";

const TABS = [["overview", "Visão geral"], ["history", "Histórico"], ["transactions", "Transações"], ["flow", "Entradas e saídas"], ["categories", "Categorias"]];
const THEME_TOKENS = {
  dark: { bg: "#0f0f0f", surface: "#1a1a1a", border: "#2e2e2e", text: "#f0f0f0", textMuted: "#aaa", textDim: "#888", inputBg: "#111" },
  light: { bg: "#f0f2f5", surface: "#fff", border: "#e2e5eb", text: "#111827", textMuted: "#6b7280", textDim: "#9ca3af", inputBg: "#f0f2f5" },
};
const COLORS = ["#7c3aed", "#00a873", "#e07a15", "#cd537a", "#3589cb"];
const generation = () => getSessionSnapshot()?.generation ?? null;
const dateBR = (date) => date.split("-").reverse().join("/");
// Recharts receives only bounded relative geometry (0..100), never monetary
// coefficients. All totals, labels and tooltips retain the exact decimal model.
const plot = (cents, scale) => Number(cents * 10000n / (scale || 1n)) / 100;

export default function VisaoMes({ title = "Visão do mês", variant = "month" } = {}) {
  const finance = useCanonicalFinance();
  const currentGeneration = useSyncExternalStore(subscribeSession, generation);
  const { theme } = useTheme();
  const T = THEME_TOKENS[theme === THEMES.DARK ? "dark" : "light"];
  const [tab, setTab] = useState("overview");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [periodError, setPeriodError] = useState(null);
  const [editor, setEditor] = useState(null);
  const opener = useRef(null);
  const addButton = useRef(null);
  const heading = useRef(null);
  const covered = finance.coverage?.complete === true;
  const busy = finance.pending > 0;
  const writeBlocked = busy || finance.refreshRequired;
  const filter = finance.categories.some((category) => category.id === categoryFilter) ? categoryFilter : "";
  const visible = useMemo(() => [...finance.transactions].filter((item) => !filter || item.categoryId === filter)
    .sort((left, right) => right.transactionDate.localeCompare(left.transactionDate) || left.id.localeCompare(right.id)), [finance.transactions, filter]);
  const categories = useMemo(() => {
    const groups = groupByCategoryId(finance.transactions);
    return finance.categories.map((category, index) => ({ ...category, color: COLORS[index % COLORS.length],
      ...groups.find((item) => item.categoryId === category.id) }));
  }, [finance.categories, finance.transactions]);
  const months = useMemo(() => groupByMonth(finance.transactions), [finance.transactions]);
  const expenseScale = categories.reduce((max, item) => (item.expensesCents ?? 0n) > max ? item.expensesCents : max, 0n);
  const monthScale = months.reduce((max, item) => [item.incomeCents, item.expensesCents].reduce((value, next) => next > value ? next : value, max), 0n);
  const categoryChart = categories.filter((item) => item.expensesCents > 0n).map((item) => ({ ...item, plot: plot(item.expensesCents, expenseScale) }));
  const monthChart = months.map((item) => ({ ...item, entradas: plot(item.incomeCents, monthScale), saidas: plot(item.expensesCents, monthScale) }));
  const open = (event, kind, id) => { opener.current = event.currentTarget; setEditor({ kind, id, generation: currentGeneration }); };
  const close = () => { if (!busy) setEditor(null); };
  const changePeriod = async (next) => {
    try {
      const period = requirePeriod(next && { from: next.start, to: next.end });
      setPeriodError(null); setEditor(null);
      await finance.load(period);
    } catch (error) {
      if (!(error instanceof FinancialLoadError)) throw error;
      setPeriodError("Informe datas válidas, com início anterior ou igual ao fim. Para consultar o histórico, escolha as duas datas.");
    }
  };
  const dialogOpen = !!editor && editor.generation === currentGeneration;
  const tooltip = (value, _name, entry) => formatMoneyBRL(entry.payload.expenses ?? value);

  return <>
    <AuthHeader activePath={variant === "all" ? "/dashboard" : "/visao-mes"} variant="finance"
      dateRange={{ start: finance.period.from, end: finance.period.to }} allowAllPeriod={false}
      onAddCategory={covered && !writeBlocked ? (event) => open(event, "category") : null} onDateRangeChange={changePeriod} />
    <main className="finance-page" style={{ background: T.bg, color: T.text }}>
      <header className="finance-header" style={{ background: T.surface, borderColor: T.border }}>
        <div><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{dateBR(finance.period.from)} até {dateBR(finance.period.to)} · {covered ? `${finance.transactions.length} transações` : "consulta em andamento ou indisponível"}</p></div>
        <div className="finance-header-actions"><button ref={addButton} type="button" className="finance-add" disabled={!covered || writeBlocked} onClick={(event) => open(event, "transaction")}>＋ Lançamento</button></div>
      </header>
      {periodError && <p role="alert" className="finance-empty-state">{periodError}</p>}
      {["idle", "loading"].includes(finance.status) && <p role="status" className="finance-empty-state">Carregando transações e categorias do período…</p>}
      {["error", "stale", "cancelled"].includes(finance.status) && <div role="alert" className="finance-empty-state">
        <p>{finance.error?.code === "COVERAGE_UNKNOWN" ? "Não foi possível comprovar a cobertura completa do período. Os indicadores estão indisponíveis." : "Não foi possível carregar os dados financeiros. Nenhum dado local foi usado como substituição."}{finance.error?.status ? ` HTTP ${finance.error.status}.` : ""}</p>
        <button type="button" disabled={busy} onClick={() => finance.reload()}>Atualizar consulta</button>
      </div>}
      {finance.refreshRequired && <p role="status" className="finance-empty-state">A visualização precisa ser reconciliada. Uma operação pode já ter sido processada; atualize a consulta antes de realizar outra gravação. <button type="button" disabled={busy} onClick={() => finance.reload()}>Atualizar consulta</button></p>}
      <section className="finance-kpis" aria-label="Indicadores financeiros">
        <Kpi label="Receitas" value={finance.summary?.income} color="#00a873" tokens={T} />
        <Kpi label="Despesas" value={finance.summary?.expenses} color="#d94040" tokens={T} />
        <Kpi label="Saldo" value={finance.summary?.balance} color={finance.summary?.balanceCents < 0n ? "#d94040" : "#00a873"} tokens={T} />
        <Kpi label="Categorias" value={covered ? finance.categories.length : null} color="#bd760c" tokens={T} raw />
      </section>
      {covered && finance.transactions.length === 0 && <p role="status" className="finance-empty-state">Nenhuma movimentação neste período. Escolha outro período ou adicione um lançamento.</p>}
      <nav className="finance-tabs" aria-label="Seções da visão do mês">{TABS.map(([id, label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}>{label}</button>)}</nav>
      {covered && ["overview", "history", "flow"].includes(tab) && <p className="finance-chart-caption">Gráficos em escala relativa ao maior valor exibido; os detalhes mostram os valores monetários exatos.</p>}
      {covered && <section className="finance-content">
        {tab === "overview" && <div className="finance-grid">
          <Panel title="Gastos por categoria"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={categoryChart} dataKey="plot" nameKey="name" innerRadius={72} outerRadius={105}>{categoryChart.map((item) => <Cell key={item.id} fill={item.color} />)}</Pie><Tooltip formatter={tooltip} /></PieChart></ResponsiveContainer>
            <div className="category-rows">{categoryChart.map((item) => <div key={item.id}><span><i style={{ background: item.color }} />{item.name}</span><b>{formatMoneyBRL(item.expenses)}</b></div>)}</div>
          </Panel>
          <Panel title="Valor por categoria"><ResponsiveContainer width="100%" height={350}><BarChart data={categoryChart} layout="vertical"><CartesianGrid stroke={T.border} horizontal={false} /><XAxis type="number" tickFormatter={(value) => `${value}%`} /><YAxis type="category" dataKey="id" tickFormatter={(id) => categories.find((item) => item.id === id)?.name} width={90} /><Tooltip labelFormatter={(id) => categories.find((item) => item.id === id)?.name} formatter={tooltip} /><Bar dataKey="plot" name="Despesas" fill="#7c3aed" /></BarChart></ResponsiveContainer></Panel>
        </div>}
        {tab === "history" && <Panel title="Evolução mensal no período consultado"><ResponsiveContainer width="100%" height={380}><LineChart data={monthChart}><CartesianGrid stroke={T.border} /><XAxis dataKey="month" /><YAxis tickFormatter={(value) => `${value}%`} /><Tooltip formatter={(_value, name, entry) => formatMoneyBRL(name === "Receitas" ? entry.payload.income : entry.payload.expenses)} /><Legend /><Line dataKey="entradas" name="Receitas" stroke="#00a873" /><Line dataKey="saidas" name="Despesas" stroke="#d94040" /></LineChart></ResponsiveContainer>{months.map((item) => <p key={item.month}>{item.month}: receitas {formatMoneyBRL(item.income)} · despesas {formatMoneyBRL(item.expenses)} · saldo {formatMoneyBRL(item.balance)}</p>)}</Panel>}
        {tab === "flow" && <Panel title="Entradas e saídas"><ResponsiveContainer width="100%" height={380}><BarChart data={monthChart}><CartesianGrid stroke={T.border} /><XAxis dataKey="month" /><YAxis tickFormatter={(value) => `${value}%`} /><Tooltip formatter={(_value, name, entry) => formatMoneyBRL(name === "Entradas" ? entry.payload.income : entry.payload.expenses)} /><Legend /><Bar dataKey="entradas" name="Entradas" fill="#00a873" /><Bar dataKey="saidas" name="Saídas" fill="#d94040" /></BarChart></ResponsiveContainer></Panel>}
        {tab === "transactions" && <Panel title={`Transações no período (${visible.length})`}>
          <label className="transaction-category-filter">Filtrar por categoria<select value={filter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas</option>{finance.categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {category.id}</option>)}</select></label>
          {!visible.length && <p role="status">Nenhuma transação nesta categoria ou período.</p>}
          <div className="transaction-list">{visible.map((item) => <div className="transaction" key={item.id}>
            <span className="transaction-icon" aria-hidden="true">{item.type === "INCOME" ? "↗" : "↘"}</span>
            <div><strong>{item.description || "Sem descrição"}</strong><small>{dateBR(item.transactionDate)} · {item.categoryName}</small></div>
            <b className={item.type === "INCOME" ? "income" : "expense"}>{formatMoneyBRL(item.signedAmount)}</b>
            <div className="transaction-actions"><button type="button" disabled={writeBlocked} aria-label={`Editar ${item.description || "lançamento"}`} onClick={(event) => open(event, "transaction", item.id)}>Editar</button><button type="button" disabled={writeBlocked} aria-label={`Excluir ${item.description || "lançamento"}`} onClick={(event) => open(event, "deleteTransaction", item.id)}>Excluir</button></div>
          </div>)}</div>
        </Panel>}
        {tab === "categories" && <Panel title="Categorias"><div className="category-management-list">{categories.map((category) => <div className="category-management-row" key={category.id}><span><i style={{ background: category.color }} />{category.name}</span><b>{category.expenses ? formatMoneyBRL(category.expenses) : "Sem lançamentos"}</b><div><button type="button" disabled={writeBlocked} aria-label={`Editar categoria ${category.name}`} onClick={(event) => open(event, "category", category.id)}>Editar</button><button type="button" disabled={writeBlocked} aria-label={`Excluir categoria ${category.name}`} onClick={(event) => open(event, "deleteCategory", category.id)}>Apagar</button></div></div>)}</div>{!categories.length && <p role="status">Nenhuma categoria criada.</p>}<button type="button" disabled={writeBlocked} className="finance-add category-management-add" onClick={(event) => open(event, "category")}>＋ Nova categoria</button></Panel>}
      </section>}
      <Dialog.Root open={dialogOpen} onOpenChange={(open) => { if (!open) close(); }}>
        <Dialog.Portal><Dialog.Overlay className="financial-dialog-overlay" /><Dialog.Content className="financial-dialog-content" aria-describedby={undefined}
          onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onPointerDownOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current?.isConnected && !opener.current.disabled ? opener.current : addButton.current;
            (target && !target.disabled ? target : heading.current)?.focus();
          }}>
          <Dialog.Title className="financial-dialog-title">{editor?.kind?.startsWith("delete") ? "Confirmar exclusão" : "Lançamentos e categorias"}</Dialog.Title>
          {editor?.kind === "transaction" && <TransactionForm transactionId={editor.id} onCancel={close} />}
          {editor?.kind === "category" && <CategoryForm categoryId={editor.id} onCancel={close} />}
          {editor?.kind?.startsWith("delete") && <DeleteFinancialRecordForm kind={editor.kind === "deleteTransaction" ? "transaction" : "category"} id={editor.id} onCancel={close} />}
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>
    </main>
  </>;
}

function Panel({ title, children }) { return <article className="finance-panel"><h2>{title}</h2>{children}</article>; }
function Kpi({ label, value, color, tokens, raw }) { return <article className="finance-kpi" style={{ background: tokens.surface, borderColor: tokens.border }}><span>{label}</span><strong style={{ color }}>{value == null ? "Indisponível" : raw ? value : formatMoneyBRL(value)}</strong></article>; }
