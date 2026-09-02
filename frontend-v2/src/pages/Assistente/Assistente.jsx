import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ChevronDown,
  LogOut,
  Menu,
  SendHorizontal,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";

import logoHorizontalBranca from "@/assets/logos/logo-horizontal-branca.svg";
import logoHorizontalPreta from "@/assets/logos/logo-horizontal-preta.svg";

import ThemeSwitch from "@/components/navigation/ThemeSwitch";
import { CATEGORY_META, aggregateByCategory, loadCategories, loadTransactions, saveTransactions } from "@/services/finance/store";

import "./Assistente.css";

export default function Assistente() {
  /* ==========================================================================
     State
     ========================================================================== */

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [transactions, setTransactions] = useState(loadTransactions);
  const [categories, setCategories] = useState(loadCategories);
  const [isTyping, setIsTyping] = useState(false);

  const userMenuRef = useRef(null);

  /* ==========================================================================
     Theme
     ========================================================================== */

  const { theme } = useTheme();

  const isDark = theme === THEMES.DARK;

  const logo = isDark
    ? logoHorizontalBranca
    : logoHorizontalPreta;

  /* ==========================================================================
     User Menu
     ========================================================================== */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    const refreshFinanceData = () => {
      setTransactions(loadTransactions());
      setCategories(loadCategories());
    };

    window.addEventListener("junta:transactions-changed", refreshFinanceData);
    window.addEventListener("junta:categories-changed", refreshFinanceData);

    return () => {
      window.removeEventListener("junta:transactions-changed", refreshFinanceData);
      window.removeEventListener("junta:categories-changed", refreshFinanceData);
    };
  }, []);

  /* ==========================================================================
     User
     ========================================================================== */

  /*
   * TODO(AUTH):
   * Substituir pelos dados do usuário autenticado.
   */

  const user = {
    name: "Fulano",
    avatar: null,
  };

  /* ==========================================================================
     Logout
     ========================================================================== */

  const handleLogout = () => {
    /*
     * TODO(AUTH):
     * Implementar logout real.
     */

    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  /* ==========================================================================
     Financial Summary
     ========================================================================== */

  /*
   * TODO(DATA):
   * Substituir pelos dados financeiros vindos do backend.
   */

  const balance = 2359.5;

  const balanceClass =
    balance > 0
      ? "assistant__summary-value--positive"
      : balance < 0
        ? "assistant__summary-value--negative"
        : "assistant__summary-value--neutral";

  /* ==========================================================================
     Financial Widgets
     ========================================================================== */

  /*
   * TODO(DATA):
   * Substituir pelos dados vindos do backend.
   */

  const goal = {
    name: "Reserva de emergência",
    current: 4200,
    target: 6000,
    percentage: 70,
    remaining: 1800,
  };

  const financialHealth = {
    score: 82,
    status: "Ótimo",
  };

  const monthlyIncome = transactions
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const monthlyExpenses = transactions
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const categoryData = aggregateByCategory(transactions, categories);
  const monthlyBalanceClass = monthlyIncome - monthlyExpenses >= 0
    ? "assistant__widget-month-value--positive"
    : "assistant__widget-month-value--negative";
  const monthlyBalanceFormatted = `R$ ${(monthlyIncome - monthlyExpenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
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

  const handleSubmit = (event) => {
    event.preventDefault();

    const message = inputValue.trim();

    if (!message || isTyping) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: message,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);

    setInputValue("");
    setIsTyping(true);

    /*
     * TODO(IA):
     * Substituir este mock pela chamada real ao agente/backend.
     */

    const entryMatch = message.match(/\bentrada\s*:?\s*([\d]+(?:[.,]\d{1,2})?)/i);
    const exitMatch = message.match(/\b(sa[ií]da|gastei)\s*:?\s*([\d]+(?:[.,]\d{1,2})?)/i);
    const amount = Number((entryMatch?.[1] || exitMatch?.[2] || "0").replace(",", "."));
    const today = new Date().toISOString().split("T")[0];

    if (amount > 0 && entryMatch) {
      const transaction = { id: `chat-${Date.now()}`, date: today, category: "Renda", desc: "Entrada via chat", amount, icon: CATEGORY_META.Renda.icon };
      const next = [...transactions, transaction];
      saveTransactions(next);
      setTransactions(next);
      setMessages((currentMessages) => [...currentMessages, { id: Date.now() + 1, type: "assistant", text: "Entrada registrada. Seus gráficos já foram atualizados." }]);
      setIsTyping(false);
      return;
    }

    if (amount > 0 && exitMatch) {
      setPendingExpense({ amount, date: today, desc: "Saída via chat" });
      setMessages((currentMessages) => [...currentMessages, { id: Date.now() + 1, type: "assistant", text: "Qual categoria devo usar para essa saída?" }]);
      setIsTyping(false);
      return;
    }

    window.setTimeout(() => {
      setMessages((currentMessages) => [...currentMessages, { id: Date.now() + 1, type: "assistant", text: "Entendi! 💜 Vou considerar essa informação no seu planejamento financeiro." }]);
      setIsTyping(false);
    }, 1000);
  };

  const registerExpense = (category) => {
    if (!pendingExpense) return;
    const transaction = { id: `chat-${transactions.length + 1}`, ...pendingExpense, category, amount: -pendingExpense.amount, icon: CATEGORY_META[category]?.icon || "💰" };
    const next = [...transactions, transaction];
    saveTransactions(next);
    setTransactions(next);
    setPendingExpense(null);
    setMessages((currentMessages) => [...currentMessages, { id: Date.now() + 1, type: "assistant", text: `Saída registrada em ${category}. Seus gráficos já foram atualizados.` }]);
  };

  /* ==========================================================================
     Navigation
     ========================================================================== */

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <main className="assistant">

      {/* ==================================================================
          Navigation
          ================================================================== */}

      <header className="assistant__navbar">
        <div className="assistant__navbar-inner">

          <Link
            to="/assistente"
            className="assistant__logo"
            aria-label="Junta.ai — Assistente"
            onClick={closeMenu}
          >
            <img
              src={logo}
              alt="Junta.ai"
            />
          </Link>

          <nav
            className={`assistant__navigation ${
              isMenuOpen
                ? "assistant__navigation--open"
                : ""
            }`}
            aria-label="Navegação principal"
          >
            <Link
              to="/assistente"
              className="assistant__nav-link assistant__nav-link--active"
              onClick={closeMenu}
            >
              Assistente
            </Link>

            <Link
              to="/dashboard"
              className="assistant__nav-link"
              onClick={closeMenu}
            >
              Dashboard
            </Link>

            <Link
              to="/relatorios"
              className="assistant__nav-link"
              onClick={closeMenu}
            >
              Relatórios
            </Link>

            <Link
              to="/perfil"
              className="assistant__nav-link assistant__nav-link--mobile-only"
              onClick={closeMenu}
            >
              Perfil
            </Link>

            {/* Logout mobile */}
            <Link
              to="/"
              className="assistant__logout assistant__logout--mobile-only"
              onClick={handleLogout}
            >
              <LogOut
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>Sair</span>
            </Link>
          </nav>

          <div className="assistant__navbar-actions">

            <ThemeSwitch />

            {/* ============================================================
                User Menu
                ============================================================ */}

            <div
              className="assistant__user-menu"
              ref={userMenuRef}
            >
              <button
                type="button"
                className={`assistant__user ${
                  isUserMenuOpen
                    ? "assistant__user--open"
                    : ""
                }`}
                aria-label={`Menu de ${user.name}`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                onClick={() =>
                  setIsUserMenuOpen(
                    (current) => !current
                  )
                }
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="assistant__user-avatar"
                  />
                ) : (
                  <span className="assistant__user-avatar assistant__user-avatar--placeholder">
                    {user.name.charAt(0)}
                  </span>
                )}

                <span className="assistant__user-name">
                  {user.name}
                </span>

                <ChevronDown
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="assistant__user-dropdown"
                  role="menu"
                  aria-label={`Opções de ${user.name}`}
                >
                  <Link
                    to="/perfil"
                    className="assistant__user-dropdown-item"
                    role="menuitem"
                    onClick={() =>
                      setIsUserMenuOpen(false)
                    }
                  >
                    <span>Perfil</span>
                  </Link>

                  <Link
                    to="/configuracoes"
                    className="assistant__user-dropdown-item"
                    role="menuitem"
                    onClick={() =>
                      setIsUserMenuOpen(false)
                    }
                  >
                    <span>Configurações</span>
                  </Link>

                  <div className="assistant__user-dropdown-divider" />

                  {/* Logout desktop */}
                  <Link
                    to="/"
                    className="assistant__user-dropdown-item assistant__user-dropdown-item--logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut
                      size={16}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <span>Sair</span>
                  </Link>
                </div>
              )}
            </div>

            {/* ============================================================
                Mobile Menu Toggle
                ============================================================ */}

            <button
              type="button"
              className="assistant__menu-toggle"
              aria-label={
                isMenuOpen
                  ? "Fechar menu"
                  : "Abrir menu"
              }
              aria-expanded={isMenuOpen}
              onClick={() =>
                setIsMenuOpen(
                  (current) => !current
                )
              }
            >
              {isMenuOpen ? (
                <X
                  size={21}
                  strokeWidth={1.8}
                />
              ) : (
                <Menu
                  size={21}
                  strokeWidth={1.8}
                />
              )}
            </button>

          </div>
        </div>
      </header>

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
            R$ {(monthlyIncome - monthlyExpenses).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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

        <section
          className="assistant__conversation"
          aria-label="Conversa com o Junta.ai"
        >

          <div className="assistant__conversation-content">

            <div className="assistant__messages">

              {/* Empty State */}

              {messages.length === 0 && !isTyping && (
                <div className="assistant__empty-state">

                  <div className="assistant__empty-icon">
                    <img
                      src="/src/assets/logos/logo-icon.svg"
                      alt=""
                    />
                  </div>

                  <h2>
                    Vamos conversar sobre seu dinheiro?
                  </h2>

                  <p>
                    Me conte sobre seus gastos, receitas
                    ou objetivos. Eu posso ajudar você a
                    entender melhor sua vida financeira.
                  </p>

                </div>
              )}

              {/* Messages */}

              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`assistant__message assistant__message--${message.type}`}
                  initial={{
                    opacity: 0,
                    y: 12,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >

                  <div className="assistant__message-bubble">

                    {message.type === "assistant" && (
                      <span
                        className="assistant__message-brand"
                        aria-hidden="true"
                      >
                        <img
                          src="/src/assets/logos/logo-icon.svg"
                          alt=""
                        />
                      </span>
                    )}

                    <p>
                      {message.text}
                    </p>

                  </div>

                </motion.div>
              ))}

              {pendingExpense && (
                <div className="assistant__message assistant__message--assistant">
                  <div className="assistant__message-bubble assistant__category-picker">
                    {loadCategories().filter((category) => category !== "Renda").map((category) => (
                      <button type="button" key={category} onClick={() => registerExpense(category)}>
                        {CATEGORY_META[category]?.icon || "💰"} {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Typing Indicator */}

              {isTyping && (
                <motion.div
                  className="assistant__message assistant__message--assistant"
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                >

                  <div className="assistant__message-bubble assistant__message-bubble--typing">

                    <span
                      className="assistant__message-brand"
                      aria-hidden="true"
                    >
                      <img
                        src="/src/assets/logos/logo-icon.svg"
                        alt=""
                      />
                    </span>

                    <span
                      className="assistant__typing"
                      aria-label="Junta.ai está digitando"
                    >
                      <span />
                      <span />
                      <span />
                    </span>

                  </div>

                </motion.div>
              )}

            </div>

          </div>

          {/* Composer */}

          <form
            className="assistant__composer"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              className="assistant__composer-input"
              placeholder="Digite uma mensagem..."
              aria-label="Mensagem"
              value={inputValue}
              onChange={(event) =>
                setInputValue(event.target.value)
              }
            />

            <button
              type="submit"
              className="assistant__composer-button"
              aria-label="Enviar mensagem"
              disabled={
                !inputValue.trim() || isTyping
              }
            >
              <SendHorizontal
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>

          </form>

        </section>

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

                <span className="assistant__widget-label">
                  Metas
                </span>

                <h2 className="assistant__widget-title">
                  {goal.name}
                </h2>

              </div>

              <strong className="assistant__widget-value">
                {goal.percentage}%
              </strong>

            </div>

            <div className="assistant__goal-progress">
              <span
                style={{
                  width: `${goal.percentage}%`,
                }}
              />
            </div>

            <div className="assistant__widget-footer">

              <span>
                R${" "}
                {goal.current.toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>

              <span>
                de R${" "}
                {goal.target.toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

            <p className="assistant__widget-caption">
              R${" "}
              {goal.remaining.toLocaleString(
                "pt-BR",
                {
                  minimumFractionDigits: 2,
                }
              )}{" "}
              restantes
            </p>

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
                {financialHealth.score}
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