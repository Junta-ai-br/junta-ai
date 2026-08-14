import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  SendHorizontal,
  TrendingUp,
  TrendingDown,
  WalletCards,
} from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/utils/theme";

import logoHorizontalBranca from "@/assets/logos/logo-horizontal-branca.svg";
import logoHorizontalPreta from "@/assets/logos/logo-horizontal-preta.svg";

import ThemeSwitch from "@/components/navigation/ThemeSwitch";

import "./Assistente.css";

export default function Assistente() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /* ------------------------------------------------------------------------
     Theme
     ------------------------------------------------------------------------ */

  const { theme } = useTheme();

  const isDark = theme === THEMES.DARK;

  const logo = isDark
    ? logoHorizontalBranca
    : logoHorizontalPreta;

  /* ------------------------------------------------------------------------
     User
     ------------------------------------------------------------------------ */

  /*
   * TODO(AUTH):
   * Substituir pelos dados do usuário autenticado.
   */

  const user = {
    name: "Marina",
    avatar: null,
  };

  /* ------------------------------------------------------------------------
     Financial Summary
     ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------
     Mock Financial Widgets
     ------------------------------------------------------------------------ */

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

  const monthlyOverview = {
    total: "R$ 1.890,50",

    /*
     * Saldo referente à visão do mês.
     *
     * TODO(DATA):
     * Esse valor deverá ser calculado a partir das receitas e
     * despesas do período vindas do backend.
     */
    balance: 1890.5,

    categories: [
      {
        name: "Moradia",
        percentage: 32,
        color: "#7140FA",
        emoji: "🏠",
      },
      {
        name: "Alimentação",
        percentage: 24,
        color: "#9B78FF",
        emoji: "🍔",
      },
      {
        name: "Lazer",
        percentage: 18,
        color: "#B9A2FF",
        emoji: "🎮",
      },
      {
        name: "Transporte",
        percentage: 14,
        color: "#38A3A5",
        emoji: "🚗",
      },
      {
        name: "Outros",
        percentage: 12,
        color: "#4B357F",
        emoji: "📦",
      },
    ],

    transactions: [
      {
        description: "Mercado",
        category: "Alimentação",
        emoji: "🛒",
        value: "R$ 120,00",
        type: "expense",
      },
      {
        description: "Uber",
        category: "Transporte",
        emoji: "🚗",
        value: "R$ 24,00",
        type: "expense",
      },
      {
        description: "Streaming",
        category: "Assinaturas",
        emoji: "📺",
        value: "R$ 39,90",
        type: "expense",
      },
      {
        description: "Salário",
        category: "Receita",
        emoji: "💰",
        value: "R$ 4.250,00",
        type: "income",
      },
    ],
  };

  /* ------------------------------------------------------------------------
     Monthly Balance
     ------------------------------------------------------------------------ */

  const monthlyBalanceClass =
    monthlyOverview.balance > 0
      ? "assistant__widget-month-value--positive"
      : monthlyOverview.balance < 0
        ? "assistant__widget-month-value--negative"
        : "assistant__widget-month-value--neutral";

  const monthlyBalanceFormatted =
    `${monthlyOverview.balance > 0 ? "+" : monthlyOverview.balance < 0 ? "-" : ""} ` +
    `R$ ${Math.abs(monthlyOverview.balance).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  /* ------------------------------------------------------------------------
     Donut
     ------------------------------------------------------------------------ */

  /*
   * Constrói o conic-gradient do donut a partir das categorias.
   */

  const donutGradient = (() => {
    let currentPosition = 0;

    const segments = monthlyOverview.categories.map(
      (category) => {
        const start = currentPosition;

        currentPosition += category.percentage;

        return `${category.color} ${start}% ${currentPosition}%`;
      }
    );

    return `conic-gradient(${segments.join(", ")})`;
  })();

  /* ------------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------------ */

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

          {/* Logo */}

          <Link
            to="/assistente"
            className="assistant__logo"
            aria-label="Junta.ai — Assistente"
            onClick={closeMenu}
          >
            <img src={logo} alt="Junta.ai" />
          </Link>

          {/* Navigation */}

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

            <button
              type="button"
              className="assistant__logout assistant__logout--mobile-only"
              onClick={() => {
                /*
                 * TODO(AUTH):
                 * Implementar logout real.
                 */

                closeMenu();
              }}
            >
              <LogOut
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>Sair</span>
            </button>
          </nav>

          {/* Actions */}

          <div className="assistant__navbar-actions">
            <ThemeSwitch />

            <button
              type="button"
              className="assistant__user"
              aria-label={`Menu de ${user.name}`}
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
                <X size={21} strokeWidth={1.8} />
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
          Page Intro
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

        {/* Receitas */}

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
            R$ 4.250,00
          </strong>
        </article>

        {/* Despesas */}

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
            R$ 1.890,50
          </strong>
        </article>

        {/* Saldo */}

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
            R$ 2.359,50
          </strong>
        </article>
      </section>

      {/* ==================================================================
          Main Workspace
          ================================================================== */}

      <section className="assistant__workspace">

        {/* ----------------------------------------------------------------
            Conversation
            ---------------------------------------------------------------- */}

        <section
          className="assistant__conversation"
          aria-label="Conversa com o Junta.ai"
        >
          <div className="assistant__conversation-content">

            <div className="assistant__conversation-placeholder">

              <span
                className="assistant__conversation-placeholder-icon"
                aria-hidden="true"
              >
                <img
                  src="/src/assets/logos/logo-icon.svg"
                  alt=""
                  className="assistant__conversation-placeholder-logo"
                />
              </span>

              <h2>
                Por onde começamos?
              </h2>

              <p>
                Conte o que está acontecendo com seu dinheiro.
                Eu acompanho a conversa.
              </p>

              <div className="assistant__suggestions">
                <button type="button">
                  Registrar um gasto
                </button>

                <button type="button">
                  Ver meus gastos
                </button>

                <button type="button">
                  Criar uma meta
                </button>
              </div>

            </div>
          </div>

          <form
            className="assistant__composer"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="text"
              className="assistant__composer-input"
              placeholder="Digite uma mensagem..."
              aria-label="Mensagem"
            />

            <button
              type="submit"
              className="assistant__composer-button"
              aria-label="Enviar mensagem"
            >
              <SendHorizontal
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </form>
        </section>

        {/* ----------------------------------------------------------------
            Sidebar
            ---------------------------------------------------------------- */}

        <aside
          className="assistant__sidebar"
          aria-label="Resumo da sua vida financeira"
        >

          {/* ==============================================================
              Metas
              ============================================================== */}

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
                {goal.current.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>

              <span>
                de R${" "}
                {goal.target.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <p className="assistant__widget-caption">
              R${" "}
              {goal.remaining.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}{" "}
              restantes
            </p>

          </section>

          {/* ==============================================================
              Saúde Financeira
              ============================================================== */}

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

          {/* ==============================================================
              Visão do Mês
              ============================================================== */}

          <section className="assistant__widget assistant__widget--dashboard">

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

          </section>
        </aside>
      </section>
    </main>
  );
}