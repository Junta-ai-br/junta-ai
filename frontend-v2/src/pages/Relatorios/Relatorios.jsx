import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import useFinanceData from "@/contexts/useFinanceData";
import { loadDateRange } from "@/services/finance/store";
import { formatCurrency } from "@/utils/formatters";
import { exportToCSV, exportToExcel, exportToPDF } from "@/utils/report-exporters";
import { buildReport, getPeriodRange, getPreviousRange } from "./report-utils";
import "./Relatorios.css";

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "half-year", label: "Semestral" },
  { value: "yearly", label: "Anual" },
];

function useReportQuery() {
  const [period, setPeriod] = useState("monthly");
  const [date, setDate] = useState(() => loadDateRange().start.slice(0, 7));
  const [status, setStatus] = useState("success");
  const { transactions } = useFinanceData();

  const range = useMemo(() => getPeriodRange(date, period), [date, period]);
  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const report = useMemo(() => buildReport(transactions, range, previousRange), [transactions, range, previousRange]);

  function generateReport() {
    setStatus("loading");
    window.setTimeout(() => setStatus(report.hasTransactions ? "success" : "empty"), 650);
  }

  return { period, setPeriod, date, setDate, status, report, generateReport };
}

export default function Relatorios() {
  const query = useReportQuery();

  return (
    <div className="reports-page">
      <AuthHeader activePath="/relatorios" />
      <main className="reports-main">
        <PageHeaderBanner />
        <ReportFilterSection query={query} />
        {query.status === "success" ? (
          query.report.hasTransactions ? <ReportDashboardView report={query.report} onChangeFilters={() => window.scrollTo({ top: 330, behavior: "smooth" })} /> : <ReportFeedbackStates state="empty" onRetry={query.generateReport} />
        ) : (
          <ReportFeedbackStates state={query.status} onRetry={query.generateReport} />
        )}
      </main>
    </div>
  );
}

function PageHeaderBanner() {
  return (
    <section className="reports-hero">
      <div>
        <span className="reports-eyebrow"><BarChart3 size={15} /> Inteligência financeira</span>
        <h1>Relatórios financeiros</h1>
        <p>Entenda seus hábitos, acompanhe seu progresso e tome decisões com mais confiança.</p>
      </div>
      <aside className="reports-hero-note">
        <Lightbulb size={20} />
        <div><strong>Mais clareza para o seu amanhã</strong><span>Pequenas leituras hoje, grandes escolhas depois.</span></div>
      </aside>
    </section>
  );
}

function ReportFilterSection({ query }) {
  return (
    <section className="report-filters" aria-label="Filtros do relatório">
      <div className="period-tabs" role="tablist" aria-label="Tipo de período">
        {PERIOD_OPTIONS.map((option) => <button key={option.value} type="button" role="tab" aria-selected={query.period === option.value} className={query.period === option.value ? "is-active" : ""} onClick={() => query.setPeriod(option.value)}>{option.label}</button>)}
      </div>
      <div className="filter-controls">
        <label className="date-field"><span>Período de consulta</span><CalendarDays size={17} /><input type="month" value={query.date} onChange={(event) => query.setDate(event.target.value)} /></label>
        <button className="button button--primary generate-button" type="button" onClick={query.generateReport}><RefreshCw size={17} /> Gerar relatório</button>
      </div>
    </section>
  );
}

function ReportDashboardView({ report, onChangeFilters }) {
  const exportData = { ...report, period: report.period };
  return (
    <section className="report-dashboard">
      <ReportSummaryHeader period={report.period} />
      <div className="metric-grid">
        <MetricCard title="Receitas" value={formatCurrency(report.summary.income)} description="Total que entrou no período" icon={TrendingUp} tone="green" variation={report.summary.incomeChange} />
        <MetricCard title="Despesas" value={formatCurrency(report.summary.expenses)} description="Total que saiu no período" icon={ArrowDownRight} tone="red" variation={report.summary.expensesChange} />
        <MetricCard title="Saldo" value={formatCurrency(report.summary.balance)} description="Resultado do período" icon={Wallet} tone="aqua" variation={report.summary.balanceChange} />
      </div>
      <div className="report-content-grid">
        <FinancialChart data={report.chart} />
        <PeriodInsightsCard insights={report.insights} />
      </div>
      <ReportActions onChangeFilters={onChangeFilters} report={exportData} />
    </section>
  );
}

