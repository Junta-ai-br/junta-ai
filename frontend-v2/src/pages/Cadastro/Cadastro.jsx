import { Link } from "react-router-dom";

import Logo from "@/components/branding/logo";
import ThemeSwitch from "@/components/navigation/ThemeSwitch";

import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";

import "./Cadastro.css";

// 1. Importe o componente de formulário que criamos no passo anterior
import CadastroForm from "@/components/Cadastro/Cadastro";

export default function Cadastro() {
  const { theme } = useTheme();

  return (
    <main className="cadastro-page">
      <header className="cadastro-page__header">
        <Link
          to="/"
          className="cadastro-page__logo"
          aria-label="Voltar para a página inicial"
        >
          <Logo
            variant="horizontal"
            wordmark={theme === THEMES.DARK ? "branca" : "preta"}
            width={168}
          />
        </Link>

        <div className="cadastro-page__actions">
          <span className="cadastro-page__login-text">
            Já tem uma conta?
          </span>

          <Link
            to="/login"
            className="button button--primary cadastro-page__login-button"
          >
            Entrar
          </Link>

          <div className="cadastro-page__theme">
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <section
        className="cadastro-page__content"
        aria-label="Criação de conta"
      >
        <div className="cadastro-page__card">
          
          <div className="cadastro-page__heading">
            <p className="cadastro-page__eyebrow">
              BEM-VINDO(A) AO JUNTA.AI
            </p>

            <h1>Vamos começar?</h1>

            <p>
              Crie sua conta e comece a organizar suas finanças do seu jeito.
            </p>
          </div>

          {/* 2. Inserimos o componente com todos os inputs aqui */}
          <CadastroForm />

          <p className="cadastro-page__privacy">
            Ao criar sua conta, você concorda com nossos{" "}
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