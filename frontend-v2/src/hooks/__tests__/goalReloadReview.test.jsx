// Regression checks: response loss + reload never resends with a new identity.
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import useGoals from "../useGoals";
import useAssistantConversation from "../useAssistantConversation";
import { clearSession, saveSession } from "@/services/auth/session";
import * as goals from "@/services/goals.api";
import * as chat from "@/services/conversations.api";
vi.mock("@/services/goals.api", () => ({ listGoals: vi.fn(), executeGoalCommand: vi.fn(), goalPayload: (body) => body }));
vi.mock("@/services/conversations.api", () => ({ listConversations: vi.fn(), listMessages: vi.fn(), sendMessage: vi.fn(), validChatInput: (text) => !!text }));
beforeEach(() => {
  vi.resetAllMocks(); clearSession();
  saveSession({ accessToken: "synthetic", refreshToken: "synthetic", expiresInSeconds: 3600 });
});

it("blocks new creation after committed response loss and page remount", async () => {
  const persisted = new Map(); let loseResponse = true;
  goals.listGoals.mockImplementation(async () => [...persisted.values()]);
  goals.executeGoalCommand.mockImplementation(async (command) => {
    if (!persisted.has(command.key)) persisted.set(command.key, { ...command.body, id: command.key });
    if (loseResponse) { loseResponse = false; throw new Error("Committed, response lost"); }
    return persisted.get(command.key);
  });
  const first = renderHook(useGoals);
  await waitFor(() => expect(first.result.current.status).toBe("empty"));
  const body = { name: "Viagem", targetAmount: "100.00", deadline: null };
  await act(async () => first.result.current.create(body));
  expect(persisted.size).toBe(1); expect(first.result.current.pending).not.toBeNull();
  const originalKey = goals.executeGoalCommand.mock.calls[0][0].key;
  first.unmount(); // Reload destroys refs, retaining the same browser authentication.
  const second = renderHook(useGoals);
  await waitFor(() => expect(second.result.current.status).toBe("success"));
  expect(second.result.current.pending).toMatchObject({ key: originalKey, reloaded: true });
  await act(async () => { await second.result.current.create(body); await second.result.current.retry(); });
  expect(goals.executeGoalCommand).toHaveBeenCalledTimes(1);
  expect(persisted.size).toBe(1);
  const marker = JSON.parse(sessionStorage.getItem("junta_uncertain_goal"));
  expect(Object.keys(marker).sort()).toEqual(["key", "session"]);
  expect(marker.key).toBe(originalKey);
  act(() => second.result.current.discardUncertain());
  expect(second.result.current.pending).toBeNull();
  expect(sessionStorage.getItem("junta_uncertain_goal")).toBeNull();
});

it("blocks a second contribution after chat response loss and remount", async () => {
  const conversation = { id: "synthetic-conversation", title: null, updatedAt: "2026-10-26T15:00:00Z" };
  const completed = new Map(); let cents = 0; let loseResponse = true;
  chat.listConversations.mockResolvedValue([conversation]); chat.listMessages.mockResolvedValue([]);
  chat.sendMessage.mockImplementation(async (_id, text, key) => {
    if (!completed.has(key)) {
      cents += 20000;
      completed.set(key, { actionExecuted: true, userMessage: { id: key + "-user", role: "USER", content: text },
        assistantMessage: { id: key + "-reply", role: "ASSISTANT", content: "Confirmado" } });
      chat.listMessages.mockResolvedValue([completed.get(key).userMessage, completed.get(key).assistantMessage]);
    }
    if (loseResponse) { loseResponse = false; throw new Error("Committed, response lost"); }
    return completed.get(key);
  });
  const first = renderHook(() => useAssistantConversation());
  await waitFor(() => expect(first.result.current.loading).toBe(false));
  const text = "Guardei 200 reais para viagem";
  await act(async () => first.result.current.handleSubmit(text));
  expect(first.result.current.recovery).not.toBeNull(); expect(cents).toBe(20000);
  const originalKey = chat.sendMessage.mock.calls[0][2]; first.unmount();
  const second = renderHook(() => useAssistantConversation());
  await waitFor(() => expect(second.result.current.loading).toBe(false));
  expect(second.result.current.messages).toHaveLength(2);
  expect(second.result.current.recovery.reloaded).toBe(true);
  await act(async () => { await second.result.current.handleSubmit(text); await second.result.current.retryMessage(); });
  expect(chat.sendMessage).toHaveBeenCalledTimes(1); expect(cents).toBe(20000);
  expect(JSON.parse(sessionStorage.getItem("junta_uncertain_chat")).key).toBe(originalKey);
  await act(async () => second.result.current.acknowledgeUncertain());
  expect(second.result.current.recovery).toBeNull();
  expect(sessionStorage.getItem("junta_uncertain_chat")).toBeNull();
});
