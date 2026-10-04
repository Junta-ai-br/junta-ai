import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const google = vi.hoisted(() => ({ credential: undefined, login: vi.fn(), legacySuccess: null }));
const loginWithGoogle = vi.hoisted(() => vi.fn());

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
vi.mock("@/services/auth/auth.api", () => ({ loginWithGoogle }));

async function renderLogin(clientId = "", apiUrl = "") {
  vi.stubEnv("VITE_GOOGLE_CLIENT_ID", clientId);
  vi.stubEnv("VITE_API_URL", apiUrl);
  vi.resetModules();
  const { default: AppProviders } = await import("@/app/providers");
  const { default: LoginForm } = await import("./LoginForm");
  render(<AppProviders><LoginForm /></AppProviders>);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetAllMocks();
  google.credential = undefined;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Google login and compatibility", () => {
  it("keeps the app and email mock usable without a Client ID", async () => {
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
    expect(await screen.findByText("Tudo pronto.")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("junta_user_profile")).email).toBe("ana@example.com");
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
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
    expect(fetchProfile).toHaveBeenCalledWith("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer legacy-access" },
    });
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "ana@example.com", nome: "Ana" });
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it("rejects responses without credential without contacting the backend", async () => {
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir");
    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it("exchanges the ID token and persists application tokens and display profile", async () => {
    google.credential = `eyJhbGciOiJSUzI1NiJ9.${btoa(JSON.stringify({ email: "ana@example.com", name: "Ana", picture: "https://example.test/avatar" }))}.signature`;
    const tokens = { accessToken: "app-access", refreshToken: "app-refresh", expiresInSeconds: 900 };
    loginWithGoogle.mockResolvedValue(tokens);
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    expect(await screen.findByText("Tudo pronto.")).toBeInTheDocument();
    expect(loginWithGoogle).toHaveBeenCalledWith(google.credential);
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
  });

  it("handles Google errors without blocking the email form", async () => {
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Erro Google"));
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível entrar");
    expect(screen.getByRole("button", { name: "Receber código" })).toBeEnabled();
  });

  it("keeps backend-confirmed authentication when display token decoding fails", async () => {
    google.credential = "not-a-decodable-jwt";
    const tokens = { accessToken: "new-access", refreshToken: "new-refresh", expiresInSeconds: 900 };
    loginWithGoogle.mockResolvedValue(tokens);
    localStorage.setItem("junta_user_profile", JSON.stringify({ email: "old@example.com", nome: "Old", avatarUrl: "old-avatar" }));
    await renderLogin("configured-client", "https://api.example.test");
    fireEvent.click(screen.getByText("Google oficial"));
    expect(await screen.findByText("Tudo pronto.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(loginWithGoogle).toHaveBeenCalledWith(google.credential);
    expect(JSON.parse(sessionStorage.getItem("junta_auth_session"))).toMatchObject(tokens);
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "", nome: "", avatarUrl: "" });
  });
});
