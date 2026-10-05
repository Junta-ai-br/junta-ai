import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_META, aggregateByCategory, aggregateByMonth, aggregateCategoryHistory, filterByRange, formatDateBR, formatMoney, getCurrentMonthRange, saveDateRange, summarizeTransactions } from "@/services/finance/store";
import useFinanceData from "@/contexts/useFinanceData";
import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";
import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import "./VisaoMes.css";

const TABS = [["overview", "Visão geral"], ["history", "Histórico"], ["transactions", "Transações"], ["flow", "Entradas e saídas"], ["categories", "Categorias"]];
const THEME_TOKENS = {
  dark: { bg: "#0f0f0f", surface: "#1a1a1a", border: "#2e2e2e", text: "#f0f0f0", textMuted: "#888", textDim: "#444", inputBg: "#111" },
  light: { bg: "#f0f2f5", surface: "#fff", border: "#e2e5eb", text: "#111827", textMuted: "#6b7280", textDim: "#9ca3af", inputBg: "#f0f2f5" },
};

export default function VisaoMes({ title = "Visão do mês", variant = "month" } = {}) {
  const { theme } = useTheme();
  const T = THEME_TOKENS[theme === THEMES.DARK ? "dark" : "light"];
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState(variant === "all" ? null : getCurrentMonthRange);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#7c3aed");
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionType, setTransactionType] = useState("expense");
  const [transactionCategory, setTransactionCategory] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("Todas");
  const {
    transactions,
    categories,
    categoryColors,
    replaceTransactions,
    updateCategories,
    updateCategoryColors,
  } = useFinanceData();

  const filtered = useMemo(() => filterByRange(transactions, range), [transactions, range]);
  const sortedTransactions = useMemo(
    () => [...filtered].sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  );
  const visibleTransactions = transactionCategoryFilter === "Todas"
    ? sortedTransactions
    : sortedTransactions.filter((transaction) => transaction.category === transactionCategoryFilter);
  const byCategory = useMemo(() => aggregateByCategory(filtered, categories, categoryColors), [filtered, categories, categoryColors]);
  const byMonth = useMemo(() => aggregateByMonth(filtered), [filtered]);
  const history = useMemo(
    () => aggregateCategoryHistory(variant === "all" ? transactions : filtered, categories, categoryColors),
    [variant, transactions, filtered, categories, categoryColors],
  );
  const historyChartData = useMemo(
    () => history.months.map(({ key, label }) => ({ mes: label, ...Object.fromEntries(history.categories.map((category) => [category.name, category.values[key]])) })),
    [history],
  );
  const { income, expenses, balance } = summarizeTransactions(filtered);
  const tooltip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text };

  const addCategory = (event) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name || categories.includes(name)) return;
    if (editingCategory) {
      const nextTransactions = transactions.map((transaction) => transaction.category === editingCategory ? { ...transaction, category: name } : transaction);
      const nextCategories = categories.map((category) => category === editingCategory ? name : category);
      const nextColors = { ...categoryColors, [name]: newCategoryColor };
      delete nextColors[editingCategory];
      replaceTransactions(nextTransactions);
      updateCategories(nextCategories);
      updateCategoryColors(nextColors);
    } else {
      updateCategories([...categories, name]);
      updateCategoryColors({ ...categoryColors, [name]: newCategoryColor });
    }
    setNewCategory("");
    setNewCategoryColor("#7c3aed");
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const openCategoryForm = (category = null) => {
    setEditingCategory(category);
    setNewCategory(category || "");
    setNewCategoryColor(category ? categoryColors[category] || "#7c3aed" : "#7c3aed");
    setShowCategoryForm(true);
  };

  const closeCategoryForm = () => {
    setEditingCategory(null);
    setNewCategory("");
    setNewCategoryColor("#7c3aed");
    setShowCategoryForm(false);
  };

  const deleteCategory = (category) => {
    const nextCategories = categories.filter((item) => item !== category);
    const nextColors = { ...categoryColors };
    delete nextColors[category];
    updateCategories(nextCategories);
    updateCategoryColors(nextColors);
  };

  const openTransactionForm = (transaction = null) => {
    setEditingTransactionId(transaction?.id || null);
    setTransactionDescription(transaction?.desc || "");
    setTransactionDate(transaction?.date || range?.end || getCurrentMonthRange().end);
    setTransactionType(transaction?.amount > 0 ? "income" : "expense");
    setTransactionCategory(transaction?.category || categories.find((category) => category !== "Renda") || categories[0] || "");
    setTransactionAmount(transaction ? String(Math.abs(transaction.amount)).replace(".", ",") : "");
    setShowTransactionForm(true);
  };

  const closeTransactionForm = () => {
    setShowTransactionForm(false);
    setEditingTransactionId(null);
    setTransactionDescription("");
    setTransactionDate("");
    setTransactionType("expense");
    setTransactionCategory("");
    setTransactionAmount("");
  };

  const submitTransaction = (event) => {
    event.preventDefault();
    const description = transactionDescription.trim();
    const amount = Number(transactionAmount.replace(",", "."));
    if (!description || !transactionDate || !transactionCategory || !Number.isFinite(amount) || amount <= 0) return;

    const transaction = {
      id: editingTransactionId || `transaction-${Date.now()}`,
      date: transactionDate,
      category: transactionCategory,
      desc: description,
      amount: transactionType === "income" ? amount : -amount,
      icon: CATEGORY_META[transactionCategory]?.icon || "💰",
    };
    const nextTransactions = editingTransactionId
      ? transactions.map((item) => item.id === editingTransactionId ? transaction : item)
      : [...transactions, transaction];
    replaceTransactions(nextTransactions);
    closeTransactionForm();
  };

  const deleteTransaction = (id) => {
    replaceTransactions(transactions.filter((transaction) => transaction.id !== id));
  };

  return <>
    <AuthHeader
      activePath={variant === "all" ? "/dashboard" : "/visao-mes"}
      variant="finance"
      dateRange={range}
      onAddCategory={openCategoryForm}
      onDateRangeChange={(next) => {
        setRange(next);
        saveDateRange(next);
      }}
    />

    <main className="finance-page" style={{ background: T.bg, color: T.text }}>
      <header className="finance-header" style={{ background: T.surface, borderColor: T.border }}>
        <div>
          <h1>{title}</h1>
          <p>{range ? `${formatDateBR(range.start)} até ${formatDateBR(range.end)} · ` : "Todos os períodos · "}{filtered.length} transações</p>
        </div>
        <div className="finance-header-actions">
          <button type="button" className="finance-add" onClick={() => openTransactionForm()}>＋ Lançamento</button>
        </div>
      </header>

      <section className="finance-kpis" aria-label="Indicadores financeiros"><Kpi label="Receitas" value={income} color="#00d084" tokens={T} /><Kpi label="Despesas" value={expenses} color="#ff4444" tokens={T} /><Kpi label="Saldo" value={balance} color={balance >= 0 ? "#00d084" : "#ff4444"} tokens={T} /><Kpi label="Categorias" value={categories.length} color="#f59e0b" tokens={T} raw /></section>
      {filtered.length === 0 && <p role="status" className="finance-empty-state">Nenhuma movimentação neste período. Escolha outro período ou adicione um lançamento.</p>}
    <nav className="finance-tabs" aria-label="Seções da visão do mês">{TABS.map(([id, label]) => <button type="button" key={id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}>{label}</button>)}</nav>

    <section className="finance-content">
      {tab === "overview" && <div className="finance-grid"><Panel title="Gastos por categoria"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={72} outerRadius={105}>{byCategory.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /></PieChart></ResponsiveContainer><CategoryRows data={byCategory} tokens={T} /></Panel><Panel title="Valor por categoria"><ResponsiveContainer width="100%" height={350}><BarChart data={byCategory} layout="vertical" margin={{ left: 12, right: 16 }}><CartesianGrid stroke={T.border} horizontal={false} /><XAxis type="number" stroke={T.textDim} tickFormatter={(value) => `R$${value}`} /><YAxis type="category" dataKey="name" width={90} stroke={T.textMuted} /><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /><Bar dataKey="value" fill="#7c3aed" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Panel></div>}
      {tab === "history" && <Panel title={`Evolução Mensal por Categoria (${variant === "all" ? "todo período" : "este mês"})`}><div className="history-chart"><ResponsiveContainer width="100%" height={380}><LineChart data={historyChartData} margin={{ top: 8, right: 18, left: 8, bottom: 8 }}><CartesianGrid stroke={T.border} strokeDasharray="4 4" vertical={false} /><XAxis dataKey="mes" stroke={T.textMuted} /><YAxis stroke={T.textMuted} tickFormatter={(value) => `R$${value}`} /><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /><Legend verticalAlign="bottom" height={34} />{history.categories.map((category) => <Line key={category.name} type="monotone" dataKey={category.name} name={category.name} stroke={category.color} strokeWidth={2.5} dot={{ r: 3, fill: category.color }} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer></div><SummaryCards categories={history.categories} tokens={T} /></Panel>}
      {tab === "flow" && <Panel title="Entradas e saídas"><ResponsiveContainer width="100%" height={380}><BarChart data={byMonth}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="mes" stroke={T.textMuted} /><YAxis stroke={T.textMuted} tickFormatter={(value) => `R$${value}`} /><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /><Legend /><Bar dataKey="entradas" name="Entradas" fill="#00d084" radius={[5, 5, 0, 0]} /><Bar dataKey="saidas" name="Saídas" fill="#ff4444" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Panel>}
      {tab === "transactions" && <Panel title={`Transações no período (${visibleTransactions.length})`}>
        <label className="transaction-category-filter">Filtrar por categoria
          <select aria-label="Filtrar por categoria" value={transactionCategoryFilter} onChange={(event) => setTransactionCategoryFilter(event.target.value)}>
            <option value="Todas">Todas</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        {visibleTransactions.length === 0
          ? <p role="status" className="finance-empty-state">{sortedTransactions.length ? "Nenhuma transação nesta categoria." : "Nenhuma transação neste período."}</p>
          : <div className="transaction-list">{visibleTransactions.map((item) => <div className="transaction" key={item.id}>
            <span className="transaction-icon">{item.icon || CATEGORY_META[item.category]?.icon || "💰"}</span>
            <div><strong>{item.desc}</strong><small>{formatDateBR(item.date)} · {item.category}</small></div>
            <b className={item.amount > 0 ? "income" : "expense"}>{item.amount > 0 ? "+" : "-"}{formatMoney(item.amount)}</b>
            <div className="transaction-actions">
              <button type="button" aria-label={`Editar ${item.desc}`} onClick={() => openTransactionForm(item)}>Editar</button>
              <button type="button" aria-label={`Excluir ${item.desc}`} onClick={() => deleteTransaction(item.id)}>Excluir</button>
            </div>
          </div>)}</div>}
      </Panel>}
      {tab === "categories" && <Panel title="Categorias"><div className="category-management-list">{categories.map((category) => { const total = byCategory.find((item) => item.name === category)?.value || 0; return <div className="category-management-row" key={category}><span><i style={{ background: categoryColors[category] || "#888" }} />{CATEGORY_META[category]?.icon || "💰"} {category}</span><b>{formatMoney(total)}</b><div><button type="button" onClick={() => openCategoryForm(category)}>Editar</button><button type="button" onClick={() => deleteCategory(category)}>Apagar</button></div></div>; })}</div>{categories.length === 0 && <p className="category-empty">Nenhuma categoria criada.</p>}<button type="button" onClick={() => openCategoryForm()} className="finance-add category-management-add">＋ Nova categoria</button></Panel>}
    </section>

    {showCategoryForm && <div className="category-modal" role="dialog" aria-modal="true"><form onSubmit={addCategory} style={{ background: T.surface, borderColor: T.border }}><h2>{editingCategory ? "Editar categoria" : "Adicionar categoria"}</h2><input autoFocus value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Ex.: Educação" required /><label className="category-color-field">Cor da categoria<input type="color" value={newCategoryColor} onChange={(event) => setNewCategoryColor(event.target.value)} required /></label><div><button type="button" onClick={closeCategoryForm}>Cancelar</button><button type="submit">{editingCategory ? "Salvar" : "Adicionar"}</button></div></form></div>}
    {showTransactionForm && <div className="category-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-form-title"><form onSubmit={submitTransaction} style={{ background: T.surface, borderColor: T.border }}>
      <h2 id="transaction-form-title">{editingTransactionId ? "Editar lançamento" : "Adicionar lançamento"}</h2>
      <label>Descrição<input aria-label="Descrição" value={transactionDescription} onChange={(event) => setTransactionDescription(event.target.value)} required /></label>
      <label>Data<input aria-label="Data" type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} required /></label>
      <label>Tipo<select aria-label="Tipo" value={transactionType} onChange={(event) => setTransactionType(event.target.value)}><option value="expense">Despesa</option><option value="income">Receita</option></select></label>
      <label>Categoria<select aria-label="Categoria" value={transactionCategory} onChange={(event) => setTransactionCategory(event.target.value)} required>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
      <label>Valor<input aria-label="Valor" type="number" min="0.01" step="0.01" value={transactionAmount} onChange={(event) => setTransactionAmount(event.target.value)} required /></label>
      <div><button type="button" onClick={closeTransactionForm}>Cancelar</button><button type="submit">Salvar lançamento</button></div>
    </form></div>}
    </main>
  </>;
}

function Panel({ title, children }) { return <article className="finance-panel"><h2>{title}</h2>{children}</article>; }
function Kpi({ label, value, color, tokens, raw }) { return <article className="finance-kpi" style={{ background: tokens.surface, borderColor: tokens.border }}><span>{label}</span><strong style={{ color }}>{raw ? value : formatMoney(value)}</strong></article>; }
function CategoryRows({ data, tokens }) { return <div className="category-rows">{data.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.icon} {item.name}</span><b style={{ color: tokens.textMuted }}>{formatMoney(item.value)} · {item.pct}%</b></div>)}</div>; }
function SummaryCards({ categories, tokens }) { return <div className="history-summary-cards">{categories.map((category) => <article className="history-summary-card" key={category.name} style={{ background: tokens.surface, borderColor: tokens.border }}><span className="history-summary-icon">{category.icon}</span><span className="history-summary-name">{category.name}</span><strong style={{ color: category.color }}>{formatMoney(category.total)}</strong><small>{category.pct}% do total</small></article>)}</div>; }
