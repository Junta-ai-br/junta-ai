import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Historico from "./index";
import { renderWithProviders } from "@/test/renderWithProviders";
import { loadPlannerSimulations, removePlannerSimulation } from "@/services/planner/store";

vi.mock("@/services/planner/store", () => ({
  loadPlannerSimulations: vi.fn(),
  removePlannerSimulation: vi.fn(),
}));

const withoutHistory = {
  id: "simulation-1",
  createdAt: "2026-10-03T12:00:00.000Z",
  period: { type: "no_history", label: "Sem histórico", usesHistory: false },
  goal: { name: "Viagem", amount: 5000, deadlineMonths: 6 },
  simulation: { monthlyAmount: 833.34, estimatedMonths: 7 },
  historyContext: null,
};

const withHistory = {
  id: "simulation-2",
  createdAt: "2026-10-04T12:00:00.000Z",
  period: { type: "current_month", label: "Mês atual", usesHistory: true },
  goal: { name: "Reserva", amount: 12000, deadlineMonths: 12 },
  simulation: { monthlyAmount: 1500, estimatedMonths: 8 },
  historyContext: { income: 4000, fixedExpenses: 1000, totalExpenses: 2500, available: 1500, commitmentRate: 62.5 },
};

function renderHistory() {
  return renderWithProviders(<Historico />, { route: "/planejador/historico" });
}

function cards() {
  return within(screen.getByRole("region", { name: "Simulações salvas" })).getAllByRole("article");
}

describe("Histórico do Planejador", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
    loadPlannerSimulations.mockReturnValue([withoutHistory, withHistory]);
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders saved goals, desired deadlines, monthly amounts and dates newest first", () => {
    renderHistory();
    expect(screen.getByRole("heading", { level: 1, name: "Histórico de simulações" })).toBeInTheDocument();
    const [recent, older] = cards();
    expect(within(recent).getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
    expect(within(older).getByRole("heading", { name: "Viagem" })).toBeInTheDocument();
    expect(within(recent).getByText("12 meses")).toBeInTheDocument();
    expect(within(older).getByText("6 meses")).toBeInTheDocument();
    expect(within(recent).getByText(/R\$\s*1\.500,00/)).toBeInTheDocument();
    expect(within(older).getByText(/R\$\s*833,34/)).toBeInTheDocument();
    expect(within(recent).getByText("04 de out. de 2026")).toBeInTheDocument();
    expect(within(older).getByText("03 de out. de 2026")).toBeInTheDocument();
  });

  it("expands the selected simulation and collapses it again", () => {
    renderHistory();
    const [recent, older] = cards();
    fireEvent.click(within(recent).getByRole("button", { name: "Ver detalhes" }));
    const collapse = within(recent).getByRole("button", { name: "Ocultar detalhes" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    expect(within(recent).getByText("Valor da meta")).toBeInTheDocument();
    expect(within(recent).getByText(/R\$\s*12\.000,00/)).toBeInTheDocument();
    expect(within(recent).getByText("Prazo estimado")).toBeInTheDocument();
    expect(within(recent).getByText("8 meses")).toBeInTheDocument();
    expect(within(recent).getByText("Base utilizada")).toBeInTheDocument();
    expect(within(recent).getByText("Mês atual")).toBeInTheDocument();
    expect(within(recent).getByText("Tipo de análise")).toBeInTheDocument();
    expect(within(recent).getByText("Com histórico")).toBeInTheDocument();
    expect(within(recent).getByText("Renda considerada")).toBeInTheDocument();
    expect(within(recent).getByText(/R\$\s*4\.000,00/)).toBeInTheDocument();
    expect(within(recent).getByText("Margem disponível")).toBeInTheDocument();
    expect(within(recent).getAllByText(/R\$\s*1\.500,00/)).toHaveLength(2);
    expect(within(older).queryByText("Valor da meta")).not.toBeInTheDocument();
    fireEvent.click(collapse);
    expect(within(recent).getByRole("button", { name: "Ver detalhes" })).toHaveAttribute("aria-expanded", "false");
    expect(within(recent).queryByText("Valor da meta")).not.toBeInTheDocument();
  });

  it("shows the analysis without financial context for a no-history simulation", () => {
    renderHistory();
    const older = cards()[1];
    fireEvent.click(within(older).getByRole("button", { name: "Ver detalhes" }));
    expect(within(older).getByText("Tipo de análise").parentElement).toHaveTextContent("Sem histórico");
    expect(within(older).queryByText("Renda considerada")).not.toBeInTheDocument();
    expect(within(older).queryByText("Margem disponível")).not.toBeInTheDocument();
  });

  it("shows the empty state and its Planner link", () => {
    loadPlannerSimulations.mockReturnValue([]);
    renderHistory();
    expect(screen.getByRole("heading", { name: "Nenhuma simulação salva" })).toBeInTheDocument();
    expect(screen.getByText("Crie um planejamento e salve os cenários que quiser consultar novamente.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o Planejador" })).toHaveAttribute("href", "/planejador");
  });

  it("links Nova simulação to the Planner", () => {
    renderHistory();
    expect(screen.getByRole("link", { name: "Nova simulação" })).toHaveAttribute("href", "/planejador");
  });

  it("does not delete when confirmation is cancelled", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderHistory();
    fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Viagem" }));
    expect(confirm).toHaveBeenCalledWith('Deseja excluir a simulação "Viagem"?');
    expect(removePlannerSimulation).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Viagem" })).toBeInTheDocument();
  });

  it("deletes the confirmed id and removes only that simulation from the page", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    removePlannerSimulation.mockReturnValue([withHistory]);
    renderHistory();
    fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Viagem" }));
    expect(removePlannerSimulation).toHaveBeenCalledExactlyOnceWith("simulation-1");
    expect(screen.queryByRole("heading", { name: "Viagem" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
  });

  it("clears expansion for a deleted simulation even if a later store result contains it again", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    removePlannerSimulation.mockReturnValueOnce([withoutHistory]).mockReturnValueOnce([withHistory]);
    renderHistory();
    fireEvent.click(within(cards()[0]).getByRole("button", { name: "Ver detalhes" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Reserva" }));
    expect(screen.queryByText("Renda considerada")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Viagem" }));
    expect(screen.getByRole("button", { name: "Ver detalhes" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Valor da meta")).not.toBeInTheDocument();
  });

  it("handles a read failure with an accessible error", () => {
    loadPlannerSimulations.mockImplementation(() => { throw new Error("read failed"); });
    renderHistory();
    expect(screen.getByRole("heading", { name: "Histórico de simulações" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar seu histórico de simulações.");
  });

  it("keeps the simulation and its details visible when deletion fails", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    removePlannerSimulation.mockImplementation(() => { throw new Error("delete failed"); });
    renderHistory();
    fireEvent.click(within(cards()[0]).getByRole("button", { name: "Ver detalhes" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Reserva" }));
    expect(screen.getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
    expect(screen.getByText("Renda considerada")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível excluir esta simulação. Tente novamente.");
  });
});
