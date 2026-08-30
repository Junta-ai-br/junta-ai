import { Link } from "react-router-dom";

import Logo from "@/components/branding/logo";
import ThemeSwitch from "@/components/navigation/ThemeSwitch";
import LoginForm from "@/components/Login/LoginForm";

import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";

import "./Login.css";
import "@/components/Login/LoginForm.css";

export default function Login() {
  const { theme } = useTheme();

  return (
    <main className="login-page">
      <header className="login-page__header">
        <Link
          to="/"
          className="login-page__logo"
          aria-label="Voltar para a página inicial"
        >
          <Logo
            variant="horizontal"
            wordmark={theme === THEMES.DARK ? "branca" : "preta"}
            width={168}
          />
        </Link>

        <div className="login-page__actions">
          <span className="login-page__signup-text">
            Novo(a) por aqui?
          </span>

          <Link
            to="/cadastro"
            className="button button--primary login-page__signup-button"
          >
            Criar conta
          </Link>

          <div className="login-page__theme">
            <ThemeSwitch />
          </div>

          <Link
            to="/"
            className="login-page__back"
            aria-label="Voltar para a página inicial"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section
        className="login-page__content"
        aria-label="Acesso à conta"
      >
        <div className="login-page__card">
          <LoginForm />

          <p className="login-page__privacy">
            Ao continuar, você concorda com nossos{" "}
            <Link to="/termos">termos de uso</Link>{" "}
            e{" "}
            <Link to="/privacidade">
              política de privacidade
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}