import { useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { useUser } from "@/contexts/useUser";
import useFinanceData from "@/contexts/useFinanceData";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import AssistantConversation from "@/components/chat/AssistantConversation";
import { aggregateByCategory, summarizeTransactions } from "@/services/finance/store";
import { calculateFinancialHealth } from "@/services/finance/financeHealth";
import useAssistantConversation from "@/hooks/useAssistantConversation";

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

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDueDate, setGoalDueDate] = useState("");
  const {
    transactions,
    categories,
    categoryColors,
    goals,
    addTransaction,
    updateGoals,
  } = useFinanceData();

  const conversation = useAssistantConversation({ addTransaction });
  const {
    inputValue,
    setInputValue,
    messages,
    pendingExpense,
    isTyping,
    handleSubmit,
    registerExpense,
  } = conversation;

  const { profile } = useUser();

  const embedded = isEmbedded || variant === "embedded";
  const embeddedStyle = {
    "--assistant-height": typeof height === "number" ? `${height}px` : height || "360px",
    "--assistant-width": typeof width === "number" ? `${width}px` : width || "100%",
  };

  const user = {
    name: profile.nome || profile.email?.split("@")[0] || "Usuário",
  };

  const goalBalance = transactions.reduce((sum, item) => sum + item.amount, 0);
  const goal = goals[0] || null;
  const goalAllocations = goals.map((item, index) => {
    const allocatedBefore = goals.slice(0, index).reduce((sum, previousGoal) => sum + previousGoal.target, 0);
    const current = Math.min(item.target, Math.max(0, goalBalance - allocatedBefore));
    return {
      ...item,
      current,
      percentage: item.target > 0 ? Math.round((current / item.target) * 100) : 0,
      remaining: Math.max(0, item.target - current),
    };
  });

  const openGoalForm = (currentGoal = null) => {
    setEditingGoalId(currentGoal?.id || null);
    setGoalName(currentGoal?.name || "");
    setGoalTarget(currentGoal ? String(currentGoal.target).replace(".", ",") : "");
    setGoalDueDate(currentGoal?.dueDate || "");
    setGoalFormOpen(true);
  };

  const closeGoalForm = () => {
    setGoalFormOpen(false);
    setEditingGoalId(null);
    setGoalName("");
    setGoalTarget("");
    setGoalDueDate("");
  };

  const submitGoal = (event) => {
    event.preventDefault();
    const name = goalName.trim();
    const target = Number(goalTarget.replace(",", "."));
    if (!name || !Number.isFinite(target) || target <= 0 || !goalDueDate) return;
    const nextGoals = editingGoalId
      ? goals.map((item) => item.id === editingGoalId ? { ...item, name, target: Math.max(target, goalBalance), dueDate: goalDueDate } : item)
      : [...goals, { id: `goal-${Date.now()}`, name, current: 0, target, dueDate: goalDueDate }];
    updateGoals(nextGoals);
    closeGoalForm();
  };

  const deleteGoal = (id) => {
    const nextGoals = goals.filter((item) => item.id !== id);
    updateGoals(nextGoals);
  };

  const moveGoal = (id, direction) => {
    const index = goals.findIndex((item) => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= goals.length) return;
    const nextGoals = [...goals];
    [nextGoals[index], nextGoals[nextIndex]] = [nextGoals[nextIndex], nextGoals[index]];
    updateGoals(nextGoals);
  };

  const financialHealth = calculateFinancialHealth(transactions);

  const { income: monthlyIncome, expenses: monthlyExpenses, balance } = summarizeTransactions(transactions);
  const balanceClass =
    balance > 0
      ? "assistant__summary-value--positive"
      : balance < 0
        ? "assistant__summary-value--negative"
        : "assistant__summary-value--neutral";
  const categoryData = aggregateByCategory(transactions, categories, categoryColors);
  const monthlyBalanceClass = balance >= 0
    ? "assistant__widget-month-value--positive"
    : "assistant__widget-month-value--negative";
  const monthlyBalanceFormatted = `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const monthlyOverview = {
    categories: categoryData.map((category) => ({ ...category, percentage: category.pct, emoji: category.icon })),
    transactions: transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((transaction) => ({
      description: transaction.desc,
      category: transaction.category,
      emoji: transaction.icon,
      value: `R$ ${Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      type: transaction.amount > 0 ? "income" : "expense",
    })),
  };
  const donutTotal = categoryData.reduce((sum, category) => sum + category.value, 0);
  const donutGradient = categoryData.length && donutTotal
    ? `conic-gradient(${categoryData.map((category, index) => {
      const start = categoryData.slice(0, index).reduce((sum, item) => sum + (item.value / donutTotal) * 100, 0);
      return `${category.color} ${start}% ${start + (category.value / donutTotal) * 100}%`;
    }).join(", ")})`
    : "transparent";

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
            R$ {monthlyIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
            R$ {monthlyExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isTyping={isTyping}
          pendingExpense={pendingExpense}
          categories={categories}
          handleSubmit={handleSubmit}
          registerExpense={registerExpense}
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
            <div className="assistant__widget-header">
              <div>
                <span className="assistant__widget-label">Metas</span>
                <h2 className="assistant__widget-title">{goal ? goal.name : "Nenhuma meta criada"}</h2>
              </div>
              <button type="button" className="assistant__goal-add" onClick={() => openGoalForm()}>
                + Nova meta
              </button>
            </div>

            {goalFormOpen && <form className="assistant__goal-form" onSubmit={submitGoal}>
              <input autoFocus aria-label="Nome da meta" value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Nome da meta" required />
              <input aria-label="Valor alvo" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value.replace(/[^\d.,]/g, ""))} placeholder="Valor alvo" inputMode="decimal" required />
              <input aria-label="Prazo" type="date" value={goalDueDate} onChange={(event) => setGoalDueDate(event.target.value)} required />
              <div><button type="button" onClick={closeGoalForm}>Cancelar</button><button type="submit">{editingGoalId ? "Salvar" : "Criar"}</button></div>
            </form>}

            {goalAllocations.map((item, index) => {
              const { current, percentage, remaining } = item;
              return <div className="assistant__goal-item" key={item.id}>
                <div className="assistant__goal-item-header">
                  <strong>{item.name}</strong>
                  <span>
                    <button type="button" onClick={() => moveGoal(item.id, -1)} disabled={index === 0} aria-label={`Priorizar ${item.name}`}>↑</button>
                    <button type="button" onClick={() => moveGoal(item.id, 1)} disabled={index === goalAllocations.length - 1} aria-label={`Adiar ${item.name}`}>↓</button>
                    <button type="button" onClick={() => openGoalForm(item)} aria-label={`Editar ${item.name}`}>Editar</button>
                    <button type="button" onClick={() => deleteGoal(item.id)} aria-label={`Excluir ${item.name}`}>Excluir</button>
                  </span>
                </div>
                <strong className="assistant__widget-value">{percentage}%</strong>
                <div className="assistant__goal-progress"><span style={{ width: `${percentage}%` }} /></div>
                <div className="assistant__widget-footer"><span>R$ {current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span><span>de R$ {item.target.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>
                <p className="assistant__widget-caption">Prazo: {item.dueDate ? item.dueDate.split("-").reverse().join("/") : "Não definido"}</p>
                <p className="assistant__widget-caption">R$ {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} restantes</p>
              </div>;
            })}
          </section>

          {/* Saúde Financeira */}

          <section className="assistant__widget assistant__widget--health">

            <span className="assistant__widget-label">
              Saúde financeira
            </span>

            <h2 className="assistant__widget-title">
              Como você está indo
            </h2>

            <div className="assistant__health-content">

              <strong className="assistant__health-score">
                {financialHealth.score}%
              </strong>

              <span className="assistant__health-status">
                {financialHealth.status}
              </span>

            </div>

            <div className="assistant__health-progress">
              <span
                style={{
                  width: `${financialHealth.score}%`,
                }}
              />
            </div>

            <p className="assistant__health-context">
              Poupança: {financialHealth.savingsRate}% · Custos fixos: {financialHealth.fixedCommitment}% · Consistência: {financialHealth.consistency}%
            </p>

            <p className="assistant__widget-caption">
              {financialHealth.action}
            </p>

          </section>

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
                  {monthlyOverview.categories.length}
                </span>
              </div>

              <div className="assistant__category-list">

                {monthlyOverview.categories.map(
                  (category) => (
                    <div
                      className="assistant__category"
                      key={category.name}
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

                {monthlyOverview.transactions.map(
                  (transaction, index) => (
                    <div
                      className="assistant__transaction"
                      key={`${transaction.description}-${index}`}
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
