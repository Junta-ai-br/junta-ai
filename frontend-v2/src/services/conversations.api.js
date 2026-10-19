import { api } from "./api";
import { getSessionSnapshot } from "./auth/session";
import { isTimestamp, isUuid } from "./financial-contracts";

const fail = (code) => Object.assign(new Error("Unexpected conversation contract or session."), { code });
const validConversation = (value) => isUuid(value?.id) && (value.title === null || typeof value.title === "string") && isTimestamp(value.updatedAt);
const validMessage = (value) => isUuid(value?.id) && ["USER", "ASSISTANT", "SYSTEM"].includes(value.role)
  && typeof value.content === "string" && isTimestamp(value.createdAt);
export const validChatInput = (text) => typeof text === "string" && text.length <= 2000 && [...text].some((char) => char.charCodeAt(0) > 32);
const path = (id) => { if (!isUuid(id)) throw fail("ERR_CHAT_REQUEST"); return `/conversations/${encodeURIComponent(id)}/messages`; };

async function request(method, url, { signal, generation = getSessionSnapshot()?.generation, ...options }, validate) {
  const guard = (data) => {
    if (!generation || getSessionSnapshot()?.generation !== generation) throw fail("SESSION_CHANGED");
    return data;
  };
  const response = await api.request({ ...options, method, url, requiresAuth: true, signal,
    transformRequest: [guard, ...api.defaults.transformRequest] });
  guard(null);
  if (response.status !== 200 || !validate(response.data)) throw fail("ERR_CHAT_RESPONSE");
  return response.data;
}

export const listConversations = (options = {}) => request("get", "/conversations", options,
  (value) => Array.isArray(value) && value.every(validConversation));
export const createConversation = (options = {}) => request("post", "/conversations", { ...options, data: {} }, validConversation);
export const listMessages = (id, options = {}) => request("get", path(id), options,
  (value) => Array.isArray(value) && value.every(validMessage));
export function sendMessage(id, message, key, options = {}) {
  if (!validChatInput(message) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw fail("ERR_CHAT_REQUEST");
  // The backend can make two AI calls; its default processing window is 60s.
  // A timeout never generates a new key or an automatic retry.
  return request("post", path(id), { ...options, data: { message }, headers: { "Idempotency-Key": key }, timeout: 65000 },
    (value) => value?.conversationId === id && typeof value.actionExecuted === "boolean"
      && validMessage(value.userMessage) && value.userMessage.role === "USER"
      && validMessage(value.assistantMessage) && value.assistantMessage.role === "ASSISTANT");
}
