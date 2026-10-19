import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import AppRoutes from "@/app/routes";
import Assistente from "./Assistente";
import { loadGoals, loadTransactions } from "@/services/finance/store";
import { renderWithFinanceProvider } from "@/test-utils";
import { clearSession, saveSession } from "@/services/auth/session";
import { api } from "@/services/api";
const conversation = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", title: "Histórico", updatedAt: "2026-10-18T12:00:00Z" };
const userMessage = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", role: "USER", content: "Mensagem persistida", createdAt: conversation.updatedAt };
const assistantMessage = { ...userMessage, id: "ec17e3c2-b24a-4e17-9ff5-58d370cc9862", role: "ASSISTANT", content: "Resposta recebida da API" };
const response = (config, data) => ({ config, status: 200, headers: {}, data: JSON.stringify(data) });
let requests;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); clearSession(); requests = [];
  saveSession({ accessToken: "test-access", refreshToken: "test-refresh", expiresInSeconds: 900 });
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return response(config, config.method === "get" ? [] : config.url === "/conversations" ? conversation
      : { conversationId: conversation.id, userMessage, assistantMessage, actionExecuted: true });
  };
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); });
describe("Assistente real chat", () => {
  it("preserves embedded layout and displays backend confirmation without another financial write", async () => {
    const user = userEvent.setup();
    const { container } = renderWithFinanceProvider(<Assistente variant="embedded" className="test-chat" height={280} width={420} />);
    const chat = container.querySelector(".assistant--embedded");
    expect(chat).toHaveClass("test-chat"); expect(chat.style.getPropertyValue("--assistant-height")).toBe("280px");
    expect(chat.style.getPropertyValue("--assistant-width")).toBe("420px"); expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "Nova conversa" });
    const before = loadTransactions();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "gastei 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText("Resposta recebida da API")).toBeInTheDocument();
    expect(screen.getByText(/backend confirmou a execução/)).toBeInTheDocument();
    expect(loadTransactions()).toEqual(before);
    expect(requests.filter((request) => request.method === "post").map((request) => request.url)).toEqual(["/conversations", `/conversations/${conversation.id}/messages`]);
  });
  it("loads persisted messages and keeps the existing navigation", async () => {
    api.defaults.adapter = async (config) => response(config, config.url === "/conversations" ? [conversation] : [userMessage, assistantMessage]);
    renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });
    expect(await screen.findByText("Mensagem persistida")).toBeInTheDocument();
    expect(screen.getByText("Resposta recebida da API")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Navegação principal" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
    expect(screen.queryByText(/backend confirmou a execução/)).not.toBeInTheDocument();
  });
  it("shows AI unavailability without a simulated reply or category picker", async () => {
    const user = userEvent.setup(); renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });
    const input = await screen.findByRole("textbox", { name: "Mensagem" });
    await user.type(input, "gastei 25");
    api.defaults.adapter = async (config) => {
      if (config.url === "/conversations") return response(config, conversation);
      throw new AxiosError("Unavailable", "ERR_BAD_RESPONSE", config, {}, { config, status: 503, data: '{"code":"message_processing_failed"}' });
    };
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/IA não conseguiu processar/);
    expect(screen.queryByText(/Seus gráficos já foram atualizados/)).not.toBeInTheDocument();
    expect(screen.queryByText("Qual categoria devo usar para essa saída?")).not.toBeInTheDocument();
    expect(input).toHaveValue("gastei 25");
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

    const goalsRegion = within(await screen.findByRole("complementary", { name: "Resumo da sua vida financeira" }));
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
