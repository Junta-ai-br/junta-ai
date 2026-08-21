import { Link } from "react-router-dom";

import Logo from "@/components/branding/logo";
import LoginForm from "@/components/Login/LoginForm";

import "./Login.css";
import "@/components/Login/LoginForm.css";

export default function Login() {
  return (
    <main className="login-page">
      <div className="login-page__panel">
        <Link to="/" className="login-page__brand" aria-label="Ir para a página inicial">
          <Logo variant="horizontal" wordmark="branca" width={164} />
        </Link>

        <div className="login-page__intro">
          <p className="login-page__eyebrow">Bem-vindo de volta</p>
          <h1>Entre na sua conta</h1>
          <p>Use seu e-mail e a chave de acesso para continuar.</p>
        </div>

        <LoginForm />

        <p className="login-page__privacy">
          Ao entrar, você concorda com nossos <Link to="/termos">Termos de uso</Link> e <Link to="/privacidade">Política de privacidade</Link>.
        </p>
      </div>

      <aside className="login-page__aside" aria-hidden="true">
        <span className="login-page__aside-mark">J</span>
        <p>Clareza para as decisões que movem a sua vida.</p>
      </aside>
    </main>
  );
}
