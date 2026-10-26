import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import { api } from "@/services/api";
import { clearSession, saveSession } from "@/services/auth/session";
import useAssistantConversation from "@/hooks/useAssistantConversation";
const conversation = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", title: "Servidor", updatedAt: "2026-10-18T12:00:00Z" };
const userMessage = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", role: "USER", content: "gastei 0,01", createdAt: conversation.updatedAt };
const assistantMessage = { ...userMessage, id: "ec17e3c2-b24a-4e17-9ff5-58d370cc9862", role: "ASSISTANT", content: "Resposta real do contrato" };
const tokens = { accessToken: "same", refreshToken: "R", expiresInSeconds: 900 };
const reply = (actionExecuted = false) => ({ conversationId: conversation.id, userMessage, assistantMessage, actionExecuted });
const response = (config, data) => ({ config, data: JSON.stringify(data), status: 200, headers: {} });
let calls, transport;
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); clearSession(); saveSession(tokens); calls = [];
  transport = async (config) => response(config, config.method === "post" ? config.url === "/conversations" ? conversation : reply() : config.url === "/conversations" ? [conversation] : []);
  api.defaults.adapter = (config) => { calls.push(config); return transport(config); };
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); });
const mount = async () => { const hook = renderHook(() => useAssistantConversation()); await waitFor(() => expect(hook.result.current.loading).toBe(false)); return hook; };
const posts = () => calls.filter((call) => call.method === "post");
describe("real conversation lifecycle", () => {
  it.each([true, false])("uses persisted history and backend execution evidence=%s without financial writes", async (executed) => {
    transport = async (config) => response(config, config.method === "post" ? reply(executed) : config.url === "/conversations" ? [conversation] : [userMessage]);
    const hook = await mount(); expect(hook.result.current.messages[0].text).toBe(userMessage.content);
    expect(hook.result.current.messages[0].fresh).toBe(false);
    const storage = vi.spyOn(Storage.prototype, "setItem");
    await act(async () => { await hook.result.current.handleSubmit("gastei 0,01"); });
    expect(hook.result.current.messages.at(-1)).toMatchObject({ type: "assistant", text: assistantMessage.content, executionConfirmed: executed });
    expect(hook.result.current.messages.find((item) => item.id === userMessage.id).fresh).toBe(false);
    expect(hook.result.current.messages.at(-1).fresh).toBe(true);
    await act(async () => { await hook.result.current.refreshHistory(); });
    expect(hook.result.current.messages.every((item) => !item.fresh)).toBe(true);
    expect(posts()).toHaveLength(1); expect(posts()[0].url).toBe(`/conversations/${conversation.id}/messages`);
    expect(posts()[0].headers.get("Authorization")).toBe("Bearer same");
    expect(posts()[0].headers.get("Idempotency-Key")).toMatch(/^[0-9a-f-]{36}$/);
    expect(posts()[0].timeout).toBe(65000); expect(storage.mock.calls.every(([key]) => ["junta_attempt_session", "junta_uncertain_chat"].includes(key))).toBe(true);
  });
  it("creates a conversation lazily and blocks concurrent Enter/click submissions", async () => {
    transport = async (config) => response(config, config.method === "post" ? config.url === "/conversations" ? conversation : reply() : []);
    const hook = await mount(); let first, second;
    act(() => { first = hook.result.current.handleSubmit("exato  💜 "); second = hook.result.current.handleSubmit("exato  💜 "); });
    await act(async () => { await Promise.all([first, second]); });
    expect(posts().map((item) => item.url)).toEqual(["/conversations", `/conversations/${conversation.id}/messages`]);
    expect(JSON.parse(posts()[1].data)).toEqual({ message: "exato  💜 " });
  });
  it("retains the key and exact body after timeout and only resumes on explicit action", async () => {
    const hook = await mount();
    const base = transport; let failed = false;
    transport = async (config) => { if (config.method === "post" && !failed) { failed = true; throw Object.assign(new Error("Timeout"), { code: "ECONNABORTED" }); } return base(config); };
    await act(async () => { await hook.result.current.handleSubmit("  gastei 0,01  "); });
    expect(hook.result.current.messages).toEqual([expect.objectContaining({ type: "user", text: "  gastei 0,01  " })]); expect(hook.result.current.recovery).not.toBeNull();
    expect(hook.result.current.isTyping).toBe(false);
    await act(async () => { await hook.result.current.handleSubmit("new intent forbidden"); }); expect(posts()).toHaveLength(1);
    await act(async () => { await hook.result.current.retryMessage(); });
    expect(posts()).toHaveLength(2);
    expect(posts()[1].data).toBe(posts()[0].data);
    expect(posts()[1].headers.get("Idempotency-Key")).toBe(posts()[0].headers.get("Idempotency-Key"));
    expect(hook.result.current.recovery).toBeNull();
    expect(hook.result.current.messages.every((item) => item.fresh)).toBe(true);
  });
  it("reports AI unavailability without a fictitious response or automatic retry", async () => {
    const hook = await mount();
    transport = async (config) => { throw new AxiosError("Unavailable", "ERR_BAD_RESPONSE", config, {}, { status: 503, config, data: '{"code":"message_processing_failed"}' }); };
    await act(async () => { await hook.result.current.handleSubmit("Olá"); });
    expect(hook.result.current.error).toMatch(/IA não conseguiu/); expect(hook.result.current.messages).toEqual([expect.objectContaining({ type: "user", text: "Olá" })]); expect(posts()).toHaveLength(1);
  });
  it.each(["new generation", "logout", "unmount"])("discards delayed response after %s", async (change) => {
    const hook = await mount(); const staleHandlers = hook.result.current;
    let resolve, config; const base = transport;
    transport = (request) => { if (request.method === "post") { config = request; return new Promise((yes) => { resolve = yes; }); } return base(request); };
    let pending; act(() => { pending = hook.result.current.handleSubmit("Sessão A"); }); await waitFor(() => expect(config).toBeDefined());
    act(() => { if (change === "new generation") saveSession(tokens); else if (change === "logout") clearSession(); else hook.unmount(); });
    if (change === "new generation") await waitFor(() => expect(hook.result.current.loading).toBe(false));
    await act(async () => { resolve(response(config, reply(true))); await pending; });
    expect(config.signal.aborted).toBe(true);
    if (change !== "unmount") {
      expect(hook.result.current.messages).toEqual([]);
      await act(async () => { staleHandlers.setInputValue("stale draft"); await staleHandlers.handleSubmit("stale send"); });
      expect(hook.result.current.inputValue).toBe(""); expect(posts()).toHaveLength(1);
    }
  });
  it("publishes the reply before reconciliation completes while keeping finances unavailable", async () => {
    let finishRefresh;
    const refreshFinancialData = vi.fn(() => new Promise((resolve) => { finishRefresh = resolve; }));
    const hook = renderHook(() => useAssistantConversation({ refreshFinancialData }));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    let pending;
    act(() => { pending = hook.result.current.handleSubmit("Mensagem"); });
    await waitFor(() => expect(refreshFinancialData).toHaveBeenCalledOnce());
    expect(hook.result.current.messages).toHaveLength(2);
    expect(hook.result.current.isTyping).toBe(false);
    expect(hook.result.current.isReconciling).toBe(true);
    await act(async () => { finishRefresh(); await pending; });
    expect(hook.result.current.isTyping).toBe(false);
    expect(hook.result.current.messages.map(({ id, fresh }) => ({ id, fresh }))).toEqual([
      { id: userMessage.id, fresh: true }, { id: assistantMessage.id, fresh: true },
    ]);
    transport = async (config) => response(config, config.url === "/conversations" ? [conversation] : [userMessage, assistantMessage]);
    await act(async () => { await hook.result.current.selectConversation(conversation.id); });
    expect(hook.result.current.messages.map(({ id, fresh }) => ({ id, fresh }))).toEqual([
      { id: userMessage.id, fresh: false }, { id: assistantMessage.id, fresh: false },
    ]);
  });

  it("shows the user immediately during lazy creation and replaces it once after the reply", async () => {
    let finishCreation;
    transport = async (config) => config.url === "/conversations" && config.method === "post"
      ? new Promise((resolve) => { finishCreation = () => resolve(response(config, conversation)); })
      : response(config, config.method === "post" ? reply() : []);
    const hook = await mount();
    let pending;
    act(() => { pending = hook.result.current.handleSubmit("gastei 25"); });
    expect(hook.result.current.messages).toEqual([expect.objectContaining({ type: "user", text: "gastei 25" })]);
    expect(hook.result.current.isTyping).toBe(true);
    await waitFor(() => expect(finishCreation).toBeDefined());
    await act(async () => { finishCreation(); await pending; });
    expect(hook.result.current.messages.map((item) => item.id)).toEqual([userMessage.id, assistantMessage.id]);
  });

  it("does not retry a successful message when financial refresh fails", async () => {
    const hook = renderHook(() => useAssistantConversation({ refreshFinancialData: async () => { throw new Error("offline"); } }));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    await act(async () => { await hook.result.current.handleSubmit("gastei 25"); });
    expect(hook.result.current.messages.at(-1).text).toBe(assistantMessage.content);
    expect(hook.result.current.recovery).toBeNull();
    expect(hook.result.current.error).toMatch(/atualizar os dados financeiros/);
    expect(hook.result.current.isTyping).toBe(false);
    expect(posts()).toHaveLength(1);
  });

});
