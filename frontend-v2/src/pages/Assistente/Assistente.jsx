import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, SendHorizontal } from "lucide-react";

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

  const logo = isDark ? logoHorizontalBranca : logoHorizontalPreta;

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
              isMenuOpen ? "assistant__navigation--open" : ""
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

            {/* Mobile */}
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
              <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />

              <span>Sair</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="assistant__navbar-actions">
            {/* Theme */}
            <ThemeSwitch />

            {/* User */}
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

              <span className="assistant__user-name">{user.name}</span>

              <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>

            {/* Mobile menu */}
            <button
              type="button"
              className="assistant__menu-toggle"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? (
                <X size={21} strokeWidth={1.8} />
              ) : (
                <Menu size={21} strokeWidth={1.8} />
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
          Quais as novidades de hoje, {user.name}?
        </h1>

        <p className="assistant__description">
          Fale do seu jeito. O Junta.ai acompanha a conversa.
        </p>
      </section>

      {/* ==================================================================
          Financial Summary
          ================================================================== */}

      <section className="assistant__summary" aria-label="Resumo financeiro">
        <article className="assistant__summary-card assistant__summary-card--income">
          <span className="assistant__summary-label">Receitas</span>

          <strong className="assistant__summary-value">R$ 4.250,00</strong>
        </article>

        <article className="assistant__summary-card assistant__summary-card--expense">
          <span className="assistant__summary-label">Despesas</span>

          <strong className="assistant__summary-value">R$ 1.890,50</strong>
        </article>

        <article className="assistant__summary-card">
          <span className="assistant__summary-label">Saldo</span>

          <strong className={`assistant__summary-value ${balanceClass}`}>
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
            {/* TODO(CREWAI):
                As mensagens serão alimentadas pelo agente. */}

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

              <h2>Por onde começamos?</h2>

              <p>
                Conte o que está acontecendo com seu dinheiro. Eu acompanho a
                conversa.
              </p>

              <div className="assistant__suggestions">
                <button type="button">Registrar um gasto</button>

                <button type="button">Ver meus gastos</button>

                <button type="button">Criar uma meta</button>
              </div>
            </div>
          </div>

          {/* TODO(CREWAI):
              Conectar o envio da mensagem ao backend/agente. */}

          <form className="assistant__composer">
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
              <SendHorizontal size={18} strokeWidth={2} aria-hidden="true" />
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
          {/* Metas */}
          <section className="assistant__widget">
            <span className="assistant__widget-label">Metas</span>

            <h2 className="assistant__widget-title">Seus objetivos</h2>

            {/* TODO(DATA): Substituir pelo widget real */}
            <div className="assistant__widget-placeholder">Widget de metas</div>
          </section>

          {/* Saúde Financeira */}
          <section className="assistant__widget">
            <span className="assistant__widget-label">Saúde financeira</span>

            <h2 className="assistant__widget-title">Como você está indo</h2>

            {/* TODO(DATA): Substituir pelo widget real */}
            <div className="assistant__widget-placeholder">
              Widget de saúde financeira
            </div>
          </section>

          {/* Mini Dashboard */}
          <section className="assistant__widget assistant__widget--dashboard">
            <span className="assistant__widget-label">Visão do mês</span>

            <h2 className="assistant__widget-title">Seus números</h2>

            {/* TODO(DATA):
                Gerado a partir das transações alimentadas no chat. */}
            <div className="assistant__widget-placeholder">Mini dashboard</div>

            <div className="assistant__expenses-placeholder">
              Últimas despesas
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
