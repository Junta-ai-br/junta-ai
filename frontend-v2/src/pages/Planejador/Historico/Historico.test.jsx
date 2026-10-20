import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Historico from "./index";
import { saveSession } from "@/services/auth/session";
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

async function renderHistory() {
  await act(async () => { renderWithProviders(<Historico />, { route: "/planejador/historico" }); });
}

function cards() {
  return within(screen.getByRole("region", { name: "Simulações salvas" })).getAllByRole("article");
}

describe("Histórico do Planejador", async () => {
  beforeEach(() => {
    localStorage.clear();
    saveSession({ accessToken: "planner-test", refreshToken: "refresh", expiresInSeconds: 3600 });
    vi.resetAllMocks();
    loadPlannerSimulations.mockResolvedValue([withoutHistory, withHistory]);
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders saved goals, desired deadlines, monthly amounts and dates newest first", async () => {
    await renderHistory();
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

  it("expands the selected simulation and collapses it again", async () => {
    await renderHistory();
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

  it("shows the analysis without financial context for a no-history simulation", async () => {
    await renderHistory();
    const older = cards()[1];
    fireEvent.click(within(older).getByRole("button", { name: "Ver detalhes" }));
    expect(within(older).getByText("Tipo de análise").parentElement).toHaveTextContent("Sem histórico");
    expect(within(older).queryByText("Renda considerada")).not.toBeInTheDocument();
    expect(within(older).queryByText("Margem disponível")).not.toBeInTheDocument();
  });

  it("shows the empty state and its Planner link", async () => {
    loadPlannerSimulations.mockResolvedValue([]);
    await renderHistory();
    expect(screen.getByRole("heading", { name: "Nenhuma simulação salva" })).toBeInTheDocument();
    expect(screen.getByText("Crie um planejamento e salve os cenários que quiser consultar novamente.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o Planejador" })).toHaveAttribute("href", "/planejador");
  });

  it("links Nova simulação to the Planner", async () => {
    await renderHistory();
    expect(screen.getByRole("link", { name: "Nova simulação" })).toHaveAttribute("href", "/planejador");
  });

  it("does not delete when confirmation is cancelled", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await renderHistory();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Viagem" })); });
    expect(confirm).toHaveBeenCalledWith('Deseja excluir a simulação "Viagem"?');
    expect(removePlannerSimulation).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Viagem" })).toBeInTheDocument();
  });

  it("deletes the confirmed id and removes only that simulation from the page", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    removePlannerSimulation.mockReturnValue([withHistory]);
    await renderHistory();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Viagem" })); });
    expect(removePlannerSimulation).toHaveBeenCalledExactlyOnceWith("simulation-1");
    expect(screen.queryByRole("heading", { name: "Viagem" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
  });

  it("clears expansion after deleting the expanded simulation and then the remaining one", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    removePlannerSimulation.mockReturnValueOnce([withoutHistory]).mockReturnValueOnce([withHistory]);
    await renderHistory();
    fireEvent.click(within(cards()[0]).getByRole("button", { name: "Ver detalhes" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Reserva" })); });
    expect(screen.queryByText("Renda considerada")).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Viagem" })); });
    expect(screen.getByRole("heading", { name: "Nenhuma simulação salva" })).toBeInTheDocument();
    expect(screen.queryByText("Valor da meta")).not.toBeInTheDocument();
  });

  it("handles a read failure with an accessible error", async () => {
    loadPlannerSimulations.mockRejectedValue(new Error("read failed"));
    await renderHistory();
    expect(screen.getByRole("heading", { name: "Histórico de simulações" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar seu histórico de simulações.");
  });

  it("keeps the simulation and its details visible when deletion fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    removePlannerSimulation.mockRejectedValue(new Error("delete failed"));
    await renderHistory();
    fireEvent.click(within(cards()[0]).getByRole("button", { name: "Ver detalhes" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Excluir simulação Reserva" })); });
    expect(screen.getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
    expect(screen.getByText("Renda considerada")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível excluir esta simulação. Tente novamente.");
  });
  it("distinguishes a pending list request from an empty history", async () => {
    let resolve;
    loadPlannerSimulations.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    renderWithProviders(<Historico />, { route: "/planejador/historico" });
    expect(screen.getByRole("status")).toHaveTextContent("Carregando simulações");
    expect(screen.queryByText("Nenhuma simulação salva")).not.toBeInTheDocument();
    await act(async () => resolve([]));
    expect(screen.getByRole("heading", { name: "Nenhuma simulação salva" })).toBeInTheDocument();
  });
  it("waits for deletion confirmation from the server and blocks concurrent clicks", async () => {
    let resolve;
    removePlannerSimulation.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await renderHistory();
    const button = screen.getByRole("button", { name: "Excluir simulação Reserva" });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(removePlannerSimulation).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
    await act(async () => resolve());
    expect(screen.queryByRole("heading", { name: "Reserva" })).not.toBeInTheDocument();
  });
  it("allows an explicit retry after failure without displaying the empty state", async () => {
    loadPlannerSimulations.mockRejectedValueOnce({ response: { status: 401 } });
    await renderHistory();
    expect(screen.getByRole("alert")).toHaveTextContent("Sessão expirada");
    expect(screen.queryByText("Nenhuma simulação salva")).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" })); });
    expect(screen.getByRole("heading", { name: "Reserva" })).toBeInTheDocument();
  });
  it("clears visible simulations and discards a late result when the account changes", async () => {
    let resolve;
    loadPlannerSimulations.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    renderWithProviders(<Historico />, { route: "/planejador/historico" });
    loadPlannerSimulations.mockResolvedValue([]);
    act(() => saveSession({ accessToken: "B", refreshToken: "refresh", expiresInSeconds: 3600 }));
    await act(async () => resolve([withHistory]));
    expect(screen.queryByRole("heading", { name: "Reserva" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nenhuma simulação salva" })).toBeInTheDocument();
  });
});
