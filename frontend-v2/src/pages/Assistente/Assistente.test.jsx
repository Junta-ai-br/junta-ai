import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppRoutes from "@/app/routes";
import { loadGoals, loadTransactions } from "@/services/finance/store";
import { renderWithFinanceProvider } from "@/test-utils";

describe("Assistente chat", () => {
  it("prevents empty messages and shows the typing state while replying", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });

    const input = await screen.findByRole("textbox", { name: "Mensagem" });
    const sendButton = screen.getByRole("button", { name: "Enviar mensagem" });
    expect(sendButton).toBeDisabled();

    await user.type(input, "   ");
    expect(sendButton).toBeDisabled();
    expect(screen.queryByLabelText("Junta.ai está digitando")).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Olá");
    await user.click(sendButton);

    expect(screen.getByLabelText("Junta.ai está digitando")).toBeInTheDocument();
    expect(await screen.findByText(/Vou considerar essa informação no seu planejamento financeiro/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Junta.ai está digitando")).not.toBeInTheDocument();
  });

  it("persists a categorized expense and emits the transaction change event", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const transactionsChanged = vi.fn();
    window.addEventListener("junta:transactions-changed", transactionsChanged);
    renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });

    expect(await screen.findByRole("heading", { name: /Como posso ajudar hoje/ })).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Mensagem" });
    await user.type(input, "gastei 0");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText(/Vou considerar essa informação no seu planejamento financeiro/)).toBeInTheDocument();
    expect(loadTransactions()).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ desc: "Saída via chat", amount: 0 }),
    ]));
    expect(transactionsChanged).not.toHaveBeenCalled();

    await user.type(input, "gastei 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Qual categoria devo usar para essa saída?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Alimentação/ }));

    expect(await screen.findByText("Saída registrada em Alimentação. Seus gráficos já foram atualizados.")).toBeInTheDocument();
    expect(loadTransactions()).toEqual(expect.arrayContaining([
      expect.objectContaining({ desc: "Saída via chat", category: "Alimentação", amount: -25 }),
    ]));
    expect(transactionsChanged).toHaveBeenCalledOnce();
    window.removeEventListener("junta:transactions-changed", transactionsChanged);
  });

  it("creates, edits and deletes a goal with a deadline and emits goal change events", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const goalsChanged = vi.fn();
    window.addEventListener("junta:goals-changed", goalsChanged);
    renderWithFinanceProvider(<AppRoutes />, {
      route: "/assistente",
      initialFinanceData: { transactions: [], goals: [] },
    });

    const goalsRegion = within(screen.getByRole("complementary", { name: "Resumo da sua vida financeira" }));
    await user.click(goalsRegion.getByRole("button", { name: /Nova meta/ }));
    await user.click(screen.getByRole("button", { name: "Criar" }));
    expect(loadGoals()).toEqual([]);

    await user.type(screen.getByRole("textbox", { name: "Nome da meta" }), "Viagem");
    await user.type(screen.getByRole("textbox", { name: "Valor alvo" }), "0");
    await user.type(screen.getByLabelText("Prazo"), "2027-12-31");
    await user.click(screen.getByRole("button", { name: "Criar" }));
    expect(loadGoals()).toEqual([]);

    await user.clear(screen.getByRole("textbox", { name: "Valor alvo" }));
    await user.type(screen.getByRole("textbox", { name: "Valor alvo" }), "800");
    await user.click(screen.getByRole("button", { name: "Criar" }));
    expect(await screen.findByText("Prazo: 31/12/2027")).toBeInTheDocument();
    expect(loadGoals()).toEqual([expect.objectContaining({ name: "Viagem", target: 800, dueDate: "2027-12-31" })]);

    await user.click(goalsRegion.getByRole("button", { name: "Editar Viagem" }));
    await user.clear(screen.getByRole("textbox", { name: "Valor alvo" }));
    await user.type(screen.getByRole("textbox", { name: "Valor alvo" }), "1000");
    await user.clear(screen.getByLabelText("Prazo"));
    await user.type(screen.getByLabelText("Prazo"), "2028-06-30");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Prazo: 30/06/2028")).toBeInTheDocument();
    expect(loadGoals()).toEqual([expect.objectContaining({ target: 1000, dueDate: "2028-06-30" })]);

    await user.click(goalsRegion.getByRole("button", { name: "Excluir Viagem" }));
    expect(await goalsRegion.findByRole("heading", { name: "Nenhuma meta criada" })).toBeInTheDocument();
    expect(loadGoals()).toEqual([]);
    expect(goalsChanged).toHaveBeenCalledTimes(3);
    window.removeEventListener("junta:goals-changed", goalsChanged);
  });
});