function ReportSummaryHeader({ period }) {
  return <div className="summary-heading"><div><span className="reports-eyebrow">Resumo do período</span><h2>Visão geral de {period}</h2></div><span className="period-badge"><Check size={14} /> Período fechado</span></div>;
}

function MetricCard({ title, value, description, icon: Icon, tone, variation }) {
  const positive = variation.startsWith("+");
  return <article className={`metric-card metric-card--${tone}`}><div className="metric-card-top"><span>{title}</span><span className="metric-icon"><Icon size={19} /></span></div><strong>{value}</strong><div className="metric-card-bottom"><span>{description}</span><b className={positive ? "variation-positive" : "variation-negative"}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{variation}</b></div></article>;
}

function FinancialChart({ data }) {
  return <article className="report-panel chart-panel"><div className="panel-heading"><div><span className="reports-eyebrow">Movimentação</span><h3>Receitas e despesas</h3></div><span className="chart-legend"><i className="legend-income" /> Receitas <i className="legend-expenses" /> Despesas</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} barGap={8} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border-subtle)" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(value) => `R$${value / 1000}k`} /><Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10 }} /><Bar dataKey="income" name="Receitas" fill="var(--green-500)" radius={[5, 5, 0, 0]} /><Bar dataKey="expenses" name="Despesas" fill="var(--red-400)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></article>;
}

function PeriodInsightsCard({ insights }) {
  return <article className="report-panel insights-panel"><div className="panel-heading"><div><span className="reports-eyebrow">Leitura rápida</span><h3>O que o período revela</h3></div><CircleDollarSign size={22} className="panel-heading-icon" /></div><div className="insights-list">{insights.map((insight) => <div className="insight-row" key={insight.label}><span className={`insight-dot insight-dot--${insight.tone}`} /><div><span>{insight.label}</span><strong>{insight.value}</strong><small>{insight.detail}</small></div></div>)}</div><div className="positive-callout"><TrendingUp size={18} /><span>Seu saldo fechou positivo. Continue priorizando o que traz tranquilidade.</span></div></article>;
}

function ReportActions({ onChangeFilters, report }) {
  return <div className="report-actions"><button type="button" className="text-button" onClick={onChangeFilters}><ChevronDown size={16} /> Alterar filtros</button><ExportActionsMenu report={report} /></div>;
}

function ExportActionsMenu({ report }) {
  return <div className="export-actions"><span>Exportar como</span><button type="button" title="Exportar CSV" onClick={() => exportToCSV(report)}><Download size={16} /> CSV</button><button type="button" title="Exportar PDF" onClick={() => exportToPDF(report)}><FileText size={16} /> PDF</button><button type="button" title="Exportar Excel" onClick={() => exportToExcel(report)}><FileSpreadsheet size={16} /> Excel</button></div>;
}

function ReportFeedbackStates({ state, onRetry }) {
  const content = {
    initial: { icon: BarChart3, title: "Seu resumo começa aqui", message: "Escolha um período para visualizar a sua leitura financeira." },
    loading: { icon: RefreshCw, title: "Estamos preparando seu relatório", message: "Organizando suas movimentações e encontrando os principais sinais." },
    empty: { icon: Wallet, title: "Ainda não há movimentações neste período", message: "Tente escolher outro mês para encontrar dados no seu histórico." },
    error: { icon: FileText, title: "Não foi possível gerar seu relatório", message: "Algo saiu do esperado. Tente novamente em alguns instantes." },
  }[state];
  const Icon = content.icon;
  return <section className={`report-feedback report-feedback--${state}`}><span className="feedback-icon"><Icon size={28} /></span><h2>{content.title}</h2><p>{content.message}</p>{state === "error" && <button type="button" className="button button--primary" onClick={onRetry}><RefreshCw size={16} /> Tentar novamente</button>}</section>;
}