import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Planejador from "@/pages/Planejador";
import { savePlannerSimulation } from "@/services/planner/store";
import { loadPlannerTransactions } from "@/services/planner/transactions";
import { clearSession, saveSession } from "@/services/auth/session";
vi.mock("@/services/planner/store", async (original) => ({ ...(await original()), savePlannerSimulation: vi.fn() }));
vi.mock("@/services/planner/transactions", () => ({ loadPlannerTransactions: vi.fn() }));
let records;
const loadPlannerSimulations = () => records;
import { renderWithFinanceProvider } from "@/test-utils";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async (original) => ({ ...(await original()), useNavigate: () => navigate }));
vi.mock("@/components/navigation/AuthHeader/AuthHeader", () => ({ default: () => null }));

async function setup(withHistory = false) {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  localStorage.setItem("junta_transactions", JSON.stringify([
    { date, amount: 4000, category: "Renda" },
    { date, amount: -1000, category: "Moradia" },
  ]));
  loadPlannerTransactions.mockResolvedValue(JSON.parse(localStorage.getItem("junta_transactions")));
  const view = renderWithFinanceProvider(<Planejador />);
  await act(async () => {});
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
    records = [];
    saveSession({ accessToken: "planner-test", refreshToken: "refresh", expiresInSeconds: 3600 });
    savePlannerSimulation.mockReset().mockImplementation(async (snapshot) => {
      const saved = { ...snapshot, id: String(records.length), createdAt: new Date().toISOString() };
      records.push(saved); return saved;
    });
    navigate.mockClear();
    vi.useFakeTimers();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  it("saves only explicitly, snapshots the slider and prevents repeated clicks", async () => {
    await setup();
    expect(loadPlannerSimulations()).toEqual([]);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1500" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    fireEvent.click(screen.getByRole("button", { name: "Simulação salva" }));
    const [snapshot] = loadPlannerSimulations();
    expect(loadPlannerSimulations()).toHaveLength(1);
    expect(snapshot).toMatchObject({ period: { type: "no_history" }, goal: { amount: 12000, deadlineMonths: 12 }, simulation: { monthlyAmount: 1500, estimatedMonths: 8 }, historyContext: null });
    expect(navigate).toHaveBeenCalledWith("/planejador/historico");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1400" } });
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeEnabled();
  });
  it("saves only the existing financial context", async () => {
    await setup(true);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(loadPlannerSimulations()[0].historyContext).toEqual({ income: 4000, fixedExpenses: 1000, totalExpenses: 1000, available: 3000, commitmentRate: 25 });
  });
  it("confirms unsaved discard and resets to the initial form", async () => {
    const view = await setup();
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
  it("resets saved results without confirmation and hides stale results on edits", async () => {
    const view = await setup();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    const confirm = vi.spyOn(window, "confirm");
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(confirm).not.toHaveBeenCalled();
    expect(loadPlannerSimulations()).toHaveLength(1);
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Outra" } });
    expect(screen.queryByRole("button", { name: "Salvar simulação" })).not.toBeInTheDocument();
  });
  it("keeps a failed save unsaved and allows retry", async () => {
    await setup();
    savePlannerSimulation.mockRejectedValueOnce(new Error("save failed"));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível salvar");
    expect(navigate).not.toHaveBeenCalled();

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(loadPlannerSimulations()).toHaveLength(1);
  });
  it("invalidates a saved result when its form is edited and regenerates it unsaved", async () => {
    const view = await setup();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Viagem" } });
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeEnabled();
    expect(loadPlannerSimulations()).toHaveLength(1);
  });
  it("cancels a pending generation on reset", async () => {
    await setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(loadPlannerSimulations()).toEqual([]);
  });
  it("preserves cents in the generated reference and saved slider snapshot", async () => {
    const view = await setup();
    fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "500000" } });
    fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("833.34");
    expect(screen.getByRole("slider")).toHaveAttribute("step", "0.01");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "900.25" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(loadPlannerSimulations()[0].simulation).toEqual({ monthlyAmount: 900.25, estimatedMonths: 6 });
  });
  it("keeps exact cent amounts and supports goals below one real", async () => {
    const view = await setup();
    fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "1" } });
    fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("0.01");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(loadPlannerSimulations()[0].simulation).toEqual({ monthlyAmount: 0.01, estimatedMonths: 1 });
  });
  it("uses real financial updates when changing the selected period", async () => {
    await setup(true);
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    loadPlannerTransactions.mockResolvedValue([
      { date, amount: 5000, category: "Renda" },
      { date, amount: -1000, category: "Moradia" },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /ltimos 30 dias/ }));
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("4000");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(loadPlannerSimulations()[0].historyContext).toMatchObject({ income: 5000, available: 4000 });
  });
  it("uses the current partial month and two previous months divided by three", async () => {
    vi.setSystemTime(new Date(2026, 9, 19, 12));
    await setup(true);
    loadPlannerTransactions.mockResolvedValue([
      { date: "2026-08-01", amount: 6000, category: "Renda" },
      { date: "2026-10-19", amount: -1500, category: "Moradia" },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /Média dos últimos 3 meses/ }));
    await act(async () => {});
    expect(loadPlannerTransactions).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2026-08-01", to: "2026-10-19" }));
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("1500");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(records[0].historyContext).toMatchObject({ income: 2000, fixedExpenses: 500, available: 1500 });
  });
  it("never uses demonstration transactions when the real history is empty", async () => {
    await setup(true);
    localStorage.setItem("junta_transactions", JSON.stringify([{ date: "2026-10-19", amount: 999999, category: "Renda" }]));
    loadPlannerTransactions.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: /ltimos 30 dias/ }));
    await act(async () => {});
    expect(screen.getByRole("status")).toHaveTextContent("Nenhuma movimentação real");
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("slider")).toHaveValue("1000");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(records[0]).toMatchObject({ period: { type: "no_history" }, historyContext: null });
  });
  it("distinguishes loading and failure from empty history and allows explicit retry", async () => {
    await setup(true);
    let reject;
    loadPlannerTransactions.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
    fireEvent.click(screen.getByRole("button", { name: /ltimos 30 dias/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando histórico financeiro real");
    expect(screen.getByRole("button", { name: /Criar planejamento/ })).toBeDisabled();
    await act(async () => reject({ response: { status: 403 } }));
    expect(screen.getByRole("alert")).toHaveTextContent("permissão");
    expect(screen.queryByText(/Nenhuma movimentação real/)).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" })); });
    expect(screen.getByRole("button", { name: /Criar planejamento/ })).toBeEnabled();
  });
  it("blocks concurrent POST and edits while saving, without a premature success", async () => {
    const view = await setup();
    let resolve;
    savePlannerSimulation.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    expect(screen.getByRole("button", { name: "Salvando…" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Salvando…" }));
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Outra" } });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(view.container.querySelector("#goal-name")).toHaveValue("Reserva");
    expect(navigate).not.toHaveBeenCalled();
    expect(savePlannerSimulation).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ id: "server" }));
    expect(navigate).toHaveBeenCalledWith("/planejador/historico");
  });
  it("requires consulting history after an uncertain write and never repeats it", async () => {
    await setup();
    savePlannerSimulation.mockRejectedValueOnce(Object.assign(new Error("timeout"), { code: "ECONNABORTED" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Consulte o Histórico");
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeDisabled();
    expect(navigate).not.toHaveBeenCalled();
    expect(savePlannerSimulation).toHaveBeenCalledTimes(1);
  });
  it("keeps uncertainty visible through slider, field and period edits without releasing another POST", async () => {
    const view = await setup();
    savePlannerSimulation.mockRejectedValueOnce(Object.assign(new Error("timeout"), { code: "ECONNABORTED" }));
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    fireEvent.change(screen.getByRole("slider"), { target: { value: "1500" } });
    expect(screen.getByRole("alert")).toHaveTextContent("Resultado da gravação incerto. Consulte o Histórico");
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeDisabled();
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Reserva editada" } });
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Consulte o Histórico");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Mês atual/ })); });
    expect(screen.getByRole("alert")).toHaveTextContent("Consulte o Histórico");
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("alert")).toHaveTextContent("Resultado da gravação incerto");
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    act(() => vi.advanceTimersByTime(30000));
    expect(savePlannerSimulation).toHaveBeenCalledTimes(1);
    expect(records).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });
  it("resets uncertainty only after explicitly confirming a new independent simulation and saves fresh data", async () => {
    const view = await setup();
    savePlannerSimulation.mockImplementationOnce(async (snapshot) => {
      // The server may have persisted the first attempt before the timeout.
      records.push({ ...snapshot, id: "previous-server-id" });
      throw Object.assign(new Error("timeout"), { code: "ECONNABORTED" });
    });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Edição da tentativa incerta" } });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Nova simulação" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("A gravação anterior pode ter sido concluída"));
    expect(screen.getByRole("alert")).toHaveTextContent("Consulte o Histórico");
    expect(view.container.querySelector("#goal-name")).toHaveValue("Edição da tentativa incerta");
    confirm.mockReturnValue(true);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Nova simulação" })); });
    expect(view.container.querySelector("#goal-name")).toHaveValue("");
    expect(view.container.querySelector("#goal-amount")).toHaveValue("");
    expect(view.container.querySelector("#goal-deadline")).toHaveValue(null);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(savePlannerSimulation).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Sem histórico/ }));
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: "Viagem independente" } });
    fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "600000" } });
    fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeEnabled();
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(savePlannerSimulation).toHaveBeenCalledTimes(2);
    const fresh = savePlannerSimulation.mock.calls[1][0];
    expect(fresh).not.toBe(savePlannerSimulation.mock.calls[0][0]);
    expect(fresh).not.toHaveProperty("id");
    expect(fresh).not.toHaveProperty("createdAt");
    expect(fresh).toMatchObject({ goal: { name: "Viagem independente", amount: 6000, deadlineMonths: 6 }, historyContext: null });
    expect(records[0].id).toBe("previous-server-id");
    expect(records).toHaveLength(2);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("/planejador/historico");
    expect(screen.getByRole("button", { name: "Simulação salva" })).toBeDisabled();
  });
  it.each([400, 401, 403])("shows the actual HTTP %s error even when Axios includes a request object", async (status) => {
    await setup();
    savePlannerSimulation.mockRejectedValueOnce({ request: {}, response: { status } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" })); });
    expect(screen.getByRole("alert")).toHaveTextContent(status === 400 ? "Confira os valores" : status === 401 ? "Sessão expirada" : "permissão");
    expect(screen.getByRole("button", { name: "Salvar simulação" })).toBeEnabled();
    expect(navigate).not.toHaveBeenCalled();
  });
  it("discards a pending POST and clears the form after account replacement", async () => {
    await setup();
    let resolve;
    savePlannerSimulation.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar simulação" }));
    act(() => saveSession({ accessToken: "B", refreshToken: "refresh", expiresInSeconds: 3600 }));
    await act(async () => resolve({ id: "old-account" }));
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nome da meta")).toHaveValue("");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    act(() => clearSession());
    await act(async () => {});
  });
  it("validates unsafe amounts and deadlines without silently rounding the displayed entry", async () => {
    const view = await setup();
    fireEvent.change(view.container.querySelector("#goal-name"), { target: { value: " " } });
    fireEvent.change(view.container.querySelector("#goal-amount"), { target: { value: "99999999999999999999" } });
    fireEvent.change(view.container.querySelector("#goal-deadline"), { target: { value: "1201" } });
    fireEvent.click(screen.getByRole("button", { name: /Criar planejamento/ }));
    expect(screen.getByText("Informe um nome de até 150 caracteres.")).toBeInTheDocument();
    expect(screen.getByText(/Informe um valor entre/)).toBeInTheDocument();
    expect(screen.getByText("Informe um prazo de 1 a 1200 meses.")).toBeInTheDocument();
    expect(view.container.querySelector("#goal-amount")).toHaveValue("999.999.999.999.999.999,99");
    expect(savePlannerSimulation).not.toHaveBeenCalled();
  });
});
