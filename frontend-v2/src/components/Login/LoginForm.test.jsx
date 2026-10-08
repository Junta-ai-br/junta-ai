import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const google = vi.hoisted(() => ({ credential: undefined, login: vi.fn(), legacySuccess: null }));
const loginWithGoogle = vi.hoisted(() => vi.fn());
const requestAccessCode = vi.hoisted(() => vi.fn());
const verifyAccessCode = vi.hoisted(() => vi.fn());
const sessionCalls = vi.hoisted(() => ({ establish: vi.fn(), updateProfile: vi.fn(), end: vi.fn() }));
const navigation = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => {
  const router = await importOriginal();
  return {
    ...router,
    useNavigate: () => {
      const navigate = router.useNavigate();
      return (...args) => {
        navigation(...args);
        return navigate(...args);
      };
    },
  };
});

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }) => <div data-testid="google-provider">{children}</div>,
  GoogleLogin: ({ onSuccess, onError }) => (
    <>
      <button onClick={() => onSuccess({ credential: google.credential })}>Google oficial</button>
      <button onClick={onError}>Erro Google</button>
    </>
  ),
  useGoogleLogin: ({ onSuccess }) => {
    google.legacySuccess = onSuccess;
    return google.login;
  },
}));
vi.mock("@/services/auth/auth.api", () => ({ loginWithGoogle, requestAccessCode, verifyAccessCode }));

