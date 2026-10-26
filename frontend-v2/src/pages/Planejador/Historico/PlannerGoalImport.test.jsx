import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { clearSession, saveSession } from "@/services/auth/session";
import { importPlannerGoal } from "@/services/planner/goal-import";
import PlannerGoalImport from "./PlannerGoalImport";
vi.mock("@/services/planner/goal-import", () => ({ importPlannerGoal: vi.fn() }));
const simulation = { id: "11111111-1111-4111-8111-111111111111", goal: { name: "Viagem", amount: 500.25, deadlineMonths: 6 } };
const mount = () => render(<MemoryRouter><PlannerGoalImport simulation={simulation} /></MemoryRouter>);
const open = () => fireEvent.click(screen.getByRole("button", { name: "Adicionar às minhas metas" }));
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Confirmar importação" }));
beforeEach(() => { vi.resetAllMocks(); clearSession(); saveSession({ accessToken: "synthetic", refreshToken: "synthetic", expiresInSeconds: 3600 }); });

it("requires explicit confirmation and leaves the deadline empty instead of converting months", async () => {
  let finish; importPlannerGoal.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  mount(); open();
  expect(importPlannerGoal).not.toHaveBeenCalled();
  expect(screen.getByText("R$ 500,25")).toBeInTheDocument();
  expect(screen.getByLabelText("Vencimento (opcional)")).toHaveValue("");
  const button=screen.getByRole("button", { name: "Confirmar importação" });
  fireEvent.click(button); fireEvent.click(button);
  expect(importPlannerGoal).toHaveBeenCalledTimes(1);
  expect(importPlannerGoal.mock.calls[0][1]).toEqual({ deadline: null, confirmReimport: false });
  expect(screen.queryByText("Meta adicionada às suas metas.")).not.toBeInTheDocument();
  await act(async () => finish({ id: "persisted" }));
  expect(screen.getByRole("status")).toHaveTextContent("Meta adicionada às suas metas.");
  expect(screen.getByRole("link")).toHaveAttribute("href", "/assistente");
});

it("preserves the same body and key when a response is uncertain", async () => {
  importPlannerGoal.mockRejectedValueOnce(new Error("response lost")).mockResolvedValueOnce({});
  mount(); open(); submit();
  await screen.findByText(/Não foi possível confirmar a importação/);
  const [id, body, key] = importPlannerGoal.mock.calls[0];
  fireEvent.click(screen.getByRole("button", { name: "Retomar importação" }));
  await screen.findByText("Meta adicionada às suas metas.");
  expect(importPlannerGoal.mock.calls[1].slice(0,3)).toEqual([id, body, key]);
});

it("requires additional consent after a previously imported goal was deleted", async () => {
  importPlannerGoal.mockRejectedValueOnce({ response: { status: 409, data: { mensagem: "simulation_reimport_confirmation_required" } } }).mockResolvedValueOnce({});
  mount(); open(); submit();
  await screen.findByText(/A meta importada anteriormente foi excluída/);
  expect(screen.getByRole("button", { name: "Confirmar importação" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox")); submit();
  await screen.findByText("Meta adicionada às suas metas.");
  expect(importPlannerGoal.mock.calls[1][1].confirmReimport).toBe(true);
  expect(importPlannerGoal.mock.calls[1][2]).not.toBe(importPlannerGoal.mock.calls[0][2]);
});

it.each([
  [404, {}, /Simulação não encontrada ou indisponível/],
  [409, { mensagem: "simulation_already_imported" }, /Esta simulação já foi importada/],
])("shows a clear error for HTTP %s without success", async (status, data, message) => {
  importPlannerGoal.mockRejectedValue({ response: { status, data } });
  mount(); open(); submit();
  await screen.findByText(message);
  expect(screen.queryByText("Meta adicionada às suas metas.")).not.toBeInTheDocument();
});

it("ignores a pending response after unmount during a session change", async () => {
  let finish; importPlannerGoal.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const view=mount(); open(); submit(); view.unmount();
  clearSession();
  await act(async () => finish({}));
  await waitFor(() => expect(screen.queryByText("Meta adicionada às suas metas.")).not.toBeInTheDocument());
});
