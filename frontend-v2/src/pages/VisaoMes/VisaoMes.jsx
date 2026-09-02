import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_META, aggregateByCategory, aggregateByMonth, filterByRange, formatDateBR, formatMoney, loadCategories, loadDateRange, loadTransactions, saveCategories, saveDateRange } from "@/services/finance/store";
import DateRangeFilter from "./DateRangeFilter";
import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";
import "./VisaoMes.css";

const TABS = [["overview", "Visão geral"], ["history", "Histórico"], ["transactions", "Transações"], ["flow", "Entradas e saídas"]];
const THEME_TOKENS = {
  dark: { bg: "#0f0f0f", surface: "#1a1a1a", border: "#2e2e2e", text: "#f0f0f0", textMuted: "#888", textDim: "#444", inputBg: "#111" },
  light: { bg: "#f0f2f5", surface: "#fff", border: "#e2e5eb", text: "#111827", textMuted: "#6b7280", textDim: "#9ca3af", inputBg: "#f0f2f5" },
};

export default function VisaoMes() {
  const { theme } = useTheme();
  const T = THEME_TOKENS[theme === THEMES.DARK ? "dark" : "light"];
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState(loadDateRange);
  const [transactions, setTransactions] = useState(loadTransactions);
  const [categories, setCategories] = useState(loadCategories);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    const refresh = () => { setTransactions(loadTransactions()); setCategories(loadCategories()); };
    window.addEventListener("junta:transactions-changed", refresh);
    window.addEventListener("junta:categories-changed", refresh);
    return () => { window.removeEventListener("junta:transactions-changed", refresh); window.removeEventListener("junta:categories-changed", refresh); };
  }, []);

  const filtered = useMemo(() => filterByRange(transactions, range), [transactions, range]);
  const byCategory = useMemo(() => aggregateByCategory(filtered, categories), [filtered, categories]);
  const byMonth = useMemo(() => aggregateByMonth(transactions), [transactions]);
  const income = filtered.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expenses = filtered.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const tooltip = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text };

  const addCategory = (event) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name || categories.includes(name)) return;
    saveCategories([...categories, name]);
    setNewCategory("");
    setShowCategoryForm(false);
  };

  return <main className="finance-page" style={{ background: T.bg, color: T.text }}>
    <header className="finance-header" style={{ background: T.surface, borderColor: T.border }}>
      <Link to="/assistente" className="finance-back">← Assistente</Link>
      <div><h1>Visão do mês</h1><p>{formatDateBR(range.start)} até {formatDateBR(range.end)} · {filtered.length} transações</p></div>
      <div className="finance-header-actions"><button type="button" onClick={() => setShowCategoryForm(true)} className="finance-add">＋ Categoria</button><DateRangeFilter value={range} onChange={(next) => { setRange(next); saveDateRange(next); }} tokens={T} /></div>
    </header>

    <section className="finance-kpis"><Kpi label="Receitas" value={income} color="#00d084" tokens={T} /><Kpi label="Despesas" value={expenses} color="#ff4444" tokens={T} /><Kpi label="Saldo" value={income - expenses} color={income - expenses >= 0 ? "#00d084" : "#ff4444"} tokens={T} /><Kpi label="Categorias" value={categories.length} color="#f59e0b" tokens={T} raw /></section>
    <nav className="finance-tabs" aria-label="Seções da visão do mês">{TABS.map(([id, label]) => <button type="button" key={id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}>{label}</button>)}</nav>

    <section className="finance-content">
      {tab === "overview" && <div className="finance-grid"><Panel title="Gastos por categoria"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={72} outerRadius={105}>{byCategory.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /></PieChart></ResponsiveContainer><CategoryRows data={byCategory} tokens={T} /></Panel><Panel title="Valor por categoria"><ResponsiveContainer width="100%" height={350}><BarChart data={byCategory} layout="vertical" margin={{ left: 12, right: 16 }}><CartesianGrid stroke={T.border} horizontal={false} /><XAxis type="number" stroke={T.textDim} tickFormatter={(value) => `R$${value}`} /><YAxis type="category" dataKey="name" width={90} stroke={T.textMuted} /><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /><Bar dataKey="value" fill="#7c3aed" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></Panel></div>}
      {tab === "history" && <Panel title="Evolução mensal"><ResponsiveContainer width="100%" height={380}><LineChart data={byMonth}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="mes" stroke={T.textMuted} /><YAxis stroke={T.textMuted} tickFormatter={(value) => `R$${value}`} /><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /><Legend /><Line dataKey="entradas" name="Entradas" stroke="#00d084" strokeWidth={3} /><Line dataKey="saidas" name="Saídas" stroke="#ff4444" strokeWidth={3} /></LineChart></ResponsiveContainer></Panel>}
      {tab === "flow" && <Panel title="Entradas e saídas"><ResponsiveContainer width="100%" height={380}><BarChart data={byMonth}><CartesianGrid stroke={T.border} strokeDasharray="3 3" /><XAxis dataKey="mes" stroke={T.textMuted} /><YAxis stroke={T.textMuted} tickFormatter={(value) => `R$${value}`} /><Tooltip contentStyle={tooltip} formatter={(value) => formatMoney(Number(value))} /><Legend /><Bar dataKey="entradas" name="Entradas" fill="#00d084" radius={[5, 5, 0, 0]} /><Bar dataKey="saidas" name="Saídas" fill="#ff4444" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></Panel>}
      {tab === "transactions" && <Panel title={`Transações no período (${filtered.length})`}><div className="transaction-list">{filtered.sort((a, b) => b.date.localeCompare(a.date)).map((item) => <div className="transaction" key={item.id}><span className="transaction-icon">{item.icon || CATEGORY_META[item.category]?.icon || "💰"}</span><div><strong>{item.desc}</strong><small>{formatDateBR(item.date)} · {item.category}</small></div><b className={item.amount > 0 ? "income" : "expense"}>{item.amount > 0 ? "+" : "-"}{formatMoney(item.amount)}</b></div>)}</div></Panel>}
    </section>

    {showCategoryForm && <div className="category-modal" role="dialog" aria-modal="true"><form onSubmit={addCategory} style={{ background: T.surface, borderColor: T.border }}><h2>Adicionar categoria</h2><input autoFocus value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Ex.: Educação" /><div><button type="button" onClick={() => setShowCategoryForm(false)}>Cancelar</button><button type="submit">Adicionar</button></div></form></div>}
  </main>;
}

function Panel({ title, children }) { return <article className="finance-panel"><h2>{title}</h2>{children}</article>; }
function Kpi({ label, value, color, tokens, raw }) { return <article className="finance-kpi" style={{ background: tokens.surface, borderColor: tokens.border }}><span>{label}</span><strong style={{ color }}>{raw ? value : formatMoney(value)}</strong></article>; }
function CategoryRows({ data, tokens }) { return <div className="category-rows">{data.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.icon} {item.name}</span><b style={{ color: tokens.textMuted }}>{formatMoney(item.value)} · {item.pct}%</b></div>)}</div>; }
