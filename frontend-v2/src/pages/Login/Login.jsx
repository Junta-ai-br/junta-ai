import Logo from "@/components/branding/logo";
import LoginForm from "@/components/Login/LoginForm";

import "./Login.css";
import "@/components/Login/LoginForm.css";

export default function Login() {
  return (
    <main className="login-page">
      <aside className="login-page__brand-panel" aria-label="Sobre a Junta.ai">
        <Logo variant="horizontal" wordmark="branca" width={164} />
        <p className="login-page__eyebrow">JUNTA.AI · FINANÇAS</p>
        <h1>Seu dinheiro,<br /><em>em movimento.</em></h1>
        <p className="login-page__brand-description">
          Um espaço claro para organizar o que importa e avançar com intenção.
        </p>
        <div className="login-page__brand-line" aria-hidden="true" />
        <p className="login-page__brand-footer">
          Clareza para as decisões que movem a sua vida.
        </p>
      </aside>

      <section className="login-page__panel" aria-labelledby="login-title">
        <div className="login-page__card">
          <div className="login-page__mobile-brand" aria-hidden="true">
            <Logo variant="horizontal" wordmark="preta" width={136} />
          </div>
          <LoginForm />
          <p className="login-page__privacy">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
      </section>
    </main>
  );
}