async function renderLogin(clientId = "", apiUrl = "") {
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", clientId);
  vi.stubEnv("VITE_API_URL", apiUrl);
  vi.resetModules();
  const { UserContext } = await import("@/contexts/user-context");
  const { useContext } = await import("react");
  vi.doMock("@/contexts/useUser", () => ({
    useUser: () => {
      const user = useContext(UserContext);
      return {
        ...user,
        establishSession: (tokens) => { sessionCalls.establish(tokens); return user.establishSession(tokens); },
        updateProfile: (profile) => { sessionCalls.updateProfile(profile); return user.updateProfile(profile); },
        endSession: () => { sessionCalls.end(); return user.endSession(); },
      };
    },
  }));
  const { default: AppProviders } = await import("@/app/providers");
  const { default: LoginForm } = await import("./LoginForm");
  const { MemoryRouter, Routes, Route, useLocation } = await import("react-router-dom");
  const { useUser } = await import("@/contexts/useUser");

  function Destination() {
    const { isAuthenticated, profile } = useUser();
    return (
      <div>
        <p>Assistente de teste</p>
        <p>{isAuthenticated ? "Sessão confirmada" : "Sem sessão"}</p>
        <p>{profile.email}</p>
      </div>
    );
  }

  function Location() {
    return <output data-testid="location">{useLocation().pathname}</output>;
  }

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AppProviders>
        <Location />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/assistente" element={<Destination />} />
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetAllMocks();
  google.credential = undefined;
  requestAccessCode.mockResolvedValue(undefined);
  verifyAccessCode.mockResolvedValue({ accessToken: "otp-access", refreshToken: "otp-refresh", expiresInSeconds: 900 });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function requestCode(email = "ana@example.com") {
  fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
  return screen.findByRole("textbox", { name: "Chave de acesso" });
}

async function finishCooldown() {
  // Enable fake timers before requesting the code so its interval is controlled.
  for (let second = 0; second < 30; second += 1) {
    await act(async () => { vi.advanceTimersByTime(1000); });
  }
}

describe("real email OTP", () => {
  it("rejects invalid email without calling the API", async () => {
    await renderLogin("", "https://api.example.test");
    fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
    expect(screen.getByRole("alert")).toHaveTextContent("e-mail válido");
    expect(requestAccessCode).not.toHaveBeenCalled();
  });

  it("waits for backend confirmation before advancing and normalizes email", async () => {
    let confirm;
    requestAccessCode.mockReturnValue(new Promise((resolve) => { confirm = resolve; }));
    await renderLogin("", "https://api.example.test");
    fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: " ana@example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
    expect(requestAccessCode).toHaveBeenCalledExactlyOnceWith("ana@example.com");
    expect(screen.getByRole("button", { name: "Enviando código..." })).toBeDisabled();
    expect(screen.queryByRole("textbox", { name: "Chave de acesso" })).not.toBeInTheDocument();
    expect(screen.queryByText("Enviamos uma chave de acesso para o seu e-mail.")).not.toBeInTheDocument();
    await act(async () => { confirm(); });
    expect(screen.getByRole("textbox", { name: "Chave de acesso" })).toBeInTheDocument();
    expect(screen.getByText("Enviamos uma chave de acesso para o seu e-mail.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar em 30s" })).toBeDisabled();
  });

  it("keeps the email step on request failure without exposing backend details", async () => {
    requestAccessCode.mockRejectedValue(new Error("Internal SMTP credentials"));
    await renderLogin("", "https://api.example.test");
    fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o código agora. Tente novamente em instantes.");
    expect(screen.queryByText(/Internal SMTP/)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Chave de acesso" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Receber código" })).toBeEnabled();
  });

  it("blocks resend during cooldown and starts a new cooldown only after success", async () => {
    await renderLogin("", "https://api.example.test");
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: "ana@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Reenviar em 30s" }));
    expect(requestAccessCode).toHaveBeenCalledTimes(1);
    await finishCooldown();
    let confirm;
    requestAccessCode.mockReturnValueOnce(new Promise((resolve) => { confirm = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: "Reenviar chave" }));
    expect(requestAccessCode).toHaveBeenLastCalledWith("ana@example.com");
    expect(requestAccessCode).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    await act(async () => { confirm(); });
    expect(screen.getByText("Uma nova chave de acesso foi enviada para o seu e-mail.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar em 30s" })).toBeDisabled();
  });

  it("does not restart cooldown or advance on resend failure", async () => {
    await renderLogin("", "https://api.example.test");
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: "ana@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
    });
    await finishCooldown();
    requestAccessCode.mockRejectedValueOnce(new Error("SMTP failure"));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reenviar chave" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível enviar o código agora.");
    expect(screen.getByRole("button", { name: "Reenviar chave" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Chave de acesso" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
  });

  it("rejects short codes without verification", async () => {
    await renderLogin("", "https://api.example.test");
    const input = await requestCode();
    fireEvent.change(input, { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chave" }));
    expect(screen.getByRole("alert")).toHaveTextContent("código de 6 dígitos");
    expect(verifyAccessCode).not.toHaveBeenCalled();
  });

  it("establishes the backend session and profile before navigating directly to the assistant", async () => {
    let confirm;
    const tokens = { accessToken: "otp-access", refreshToken: "otp-refresh", expiresInSeconds: 900 };
    verifyAccessCode.mockReturnValue(new Promise((resolve) => { confirm = resolve; }));
    navigation.mockImplementation(() => {
      expect(sessionCalls.establish).toHaveBeenCalledExactlyOnceWith(tokens);
      expect(sessionCalls.updateProfile).toHaveBeenCalledExactlyOnceWith({ email: "ana@example.com" });
      expect(JSON.parse(sessionStorage.getItem("junta_auth_session"))).toMatchObject(tokens);
    });
    await renderLogin("", "https://api.example.test");
    const input = await requestCode();
    fireEvent.change(input, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chave" }));
    expect(verifyAccessCode).toHaveBeenCalledExactlyOnceWith("ana@example.com", "654321");
    expect(screen.getByRole("button", { name: "Verificando..." })).toBeDisabled();
    expect(sessionCalls.establish).not.toHaveBeenCalled();
    expect(navigation).not.toHaveBeenCalled();
    await act(async () => { confirm(tokens); });
    expect(screen.getByText("Sessão confirmada")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "ana@example.com" });
    expect(navigation).toHaveBeenCalledExactlyOnceWith("/assistente");
    expect(sessionCalls.end).not.toHaveBeenCalled();
    expect(screen.queryByText("Tudo pronto.")).not.toBeInTheDocument();
  });

  it("does not establish a session, update the profile or navigate on verification failure", async () => {
    verifyAccessCode.mockRejectedValue(new Error("Internal database failure"));
    await renderLogin("", "https://api.example.test");
    const input = await requestCode();
    fireEvent.change(input, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chave" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Código inválido ou expirado. Solicite um novo.");
    expect(sessionCalls.establish).not.toHaveBeenCalled();
    expect(sessionCalls.updateProfile).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(navigation).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.getByRole("button", { name: "Confirmar chave" })).toBeEnabled();
    expect(screen.queryByText(/Internal database/)).not.toBeInTheDocument();
  });

  it("rejects a malformed backend session without navigating", async () => {
    verifyAccessCode.mockResolvedValue({ accessToken: "incomplete" });
    await renderLogin("", "https://api.example.test");
    const input = await requestCode();
    fireEvent.change(input, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chave" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Código inválido ou expirado");
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(sessionCalls.updateProfile).not.toHaveBeenCalled();
    expect(navigation).not.toHaveBeenCalled();
  });
});

