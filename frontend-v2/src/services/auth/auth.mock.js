const VALID_TOKEN = "123456";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email.trim());
}

export function authenticateWithMock({ email, token }) {
  const normalizedEmail = email.trim();

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return {
      success: false,
      message: "Digite um e-mail válido para continuar.",
    };
  }

  if (token !== VALID_TOKEN) {
    return {
      success: false,
      message: "A chave de acesso está incorreta. Confira o código recebido.",
    };
  }

  return {
    success: true,
    message: "Acesso liberado. Seja bem-vindo à Junta.ai.",
  };
}
