import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
vi.hoisted(() => { vi.stubEnv("VITE_API_URL", "https://backend.example.test"); });
import AppRoutes from "@/app/routes";
import { renderWithFinanceProvider } from "@/test-utils";
import { api } from "@/services/api";
import { clearSession, saveSession } from "@/services/auth/session";
import { currentCivilMonth } from "@/services/finance/finance-provider-store";
vi.mock("recharts", async () => import("@/test/rechartsMock"));
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); clearSession(); saveSession({ accessToken: "A", refreshToken: "R", expiresInSeconds: 900 });
  const category = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", name: "Real", type: "BOTH", createdAt: "2026-10-18T12:00:00Z" };
  api.defaults.adapter = async (config) => ({ config, status: 200, headers: {}, data: config.url === "/categories" ? JSON.stringify([category])
    : config.url === "/dashboard" ? '{"saved":1234567890123456.78}'
    : JSON.stringify({ content: [{ id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: category.id, categoryName: category.name, type: "EXPENSE", description: "Real", transactionDate: currentCivilMonth().from, createdAt: category.createdAt, amount: "99999999999999999.99" }], number: 0, size: 100, totalElements: 1, totalPages: 1, numberOfElements: 1, first: true, last: true, empty: false }).replace('"amount":"99999999999999999.99"', '"amount":99999999999999999.99') });
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); });
describe("real Dashboard", () => {
  it("shows exact API balance, never reads financial seeds and does not simulate chat writes", async () => {
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
      if (this === localStorage && ["junta_transactions", "junta_categories"].includes(key)) throw new Error("Legacy financial read");
      return original.call(this, key);
    });
    renderWithFinanceProvider(<AppRoutes />, { route: "/Dashboard/" });
    await waitFor(() => expect(within(screen.getByText("Saldo").closest("article")).getByText("-R$ 99.999.999.999.999.999,99")).toBeInTheDocument());
    expect(await screen.findByRole("article", { name: "Guardado" })).toHaveTextContent("R$ 1.234.567.890.123.456,78");
    expect(screen.queryByRole("textbox", { name: "Mensagem" })).not.toBeInTheDocument();
    expect(screen.queryByText(/chat deste painel ainda não está conectado/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Assistente" })).toHaveAttribute("href", "/assistente");
  });
});
