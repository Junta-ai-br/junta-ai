import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import { api } from "@/services/api";
import { clearSession, getSessionSnapshot, saveSession } from "@/services/auth/session";
import { startAttempt } from "@/services/uncertain-attempt";
import useAssistantConversation from "../useAssistantConversation";
import useGoals from "../useGoals";
import SavedCard from "@/components/finance/SavedCard";

const conversation = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", title: "Servidor", updatedAt: "2026-10-18T12:00:00Z" };
const goal = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", name: "Viagem", targetAmount: "1000.00", status: "IN_PROGRESS", deadline: null };
const response = (config, data) => ({ config, status: 200, headers: {}, data });
let persisted, reads;
function Harness({ pauseRefresh, failRefresh = false } = {}) {
  const goals = useGoals();
  const chat = useAssistantConversation({ refreshFinancialData: async () => {
    if (pauseRefresh) await pauseRefresh;
    if (failRefresh) throw new Error("synthetic refresh failure");
    await goals.reload();
  } });
  return <>
    <SavedCard />
    <output aria-label="Acumulado da meta">{goals.goals[0]?.currentAmount ?? "carregando"}</output>
    <output aria-label="Recuperação">{chat.recovery ? "pendente" : "encerrada"}</output>
    <button disabled={chat.loading} onClick={chat.acknowledgeUncertain}>Encerrar recuperação</button>
  </>;
}
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); clearSession();
  saveSession({ accessToken: "A", refreshToken: "R-A", expiresInSeconds: 900 });
  expect(startAttempt("chat", crypto.randomUUID(), getSessionSnapshot().generation)).toBe(true);
  persisted = "0.00"; reads = [];
  api.defaults.adapter = async (config) => {
    reads.push(config);
    if (config.url === "/conversations") return response(config, JSON.stringify([conversation]));
    if (config.url.endsWith("/messages")) return response(config, "[]");
    if (config.url === "/goals") return response(config, JSON.stringify([{ ...goal, currentAmount: persisted }])
      .replace('"targetAmount":"1000.00"', '"targetAmount":1000.00')
      .replace(`"currentAmount":"${persisted}"`, `"currentAmount":${persisted}`));
    if (config.url === "/dashboard") return response(config, `{"saved":${persisted}}`);
    throw new Error("Unexpected request");
  };
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); });

it("reconciles a completed R$ 200 contribution after a restored uncertain send", async () => {
  render(<Harness />);
  await screen.findByText("R$ 0,00");
  await waitFor(() => expect(screen.getByLabelText("Acumulado da meta")).toHaveTextContent("0.00"));
  expect(screen.getByLabelText("Recuperação")).toHaveTextContent("pendente");
  const before = reads.filter((r) => r.url === "/dashboard").length;
  persisted = "200.00"; // Backend commits after the first dashboard read.
  expect(screen.queryByText("R$ 200,00")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Encerrar recuperação" }));
  await screen.findByText("R$ 200,00");
  expect(screen.getByLabelText("Acumulado da meta")).toHaveTextContent("200.00");
  expect(screen.getByLabelText("Recuperação")).toHaveTextContent("encerrada");
  expect(reads.filter((r) => r.url === "/dashboard")).toHaveLength(before + 1);
  expect(reads.every((r) => r.method === "get")).toBe(true);
});

it("does not invalidate the new session when an old reconciliation finishes late", async () => {
  let finish;
  const paused = new Promise((resolve) => { finish = resolve; });
  render(<Harness pauseRefresh={paused} />);
  await screen.findByText("R$ 0,00");
  await waitFor(() => expect(screen.getByRole("button", { name: "Encerrar recuperação" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Encerrar recuperação" }));
  persisted = "5.00";
  act(() => saveSession({ accessToken: "B", refreshToken: "R-B", expiresInSeconds: 900 }));
  await screen.findByText("R$ 5,00");
  const before = reads.filter((r) => r.url === "/dashboard").length;
  await act(async () => { finish(); });
  expect(reads.filter((r) => r.url === "/dashboard")).toHaveLength(before);
  expect(within(screen.getByRole("article", { name: "Guardado" })).getByText("R$ 5,00")).toBeInTheDocument();
});

it("refreshes Guardado even if another financial panel fails to reload", async () => {
  render(<Harness failRefresh />);
  await screen.findByText("R$ 0,00");
  await waitFor(() => expect(screen.getByRole("button", { name: "Encerrar recuperação" })).toBeEnabled());
  persisted = "200.00";
  fireEvent.click(screen.getByRole("button", { name: "Encerrar recuperação" }));
  await screen.findByText("R$ 200,00");
  expect(screen.getByLabelText("Recuperação")).toHaveTextContent("pendente");
});
