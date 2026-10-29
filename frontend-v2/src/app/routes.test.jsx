import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { useLocation } from "react-router-dom";

import AppRoutes from "@/app/routes";
import { renderWithFinanceProvider } from "@/test-utils";
import { saveSession } from "@/services/auth/session";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const tokens = { accessToken: "test-access", refreshToken: "test-refresh", expiresInSeconds: 900 };
const privateRoutes = [
  "/assistente", "/planejador", "/planejador/historico", "/visao-mes",
  "/dashboard", "/relatorios", "/perfil", "/perfil/excluir-conta",
];
const publicRoutes = [
  ["/", /Organizar sua vida financeira/],
  ["/planos", /Teste do seu jeito/],
  ["/sobre", /11 pessoas/],
  ["/contato", /Conte no que podemos te ajudar/],
  ["/privacidade", /Política de Privacidade/],
  ["/termos", /Termos de Uso/],
  ["/feedback", /Tem algo para contar/],
  ["/login", /Vamos continuar de onde paramos/],
  ["/cadastro", /Vamos começar/],
];

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("route protection", () => {
  it.each([
    ["/contato", /Conte no que podemos te ajudar/, null],
    ["/privacidade", /Política de Privacidade/, "seguranca@junta-ai.com"],
    ["/termos", /Termos de Uso/, "contato@junta-ai.com"],
  ])("uses the institutional contact for %s and the general footer", async (route, heading, email) => {
    renderWithFinanceProvider(<AppRoutes />, { route });
    const page = (await screen.findByRole("heading", { name: heading })).closest("main");
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "E-mail" }))
      .toHaveAttribute("href", "mailto:contato@junta-ai.com");
    if (email) expect(page).toHaveTextContent(email);
    if (route === "/privacidade") {
      expect(page.textContent.match(/seguranca@junta-ai\.com/g)).toHaveLength(2);
    }
  });

  it("shows one registration introduction with all initial fields", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/cadastro" });
    await screen.findByRole("heading", { level: 1, name: "Vamos começar?" });
    expect(screen.getAllByText("Vamos começar?", { exact: true })).toHaveLength(1);
    expect(screen.getByText("BEM-VINDO(A) AO JUNTA.AI")).toBeInTheDocument();
    expect(screen.getByText("Crie sua conta e comece a organizar suas finanças do seu jeito.")).toBeInTheDocument();
    expect(screen.queryByText("Crie sua conta e conheça o Junta.ai.")).not.toBeInTheDocument();
    for (const label of [/^Nome/, /^E-mail/, /^WhatsApp/]) expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it("uses authenticated navigation in settings and logs out through the existing session", async () => {
    saveSession(tokens);
    renderWithFinanceProvider(<><Location /><AppRoutes /></>, { route: "/perfil" });
    await screen.findByRole("heading", { level: 1, name: "Configurações" });
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.queryByText("Login", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Começar agora", { exact: true })).not.toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Navegação principal" });
    for (const [name, path] of [["Assistente", "/assistente"], ["Dashboard", "/dashboard"], ["Planejador", "/planejador"], ["Relatórios", "/relatorios"]]) {
      expect(within(navigation).getByRole("link", { name })).toHaveAttribute("href", path);
    }
    // The mobile toggle is hidden by the desktop CSS in jsdom.
    const mobileToggle = navigation.closest("header").querySelector('button[aria-label="Abrir menu"]');
    fireEvent.click(mobileToggle);
    expect(mobileToggle).toHaveAttribute("aria-label", "Fechar menu");
    expect(mobileToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: /Menu de/ }));
    expect(screen.getByRole("menuitem", { name: "Perfil" })).toHaveAttribute("href", "/perfil");
    fireEvent.click(screen.getByRole("menuitem", { name: "Sair" }));
    await screen.findByRole("heading", { name: /Vamos continuar de onde paramos/ });
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/login$/);
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it.each(privateRoutes)("redirects unauthenticated access to %s to /login", async (route) => {
    renderWithFinanceProvider(<><Location /><AppRoutes /></>, { route });
    expect(await screen.findByRole("heading", { name: /Vamos continuar de onde paramos/ })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/login$/);
  });

  it.each(publicRoutes)("keeps %s public", async (route, heading) => {
    if (route === "/") {
      // jsdom does not provide the viewport API used by Landing animations.
      vi.stubGlobal("IntersectionObserver", class {
        observe() {}
        unobserve() {}
        disconnect() {}
      });
    }
    renderWithFinanceProvider(<><Location /><AppRoutes /></>, { route });
    expect((await screen.findAllByRole("heading", { name: heading }, { timeout: 3000 })).length).toBeGreaterThan(0);
    expect(screen.getByTestId("location").textContent).toBe(route);
  });

  it.each(privateRoutes)("allows authenticated access to %s", async (route) => {
    saveSession(tokens);
    renderWithFinanceProvider(<><Location /><AppRoutes /></>, { route });
    expect((await screen.findAllByRole("heading")).length).toBeGreaterThan(0);
    expect(screen.getByTestId("location").textContent).toBe(route);
    expect(screen.queryByRole("heading", { name: /Vamos continuar de onde paramos/ })).not.toBeInTheDocument();
  });

  it.each(publicRoutes.slice(-2))("does not redirect authenticated users away from %s", async (route, heading) => {
    saveSession(tokens);
    renderWithFinanceProvider(<><Location /><AppRoutes /></>, { route });
    expect((await screen.findAllByRole("heading", { name: heading }, { timeout: 3000 })).length).toBeGreaterThan(0);
    expect(screen.getByTestId("location").textContent).toBe(route);
  });

  it("rejects an expired stored session even when a display profile exists", async () => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...tokens, expiresAt: Date.now() - 1 }));
    localStorage.setItem("junta_user_profile", JSON.stringify({ email: "ana@example.test" }));
    renderWithFinanceProvider(<><Location /><AppRoutes /></>, { route: "/assistente" });
    expect(await screen.findByRole("heading", { name: /Vamos continuar de onde paramos/ })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/login$/);
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });
});

describe("lazy finance routes", () => {
  beforeEach(() => {
    saveSession(tokens);
  });

  it("integrates Planner history with the shared navigation", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/planejador/historico" });
    expect(await screen.findByRole("heading", { name: "Histórico de simulações" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejador" })).toHaveAttribute("href", "/planejador");
    expect(screen.getByRole("link", { name: "Nova simulação" })).toHaveAttribute("href", "/planejador");
  });
  it("integrates the Planner route with the shared navigation", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/planejador" });

    expect(await screen.findByRole("heading", { name: "Planeje uma meta do seu jeito." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejador" })).toHaveAttribute("href", "/planejador");
  });
  it("loads the monthly finance view asynchronously", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/visao-mes" });

    expect(await screen.findByRole("heading", { name: "Visão do mês" })).toBeInTheDocument();
  });

  it("loads the reports page asynchronously", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/relatorios" });

    expect(await screen.findByRole("heading", { name: "Relatórios financeiros" })).toBeInTheDocument();
  });
});
