import { useState } from "react";

import Button from "@/components/common/Button/Button";
import Input from "@/components/forms/Input/Input";
import { authenticateWithMock, isValidEmail } from "@/services/auth/auth.mock";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [emailError, setEmailError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [tokenRequested, setTokenRequested] = useState(false);

  function clearFeedback() {
    setFeedback(null);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setEmailError("");
    clearFeedback();
  }

  function handleTokenChange(event) {
    setToken(event.target.value);
    setTokenError("");
    clearFeedback();
  }

  function handleRequestToken() {
    if (!isValidEmail(email)) {
      setEmailError("Digite um e-mail válido para receber sua chave.");
      return;
    }

    setEmailError("");
    setTokenRequested(true);
    setFeedback({ type: "info", message: "Sua chave de acesso foi enviada por e-mail." });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setEmailError("");
    setTokenError("");
    clearFeedback();

    const result = authenticateWithMock({ email, token });

    if (!isValidEmail(email)) {
      setEmailError("Digite um e-mail válido para continuar.");
      return;
    }

    if (!token) {
      setTokenError("Digite a chave de acesso recebida por e-mail.");
      return;
    }

    if (!result.success) {
      setTokenError(result.message);
      return;
    }

    setFeedback({ type: "success", message: result.message });
  }

  function handleGoogleLogin() {
    setFeedback({
      type: "info",
      message: "O login com Google estará disponível em breve.",
    });
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-form__fields">
        <Input
          id="login-email"
          label="E-mail"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="voce@exemplo.com"
          autoComplete="email"
          error={emailError}
          required
        />

        <div className="login-form__token-field">
          <Input
            id="login-token"
            label="Chave de acesso"
            type="text"
            value={token}
            onChange={handleTokenChange}
            placeholder="Digite sua chave de 6 dígitos"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            error={tokenError}
            helperText={
              tokenRequested
                ? "Use a chave enviada para o seu e-mail."
                : "Enviaremos uma chave temporária para o seu e-mail."
            }
            required
          />
          <button
            type="button"
            className="login-form__request"
            onClick={handleRequestToken}
          >
            Solicitar chave de acesso
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="login-form__submit">
        Entrar
      </Button>

      <div className="login-form__divider" aria-hidden="true">
        <span>ou</span>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="login-form__google"
        onClick={handleGoogleLogin}
      >
        <span className="login-form__google-mark" aria-hidden="true">G</span>
        Continuar com Google
      </Button>

      {feedback && (
        <p className={`login-form__feedback login-form__feedback--${feedback.type}`} role="status">
          {feedback.message}
        </p>
      )}
    </form>
  );
}
