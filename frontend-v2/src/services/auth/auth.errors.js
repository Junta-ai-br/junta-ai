// Use the confirmed HTTP contract; never expose arbitrary server error messages.
export function getEmailAuthError(error, { registration = false, verifying = false } = {}) {
  const status = error?.response?.status;
  if (status === 401 && verifying) {
    return { message: "Código inválido ou expirado. Solicite um novo." };
  }
  if (status === 404 && verifying && !registration) {
    return { message: "Nenhuma conta encontrada para este e-mail. Crie uma conta para continuar.", accountMissing: true };
  }
  if (status === 409 && registration) {
    return { message: "Este e-mail já está cadastrado. Entre pela página de login." };
  }
  if (status === 400) {
    return { message: registration
      ? "Confira os dados preenchidos e tente novamente."
      : verifying
        ? "Confira o e-mail e o código de 6 dígitos e tente novamente."
        : "Confira o endereço de e-mail e tente novamente." };
  }
  if (status === 503 && !verifying) {
    return { message: "O envio de e-mail está indisponível no momento. Tente novamente em instantes." };
  }
  if (!status && (error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT" || error?.request)) {
    return { message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente." };
  }
  if (status >= 500) {
    return { message: "O serviço está indisponível no momento. Tente novamente em instantes." };
  }
  if (status === 429) {
    return { message: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." };
  }
  return { message: verifying
    ? "Não foi possível confirmar o acesso agora. Tente novamente em instantes."
    : "Não foi possível enviar o código agora. Tente novamente em instantes." };
}
