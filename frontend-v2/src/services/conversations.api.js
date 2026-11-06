import { api } from "./api";
import { getSessionSnapshot } from "./auth/session";
import { isTimestamp, isUuid } from "./financial-contracts";

const fail = (code) => Object.assign(new Error("Unexpected conversation contract or session."), { code });
const validConversation = (value) => isUuid(value?.id) && (value.title === null || typeof value.title === "string") && isTimestamp(value.updatedAt);
export const quickReplyLabels = Object.freeze({ source_registered: "Já está no meu saldo", source_unregistered: "Ainda não registrei", confirm: "Confirmar", cancel: "Cancelar" });
export const quickReplyText = (option) => option.option_id.startsWith("goal:") ? option.option_id
  : ({ source_registered: "Sim, já registrei", source_unregistered: "Não, é dinheiro novo", confirm: "confirmo", cancel: "cancelar" })[option.option_id];
export const quickReplyLabel = (option) => quickReplyLabels[option.option_id] ?? option.display_label;
export const validQuickReply = (value) => !!value && isUuid(value.pending_id) && isUuid(value.conversation_id)
  && (Object.hasOwn(quickReplyLabels, value.option_id) || (typeof value.option_id === "string"
    && value.option_id.startsWith("goal:") && isUuid(value.option_id.slice(5))
    && typeof value.display_label === "string" && value.display_label.trim().length > 0 && value.display_label.length <= 150));
const validMessage = (value) => isUuid(value?.id) && ["USER", "ASSISTANT", "SYSTEM"].includes(value.role)
  && typeof value.content === "string" && isTimestamp(value.createdAt)
  && (value.quickReplies == null || (Array.isArray(value.quickReplies) && value.quickReplies.length <= 1000
    && value.quickReplies.every(validQuickReply)));
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
  const { quickReply, ...transport } = options;
  if (quickReply && (!validQuickReply(quickReply) || quickReply.conversation_id !== id)) throw fail("ERR_CHAT_REQUEST");
  if (!validChatInput(message) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw fail("ERR_CHAT_REQUEST");
  // The backend can make two AI calls; its default processing window is 60s.
  // A timeout never generates a new key or an automatic retry.
  return request("post", path(id), { ...transport, data: { message, ...(quickReply ? { quickReply } : {}) }, headers: { "Idempotency-Key": key }, timeout: 65000 },
    (value) => value?.conversationId === id && typeof value.actionExecuted === "boolean"
      && validMessage(value.userMessage) && value.userMessage.role === "USER"
      && validMessage(value.assistantMessage) && value.assistantMessage.role === "ASSISTANT");
}
