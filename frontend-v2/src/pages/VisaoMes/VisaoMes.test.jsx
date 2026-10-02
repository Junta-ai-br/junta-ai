import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppRoutes from "@/app/routes";
import { getCurrentMonthRange } from "@/services/finance/store";
import { renderWithFinanceProvider } from "@/test-utils";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

describe("VisaoMes", () => {
  it("filters the current month and includes prior transactions after selecting all time", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const currentRange = getCurrentMonthRange();
    const currentStart = new Date(`${currentRange.start}T00:00:00Z`);
    const previousRange = getCurrentMonthRange(new Date(Date.UTC(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth() - 1,
      1,
    )));
    const transactions = [
      { id: "income", date: currentRange.start, category: "Renda", desc: "Salário atual", amount: 1000 },
      { id: "current", date: currentRange.start, category: "Lazer", desc: "Compra atual", amount: -10 },
      { id: "previous", date: previousRange.start, category: "Moradia", desc: "Compra anterior", amount: -20 },
    ];

    renderWithFinanceProvider(<AppRoutes />, {
      route: "/visao-mes",
      initialFinanceData: { dateRange: currentRange, transactions },
    });

    await screen.findByRole("heading", { name: "Visão do mês" });
    expect(screen.getByText(`${currentRange.start.split("-").reverse().join("/")} até ${currentRange.end.split("-").reverse().join("/")} · 2 transações`)).toBeInTheDocument();
    expectKpi("Receitas", "R$ 1.000,00");
    expectKpi("Despesas", "R$ 10,00");
    expectKpi("Saldo", "R$ 990,00");
    await user.click(screen.getByRole("button", { name: "Transações" }));
    expect(screen.getByRole("heading", { name: "Transações no período (2)" })).toBeInTheDocument();
    expect(screen.getByText("Compra atual")).toBeInTheDocument();
    expect(screen.getByText("Salário atual")).toBeInTheDocument();
    expect(screen.queryByText("Compra anterior")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Este mês/ }));
    await user.click(screen.getByRole("button", { name: "Todo período" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Todos os períodos · 3 transações")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transações no período (3)" })).toBeInTheDocument();
    expect(screen.getByText("Compra anterior")).toBeInTheDocument();
  });

  it("shows a friendly empty state when the selected month has no transactions", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const currentRange = getCurrentMonthRange();
    renderWithFinanceProvider(<AppRoutes />, {
      route: "/visao-mes",
      initialFinanceData: {
        dateRange: currentRange,
        transactions: [{ id: "old", date: "2020-01-01", category: "Lazer", desc: "Gasto antigo", amount: -20 }],
      },
    });

    await screen.findByRole("heading", { name: "Visão do mês" });
    expect(screen.getByRole("status")).toHaveTextContent("Nenhuma movimentação neste período");
    expectKpi("Receitas", "R$ 0,00");
    expectKpi("Despesas", "R$ 0,00");
    expectKpi("Saldo", "R$ 0,00");

    await user.click(screen.getByRole("button", { name: /Este mês/ }));
    await user.click(screen.getByRole("button", { name: "Todo período" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Todos os períodos · 1 transações")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma movimentação neste período")).not.toBeInTheDocument();
  });

  it("adds, edits and deletes transactions while recalculating the visible KPIs", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const currentRange = getCurrentMonthRange();
    renderWithFinanceProvider(<AppRoutes />, {
      route: "/visao-mes",
      initialFinanceData: {
        dateRange: currentRange,
        transactions: [
          { id: "salary", date: currentRange.start, category: "Renda", desc: "Salário", amount: 1000 },
          { id: "rent", date: currentRange.start, category: "Moradia", desc: "Aluguel", amount: -200 },
        ],
      },
    });

    await screen.findByRole("heading", { name: "Visão do mês" });
    expectKpi("Saldo", "R$ 800,00");
    await user.click(screen.getByRole("button", { name: /Lançamento/ }));
    await user.type(screen.getByRole("textbox", { name: "Descrição" }), "Cinema");
    await user.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "Lazer");
    await user.type(screen.getByRole("spinbutton", { name: "Valor" }), "50");
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expectKpi("Despesas", "R$ 250,00");
    expectKpi("Saldo", "R$ 750,00");

    await user.click(screen.getByRole("button", { name: /Lançamento/ }));
    await user.type(screen.getByRole("textbox", { name: "Descrição" }), "Freelance");
    await user.selectOptions(screen.getByRole("combobox", { name: "Tipo" }), "income");
    await user.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "Renda");
    await user.type(screen.getByRole("spinbutton", { name: "Valor" }), "75");
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expectKpi("Receitas", "R$ 1.075,00");
    expectKpi("Despesas", "R$ 250,00");
    expectKpi("Saldo", "R$ 825,00");

    await user.click(screen.getByRole("button", { name: "Transações" }));
    expect(await screen.findByRole("heading", { name: "Transações no período (4)" })).toBeInTheDocument();
    expect(screen.getByText("Cinema")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar Cinema" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Tipo" }), "income");
    await user.selectOptions(screen.getByRole("combobox", { name: "Categoria" }), "Renda");
    await user.clear(screen.getByRole("spinbutton", { name: "Valor" }));
    await user.type(screen.getByRole("spinbutton", { name: "Valor" }), "100");
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    expectKpi("Receitas", "R$ 1.175,00");
    expectKpi("Despesas", "R$ 200,00");
    expectKpi("Saldo", "R$ 975,00");

    await user.click(screen.getByRole("button", { name: "Transações" }));
    await user.click(screen.getByRole("button", { name: "Excluir Cinema" }));
    expect(await screen.findByRole("heading", { name: "Transações no período (3)" })).toBeInTheDocument();
    expectKpi("Receitas", "R$ 1.075,00");
    expectKpi("Despesas", "R$ 200,00");
    expectKpi("Saldo", "R$ 875,00");
  });

  it("creates a custom category and filters transactions by that category", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const currentRange = getCurrentMonthRange();
    renderWithFinanceProvider(<AppRoutes />, {
      route: "/visao-mes",
      initialFinanceData: {
        dateRange: currentRange,
        transactions: [
          { id: "trip", date: currentRange.start, category: "Viagem", desc: "Passagem", amount: -300 },
          { id: "food", date: currentRange.start, category: "Alimentação", desc: "Almoço", amount: -30 },
        ],
        categories: ["Renda", "Alimentação"],
      },
    });

    await screen.findByRole("heading", { name: "Visão do mês" });
    await user.click(screen.getByRole("button", { name: "Categorias" }));
    await user.click(screen.getByRole("button", { name: /Nova categoria/ }));
    await user.type(screen.getByPlaceholderText("Ex.: Educação"), "Viagem");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expectKpi("Categorias", "3");

    await user.click(screen.getByRole("button", { name: "Transações" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filtrar por categoria" }), "Viagem");
    expect(screen.getByRole("heading", { name: "Transações no período (1)" })).toBeInTheDocument();
    expect(screen.getByText("Passagem")).toBeInTheDocument();
    expect(screen.queryByText("Almoço")).not.toBeInTheDocument();
  });
});

function expectKpi(label, value) {
  const indicators = within(screen.getByRole("region", { name: "Indicadores financeiros" }));
  expect(within(indicators.getByText(label).closest("article")).getByText(value)).toBeInTheDocument();
}