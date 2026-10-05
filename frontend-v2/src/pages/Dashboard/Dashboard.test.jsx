import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppRoutes from "@/app/routes";
import { renderWithFinanceProvider } from "@/test-utils";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

describe("Dashboard", () => {
  it("renders financial KPIs with the lightweight chat, without full assistant widgets", async () => {
    localStorage.clear();
    renderWithFinanceProvider(<AppRoutes />, {
      route: "/dashboard",
      initialFinanceData: {
        transactions: [
          { id: "income", date: "2026-08-01", category: "Renda", desc: "Salário", amount: 1000 },
          { id: "expense", date: "2026-08-02", category: "Moradia", desc: "Aluguel", amount: -100 },
        ],
      },
    });

    expect(await screen.findByRole("heading", { name: "Converse com o Assistente" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Mensagem" })).toBeInTheDocument();
    expect(screen.getByText("Vamos conversar sobre seu dinheiro?")).toBeInTheDocument();
    expect(within(screen.getByText("Receitas").closest("article")).getByText("R$ 1.000,00")).toBeInTheDocument();
    expect(within(screen.getByText("Despesas").closest("article")).getByText("R$ 100,00")).toBeInTheDocument();
    expect(within(screen.getByText("Saldo").closest("article")).getByText("R$ 900,00")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Saúde financeira" })).not.toBeInTheDocument();
  });

  it("shows a simulated reply and updates the dashboard balance after a chat expense", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithFinanceProvider(<AppRoutes />, {
      route: "/dashboard",
      initialFinanceData: {
        transactions: [
          { id: "income", date: "2026-08-01", category: "Renda", desc: "Salário", amount: 1000 },
          { id: "expense", date: "2026-08-02", category: "Moradia", desc: "Aluguel", amount: -100 },
        ],
      },
    });

    const input = await screen.findByRole("textbox", { name: "Mensagem" });
    await user.type(input, "Oi, quero organizar meu orçamento");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Oi, quero organizar meu orçamento")).toBeInTheDocument();
    expect(await screen.findByText(/Vou considerar essa informação no seu planejamento financeiro/)).toBeInTheDocument();

    await user.type(input, "gastei 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText("Qual categoria devo usar para essa saída?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Lazer/ }));

    expect(await screen.findByText("Saída registrada em Lazer. Seus gráficos já foram atualizados.")).toBeInTheDocument();
    expect(within(screen.getByText("Saldo").closest("article")).getByText("R$ 875,00")).toBeInTheDocument();

  });
});
