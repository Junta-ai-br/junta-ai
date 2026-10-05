import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Planejador from "@/pages/Planejador";
import { loadPlannerSimulations } from "@/services/planner/store";
import { renderWithFinanceProvider } from "@/test-utils";
import { saveTransactions } from "@/services/finance/store";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (original) => ({ ...(await original()), useNavigate: () => navigate }));
vi.mock("@/components/navigation/AuthHeader/AuthHeader", () => ({ default: () => null }));

function setup(withHistory = false) {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  localStorage.setItem("junta_transactions", JSON.stringify([
    { date, amount: 4000, category: "Renda" },
    { date, amount: -1000, category: "Moradia" },
  ]));
  const view = renderWithFinanceProvider(<Planejador />);
  if (!withHistory) fireEvent.click(screen.getByRole("button", { name: /Sem histórico/ }));
  fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Reserva" } });
  fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "1200000" } });
  fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "12" } });
  fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
  act(() => vi.advanceTimersByTime(400));
  return view;
}

describe("Planner actions", () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockClear();
    vi.useFakeTimers();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  it("saves only explicitly, snapshots the slider and prevents repeated clicks", () => {
    setup();
    expect(loadPlannerSimulations()).toEqual([]);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    fireEvent.click(screen.getByRole("button", { name: "Simulação salva" }));
    const [snapshot] = loadPlannerSimulations();
    expect(loadPlannerSimulations()).toHaveLength(1);
    expect(snapshot).toMatchObject({ period: { usesHistory: false }, goal: { amount: 12000, deadlineMonths: 12 }, simulation: { monthlyAmount: 1500, estimatedMonths: 8 }, historyContext: null });
    expect(navigate).toHaveBeenCalledWith("/planejador/historico");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1400" } });
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeEnabled();
  });
  it("saves only the existing financial context", () => {
    setup(true);
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(loadPlannerSimulations()[0].historyContext).toEqual({ income: 4000, fixedExpenses: 1000, totalExpenses: 1000, available: 3000, commitmentRate: 25 });
  });
  it("confirms unsaved discard and resets to the initial form", () => {
    const view = setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeInTheDocument();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(view.container.querySelector("#goal-name")).toHaveValue("");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(loadPlannerSimulations()).toEqual([]);
    confirm.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(confirm).not.toHaveBeenCalled();
  });
  it("resets saved results without confirmation and hides stale results on edits", () => {
    const view = setup();
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    const confirm = vi.spyOn(window, "confirm");
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(loadPlannerSimulations()).toHaveLength(1);
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Outra" } });
    expect(screen.queryByRole("button", { name: "Salvar simulação" })).not.toBeInTheDocument();
  });
  it("keeps a failed save unsaved and allows retry", () => {
    setup();
    localStorage.setItem("junta_planner_simulations", "invalid");
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar");
    expect(navigate).not.toHaveBeenCalled();
    localStorage.removeItem("junta_planner_simulations");
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(loadPlannerSimulations()).toHaveLength(1);
  });
  it("invalidates a saved result when its form is edited and regenerates it unsaved", () => {
    const view = setup();
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Viagem" } });
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeEnabled();
    expect(loadPlannerSimulations()).toHaveLength(1);
  });
  it("cancels a pending generation on reset", () => {
    setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(loadPlannerSimulations()).toEqual([]);
  });
  it("preserves cents in the generated reference and saved slider snapshot", () => {
    const view = setup();
    fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "500000" } });
    fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("833.34");
    expect(screen.getByRole("slider")).toHaveAttribute("step", "0.01");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "900.25" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(loadPlannerSimulations()[0].simulation).toEqual({ monthlyAmount: 900.25, estimatedMonths: 6 });
  });
  it("keeps exact cent amounts and supports goals below one real", () => {
    const view = setup();
    fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "1" } });
    fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("0.01");
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(loadPlannerSimulations()[0].simulation).toEqual({ monthlyAmount: 0.01, estimatedMonths: 1 });
  });
  it("uses financial updates from the shared provider when regenerating", () => {
    setup(true);
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    act(() => saveTransactions([
      { date, amount: 5000, category: "Renda" },
      { date, amount: -1000, category: "Moradia" },
    ]));
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("4000");
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(loadPlannerSimulations()[0].historyContext).toMatchObject({ income: 5000, available: 4000 });
  });
});