describe("Google login and compatibility", () => {
  it("keeps real email OTP usable without a Google Client ID", async () => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ accessToken: "access-A", refreshToken: "refresh-A", expiresInSeconds: 900, expiresAt: Date.now() + 900000 }));
    localStorage.setItem("junta_user_profile", JSON.stringify({ email: "user-a@example.com" }));
    await renderLogin("", "https://api.example.test");
    expect(screen.queryByTestId("google-provider")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));
    expect(screen.getByRole("alert")).toHaveTextContent("ainda não está disponível");
    fireEvent.change(screen.getByRole("textbox", { name: "Seu e-mail" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Receber código" }));
    fireEvent.change(await screen.findByRole("textbox", { name: "Chave de acesso" }), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar chave" }));
    expect(await screen.findByText("Assistente de teste")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/assistente");
    expect(navigation).toHaveBeenCalledExactlyOnceWith("/assistente");
    expect(JSON.parse(localStorage.getItem("junta_user_profile")).email).toBe("ana@example.com");
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem("junta_auth_session"))).toMatchObject({ accessToken: "otp-access", refreshToken: "otp-refresh" });
  });

  it("preserves the existing Google flow when API URL is absent", async () => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ accessToken: "access-A", refreshToken: "refresh-A", expiresInSeconds: 900, expiresAt: Date.now() + 900000 }));
    localStorage.setItem("junta_user_profile", JSON.stringify({ email: "user-a@example.com" }));
    const fetchProfile = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ email: "ana@example.com", name: "Ana" }),
    });
    vi.stubGlobal("fetch", fetchProfile);
    google.login.mockImplementation(() => google.legacySuccess({ access_token: "legacy-access" }));
    await renderLogin("configured-client");
    fireEvent.click(screen.getByRole("button", { name: "Continuar com Google" }));
    expect(google.login).toHaveBeenCalledOnce();
    expect(screen.queryByText("Google oficial")).not.toBeInTheDocument();
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(await screen.findByText("Tudo pronto.")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(navigation).not.toHaveBeenCalled();
    expect(fetchProfile).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer legacy-access" },
    });
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "ana@example.com", nome: "Ana" });
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it.each([undefined, "", "   "])("rejects credential %j without contacting the backend or navigating", async (credential) => {
    google.credential = credential;
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir");
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(navigation).not.toHaveBeenCalled();
  });

  it("navigates to /assistente only after the backend confirms and the session and profile are established", async () => {
    google.credential = `eyJhbGciOiJSUzI1NiJ9.${btoa(JSON.stringify({ email: "ana@example.com", name: "Ana", picture: "https://example.test/avatar" }))}.signature`;
    const tokens = { accessToken: "app-access", refreshToken: "app-refresh", expiresInSeconds: 900 };
    navigation.mockImplementation(() => {
      expect(loginWithGoogle).toHaveBeenCalledWith(google.credential);
      expect(JSON.parse(sessionStorage.getItem("junta_auth_session"))).toMatchObject(tokens);
    });
    let confirmLogin;
    loginWithGoogle.mockReturnValue(new Promise((resolve) => { confirmLogin = resolve; }));
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    expect(loginWithGoogle).toHaveBeenCalledWith(google.credential);
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(navigation).not.toHaveBeenCalled();
    expect(screen.getByText("Entrando com Google...")).toBeInTheDocument();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(localStorage.getItem("junta_user_profile")).toBeNull();

    confirmLogin(tokens);
    expect(await screen.findByText("Assistente de teste")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/assistente");
    expect(navigation).toHaveBeenCalledExactlyOnceWith("/assistente");
    expect(screen.getByText("Sessão confirmada")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem("junta_auth_session"))).toEqual({ ...tokens, expiresAt: expect.any(Number) });
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "ana@example.com", nome: "Ana" });
  });

  it("handles API errors and keeps email login available", async () => {
    google.credential = "id-token";
    loginWithGoogle.mockRejectedValue(new Error("Unauthorized"));
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível concluir"));
    expect(screen.getByRole("button", { name: "Receber código" })).toBeEnabled();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(localStorage.getItem("junta_user_profile")).toBeNull();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(navigation).not.toHaveBeenCalled();
  });

  it("handles Google errors without blocking the email form", async () => {
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Erro Google"));
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível entrar");
    expect(screen.getByRole("button", { name: "Receber código" })).toBeEnabled();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(navigation).not.toHaveBeenCalled();
  });

  it("keeps backend-confirmed authentication when display token decoding fails", async () => {
    google.credential = "not-a-decodable-jwt";
    const tokens = { accessToken: "new-access", refreshToken: "new-refresh", expiresInSeconds: 900 };
    loginWithGoogle.mockResolvedValue(tokens);
    localStorage.setItem("junta_user_profile", JSON.stringify({ email: "old@example.com", nome: "Old", avatarUrl: "old-avatar" }));
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    expect(await screen.findByText("Assistente de teste")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/assistente");
    expect(navigation).toHaveBeenCalledExactlyOnceWith("/assistente");
    expect(screen.getByText("Sessão confirmada")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(loginWithGoogle).toHaveBeenCalledWith(google.credential);
    expect(JSON.parse(sessionStorage.getItem("junta_auth_session"))).toMatchObject(tokens);
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "", nome: "", avatarUrl: "" });
  });
});
