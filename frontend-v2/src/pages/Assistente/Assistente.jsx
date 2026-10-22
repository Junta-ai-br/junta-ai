import { Link } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { useUser } from "@/contexts/useUser";
import useCanonicalFinance from "@/contexts/useCanonicalFinance";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import AssistantConversation from "@/components/chat/AssistantConversation";
import { groupByCategoryId } from "@/services/finance/exact-aggregates";
import { formatMoneyBRL } from "@/services/finance/signed-money";
import useAssistantConversation from "@/hooks/useAssistantConversation";
import useHealthScore from "@/hooks/useHealthScore";
import FinancialHealthCard from "@/components/finance/FinancialHealthCard";

import "./Assistente.css";

export default function Assistente({
  className = "",
  variant = "full",
  height,
  width,
  isEmbedded = false,
} = {}) {
  /* ==========================================================================
     State
     ========================================================================== */

  const finance = useCanonicalFinance();
  const conversation = useAssistantConversation({ refreshFinancialData: finance.reload });
  const waitingForChat = conversation.isTyping || !!conversation.recovery;
  const covered = !waitingForChat && !finance.refreshRequired
    && ["success", "empty"].includes(finance.status) && finance.coverage?.complete === true;
  const transactions = covered ? finance.transactions : [];
  const summary = covered ? finance.summary : null;
  const health = useHealthScore(finance, waitingForChat);
  const money = (value) => value == null ? "Indisponível" : formatMoneyBRL(value);

  const { profile } = useUser();

  const embedded = isEmbedded || variant === "embedded";
  const embeddedStyle = {
    "--assistant-height": typeof height === "number" ? `${height}px` : height || "360px",
    "--assistant-width": typeof width === "number" ? `${width}px` : width || "100%",
  };

  const user = {
    name: profile.nome || profile.email?.split("@")[0] || "Usuário",
  };

  const balance = summary?.balanceCents;
  const balanceClass = balance > 0n ? "assistant__summary-value--positive"
    : balance < 0n ? "assistant__summary-value--negative" : "assistant__summary-value--neutral";
  const colors = ["#7c3aed", "#00a873", "#e07a15", "#cd537a", "#3589cb"];
  const categoryData = groupByCategoryId(transactions).filter((item) => item.expensesCents > 0n)
    .sort((a, b) => a.expensesCents > b.expensesCents ? -1 : a.expensesCents < b.expensesCents ? 1 : a.categoryId.localeCompare(b.categoryId))
    .map((item, index) => ({ ...item, name: finance.categories.find((category) => category.id.toLowerCase() === item.categoryId.toLowerCase())?.name,
      color: colors[index % colors.length], emoji: "↘",
      percentage: Number(item.expensesCents * 1000n / summary.expensesCents) / 10 }));
  const monthlyBalanceClass = balance < 0n ? "assistant__widget-month-value--negative" : "assistant__widget-month-value--positive";
  const monthlyBalanceFormatted = money(summary?.balance);
  const monthlyOverview = {
    categories: categoryData,
    transactions: [...transactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)
      || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)).slice(0, 4).map((transaction) => ({
      id: transaction.id, description: transaction.description || "Sem descrição", category: transaction.categoryName,
      emoji: transaction.type === "INCOME" ? "↗" : "↘", value: formatMoneyBRL(transaction.amount),
      type: transaction.type === "INCOME" ? "income" : "expense",
    })),
  };
  let angle = 0;
  const donutGradient = categoryData.length ? `conic-gradient(${categoryData.map((category) => {
    const start = angle;
    angle += category.percentage;
    return `${category.color} ${start}% ${angle}%`;
  }).join(", ")})` : "transparent";

  /* ==========================================================================
     Chat
     ========================================================================== */

  /* ==========================================================================
     Navigation
     ========================================================================== */

  return (
    <main
      className={`assistant${embedded ? " assistant--embedded" : ""}${className ? ` ${className}` : ""}`}
      style={embeddedStyle}
    >

      {/* ==================================================================
          Navigation
          ================================================================== */}

      {!embedded && <AuthHeader activePath="/assistente" />}

      {/* ==================================================================
          Intro
          ================================================================== */}

      <section className="assistant__intro">
        <h1 className="assistant__title">
          Como posso ajudar hoje, {user.name}?
        </h1>
      </section>

      {/* ==================================================================
          Financial Summary
          ================================================================== */}

      <div className="assistant__financial-status" aria-live="polite">
        <p>Mês corrente: {finance.period.from.split("-").reverse().join("/")} a {finance.period.to.split("-").reverse().join("/")}</p>
        {waitingForChat ? <p role="status">Aguardando confirmação e atualização dos dados financeiros. Retome o envio pendente no chat quando necessário.</p>
          : !covered && ["idle", "loading"].includes(finance.status) ? <p role="status">Carregando dados financeiros…</p>
          : !covered && <div role="alert"><p>Não foi possível confirmar os dados financeiros atuais.</p><button type="button" onClick={() => finance.reload()}>Atualizar dados</button></div>}
      </div>
      <section
        className="assistant__summary"
        aria-label="Resumo financeiro"
      >

        <article className="assistant__summary-card assistant__summary-card--income">

          <div className="assistant__summary-icon">
            <TrendingUp
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <span className="assistant__summary-label">
            Receitas
          </span>

          <strong className="assistant__summary-value">
            {money(summary?.income)}
          </strong>

        </article>

        <article className="assistant__summary-card assistant__summary-card--expense">

          <div className="assistant__summary-icon">
            <TrendingDown
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <span className="assistant__summary-label">
            Despesas
          </span>

          <strong className="assistant__summary-value">
            {money(summary?.expenses)}
          </strong>

        </article>

        <article className="assistant__summary-card assistant__summary-card--balance">

          <div className="assistant__summary-icon">
            <WalletCards
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <span className="assistant__summary-label">
            Saldo
          </span>

          <strong
            className={`assistant__summary-value ${balanceClass}`}
          >
            {money(summary?.balance)}
          </strong>

        </article>

      </section>

      {/* ==================================================================
          Workspace
          ================================================================== */}

      <section className="assistant__workspace">

        {/* =================================================================
            Conversation
            ================================================================= */}

        <AssistantConversation
          {...conversation}
        />

        {/* =================================================================
            Sidebar
            ================================================================= */}

        <aside
          className="assistant__sidebar"
          aria-label="Resumo da sua vida financeira"
        >

          {/* Metas */}

          <section className="assistant__widget assistant__widget--goals">
            <div className="assistant__widget-header"><div>
              <span className="assistant__widget-label">Metas</span>
              <h2 className="assistant__widget-title">Indisponível</h2>
            </div></div>
            <p className="assistant__widget-caption">As metas ainda não estão integradas neste painel.</p>
          </section>

          {/* Saúde Financeira */}

          <FinancialHealthCard health={health} onRetry={finance.reload} />

          {/* Visão do Mês */}

          <Link
            to="/visao-mes"
            className="assistant__widget assistant__widget--dashboard assistant__month-link"
          >

            <div className="assistant__widget-header">

              <div>

                <span className="assistant__widget-label">
                  Visão do mês
                </span>

                <h2 className="assistant__widget-title">
                  Seus números
                </h2>

              </div>

              <strong
                className={`assistant__widget-month-value ${monthlyBalanceClass}`}
              >
                {monthlyBalanceFormatted}
              </strong>

            </div>

            {/* Donut */}

            <div className="assistant__month-overview">

              <div
                className="assistant__month-donut"
                style={{
                  background: donutGradient,
                }}
                aria-label="Distribuição dos gastos por categoria"
              >
                <span>
                  {covered ? monthlyOverview.categories.length : "—"}
                </span>
              </div>

              <div className="assistant__category-list">

                {monthlyOverview.categories.map(
                  (category) => (
                    <div
                      className="assistant__category"
                      key={category.categoryId}
                    >

                      <span
                        className="assistant__category-dot"
                        style={{
                          backgroundColor:
                            category.color,
                        }}
                        aria-hidden="true"
                      />

                      <span className="assistant__category-emoji">
                        {category.emoji}
                      </span>

                      <span className="assistant__category-name">
                        {category.name}
                      </span>

                      <strong>
                        {category.percentage}%
                      </strong>

                    </div>
                  )
                )}

              </div>

            </div>

            {/* Últimos lançamentos */}

            <div className="assistant__transactions">

              <span className="assistant__transactions-title">
                Últimos lançamentos
              </span>

              <div className="assistant__transactions-list">

                {covered && !transactions.length && <p role="status">Nenhuma movimentação neste mês.</p>}
                {!covered && <p>Lançamentos indisponíveis.</p>}
                {monthlyOverview.transactions.map(
                  (transaction) => (
                    <div
                      className="assistant__transaction"
                      key={transaction.id}
                    >

                      <div className="assistant__transaction-icon">
                        <span aria-hidden="true">
                          {transaction.emoji}
                        </span>
                      </div>

                      <div className="assistant__transaction-info">

                        <strong>
                          {transaction.description}
                        </strong>

                        <span>
                          {transaction.category}
                        </span>

                      </div>

                      <strong
                        className={`assistant__transaction-value ${
                          transaction.type === "income"
                            ? "assistant__transaction-value--income"
                            : "assistant__transaction-value--expense"
                        }`}
                      >
                        {transaction.type === "income"
                          ? "+"
                          : "-"}{" "}
                        {transaction.value}
                      </strong>

                    </div>
                  )
                )}

              </div>

            </div>

          </Link>

        </aside>

      </section>

    </main>
  );
}
