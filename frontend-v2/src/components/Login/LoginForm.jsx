import { useEffect, useState } from "react";

import Button from "@/components/common/Button/Button";
import Input from "@/components/forms/Input/Input";
import {
  authenticateWithMock,
  isValidEmail,
} from "@/services/auth/auth.mock";

const RESEND_COOLDOWN = 30;

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="login-form__google-icon"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.91-4.2 2.91-7.21Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.55 0-4.71-1.72-5.49-4.03H3.27v2.52A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.51 13.85A5.86 5.86 0 0 1 6.2 12c0-.64.11-1.26.31-1.85V7.63H3.27A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.02 4.37l3.24-2.52Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.12c1.43 0 2.71.49 3.73 1.46l2.8-2.8C16.84 3.19 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.73 5.38l3.24 2.52c.78-2.31 2.94-4.03 5.49-4.03Z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return undefined;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  function clearMessages() {
    setError("");
    setStatus("");
  }

  function handleEmailSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    clearMessages();

    if (!isValidEmail(normalizedEmail)) {
      setError("Informe um endereço de e-mail válido.");
      return;
    }

    setEmail(normalizedEmail);
    setLoadingAction("email");

    window.setTimeout(() => {
      setStatus("Enviamos uma chave de acesso para o seu e-mail.");
      setStep("code");
      setCooldown(RESEND_COOLDOWN);
      setLoadingAction(null);
    }, 250);
  }

  function handleCodeSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos recebido por e-mail.");
      return;
    }

    setLoadingAction("code");

    const result = authenticateWithMock({
      email,
      token: code,
    });

    window.setTimeout(() => {
      if (!result.success) {
        setError(result.message);
        setLoadingAction(null);
        return;
      }

      setStatus(result.message);
      setStep("success");
      setLoadingAction(null);
    }, 250);
  }

  function handleResend() {
    if (cooldown > 0 || loadingAction) return;

    clearMessages();
    setLoadingAction("resend");

    window.setTimeout(() => {
      setStatus("Uma nova chave de acesso foi enviada para o seu e-mail.");
      setCooldown(RESEND_COOLDOWN);
      setLoadingAction(null);
    }, 250);
  }

  function handleGoogleLogin() {
    clearMessages();
    setLoadingAction("google");

    window.setTimeout(() => {
      setStatus("O login com Google estará disponível em breve.");
      setLoadingAction(null);
    }, 250);
  }

  function handleEditEmail() {
    setStep("email");
    setCode("");
    clearMessages();
  }

  if (step === "success") {
    return (
      <div className="login-form__success" role="status">
        <div className="login-form__success-icon" aria-hidden="true">
          ✓
        </div>

        <p className="login-form__eyebrow">
          ACESSO CONFIRMADO
        </p>

        <h2 id="login-title">Tudo pronto.</h2>

        <p>
          {status || "Sua identidade foi confirmada com sucesso."}
        </p>

        <button
          type="button"
          className="login-form__text-button"
          onClick={handleEditEmail}
        >
          Entrar com outro e-mail
        </button>
      </div>
    );
  }

  if (step === "email") {
    return (
      <>
        <div className="login-form__heading">
          <p className="login-form__eyebrow">
            BEM-VINDO(A) DE VOLTA
          </p>

          <h2 id="login-title">
            Vamos continuar de onde paramos?
          </h2>

          <p>
            Converse, entenda e planeje suas finanças do seu jeito.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="login-form__google"
          onClick={handleGoogleLogin}
          disabled={loadingAction !== null}
          aria-busy={loadingAction === "google"}
        >
          <GoogleIcon />
          {loadingAction === "google"
            ? "Conectando..."
            : "Continuar com Google"}
        </Button>

        <div className="login-form__divider">
          <span>ou entre com seu e-mail</span>
        </div>

        <form
          className="login-form__fields login-form__fields--email"
          onSubmit={handleEmailSubmit}
          noValidate
        >
          <Input
            id="login-email"
            label="Seu e-mail"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearMessages();
            }}
            placeholder="voce@exemplo.com"
            autoComplete="email"
            error={error}
            disabled={loadingAction !== null}
            required
          />

          <Button
            type="submit"
            size="lg"
            className="login-form__submit"
            disabled={loadingAction !== null}
          >
            {loadingAction === "email"
              ? "Enviando código..."
              : "Receber código"}
          </Button>
        </form>

        <Message error={error} status={status} />
      </>
    );
  }

  return (
    <>
      <div className="login-form__heading">
        <p className="login-form__eyebrow">
          CHAVE DE ACESSO
        </p>

        <h2 id="login-title">
          Confirme seu acesso
        </h2>

        <p>
          Enviamos uma chave de 6 dígitos para {email}.
        </p>
      </div>

      <form
        className="login-form__fields"
        onSubmit={handleCodeSubmit}
        noValidate
      >
        <Input
          id="login-code"
          label="Chave de acesso"
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, ""));
            clearMessages();
          }}
          placeholder="000000"
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          error={error}
          disabled={loadingAction !== null}
          required
        />

        <Button
          type="submit"
          size="lg"
          className="login-form__submit"
          disabled={loadingAction !== null}
        >
          {loadingAction === "code"
            ? "Verificando..."
            : "Confirmar chave"}
        </Button>

        <div className="login-form__code-actions">
          <button
            type="button"
            className="login-form__text-button"
            onClick={handleEditEmail}
            disabled={loadingAction !== null}
          >
            Usar outro e-mail
          </button>

          <button
            type="button"
            className="login-form__text-button"
            onClick={handleResend}
            disabled={cooldown > 0 || loadingAction !== null}
          >
            {loadingAction === "resend"
              ? "Enviando..."
              : cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : "Reenviar chave"}
          </button>
        </div>
      </form>

      <Message error={error} status={status} />
    </>
  );
}

function Message({ error, status }) {
  return (
    <div
      className={`login-form__message ${
        error ? "is-error" : "is-success"
      }`}
      aria-live="polite"
      role={error ? "alert" : "status"}
    >
      {error || status}
    </div>
  );
}