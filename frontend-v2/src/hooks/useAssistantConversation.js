import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/services/auth/session";
import * as conversations from "@/services/conversations.api";

const generation = () => getSessionSnapshot()?.generation ?? null;
const empty = (owner) => ({ owner, inputValue: "", messages: [], conversations: [], conversationId: null, loading: true, isTyping: false, error: null, recovery: null });
const bubble = (message) => ({ id: message.id, type: message.role.toLowerCase(), text: message.content });
const history = (messages) => messages.filter((message) => message.role !== "SYSTEM").map(bubble);
const errorMessage = (error, sending) => {
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error?.code)) return "O tempo de espera terminou. O servidor pode ter processado a mensagem. Retome o envio anterior com a mesma identidade.";
  if (error?.response?.data?.code === "message_processing_in_progress") return "O envio anterior ainda está em processamento. Aguarde e retome-o manualmente.";
  if (error?.response?.data?.code === "message_processing_failed") return "A IA não conseguiu processar esta mensagem. Nenhuma execução foi confirmada nesta resposta.";
  if (error?.response?.status === 403) return "Você não tem permissão para acessar esta conversa.";
  if (error?.response?.status === 404) return "Conversa não encontrada. Atualize o histórico.";
  return sending ? "Não foi possível confirmar a resposta do assistente. Nenhuma resposta ou execução financeira será simulada." : "Não foi possível carregar o histórico. Verifique a conexão com o servidor.";
};

export default function useAssistantConversation() {
  const owner = useSyncExternalStore(subscribeSession, generation);
  const [state, setState] = useState(() => empty(owner));
  const active = useRef(null);
  const lock = useRef(false);
  const recovery = useRef(null);
  const current = (lease) => active.current === lease && generation() === lease?.owner && !lease.controller.signal.aborted;
  const options = (lease) => ({ signal: lease.controller.signal, generation: lease.owner });

  useEffect(() => {
    const lease = { owner, controller: new AbortController(), conversationId: null };
    active.current = lease; lock.current = true; recovery.current = null;
    setState(empty(owner));
    if (!owner) { lock.current = false; setState({ ...empty(owner), loading: false }); }
    else {
      (async () => {
        try {
          const list = await conversations.listConversations(options(lease));
          if (!current(lease)) return;
          const id = list[0]?.id ?? null;
          const messages = id ? await conversations.listMessages(id, options(lease)) : [];
          if (current(lease)) {
            lease.conversationId = id;
            setState({ ...empty(owner), loading: false, conversations: list, conversationId: id, messages: history(messages) });
          }
        } catch (error) {
          if (current(lease)) setState({ ...empty(owner), loading: false, error: errorMessage(error, false) });
        } finally { if (current(lease)) lock.current = false; }
      })();
    }
    return () => {
      if (active.current === lease) { active.current = null; recovery.current = null; }
      lease.controller.abort();
    };
  }, [owner]);

  const selectConversation = async (id, refreshing = false) => {
    const lease = active.current;
    if (!lease || lease.owner !== owner || !current(lease) || lock.current || (recovery.current && !refreshing)) return;
    lock.current = true;
    setState((value) => ({ ...value, loading: true, error: null }));
    try {
      const list = await conversations.listConversations(options(lease));
      if (!current(lease)) return;
      const selected = id === undefined ? lease.conversationId ?? list[0]?.id ?? null : id;
      const messages = selected ? await conversations.listMessages(selected, options(lease)) : [];
      if (current(lease)) {
        lease.conversationId = selected;
        if (recovery.current?.creationUnknown) recovery.current = null;
        setState((value) => ({ ...value, loading: false, inputValue: recovery.current ? value.inputValue : "", recovery: recovery.current, conversations: list, conversationId: selected, messages: history(messages) }));
      }
    } catch (error) { if (current(lease)) setState((value) => ({ ...value, loading: false, error: errorMessage(error, false) })); }
    finally { if (current(lease)) lock.current = false; }
  };

  const send = async (message, retry = false) => {
    const lease = active.current;
    if (!lease || lease.owner !== owner || !current(lease) || lock.current || (!retry && recovery.current) || (retry && !recovery.current?.key)) return;
    if (!retry && !conversations.validChatInput(message)) {
      setState((value) => ({ ...value, error: "Informe uma mensagem não vazia de até 2000 caracteres." })); return;
    }
    lock.current = true;
    setState((value) => ({ ...value, isTyping: true, error: null }));
    let operation = retry ? recovery.current : null;
    try {
      if (!operation) {
        let id = lease.conversationId;
        if (!id) {
          const created = await conversations.createConversation(options(lease));
          if (!current(lease)) return;
          id = created.id;
          lease.conversationId = id;
          setState((value) => ({ ...value, conversationId: id, conversations: [created, ...value.conversations] }));
        }
        operation = { id, message, key: crypto.randomUUID() };
      }
      if (!current(lease)) return;
      recovery.current = operation;
      const reply = await conversations.sendMessage(operation.id, operation.message, operation.key, options(lease));
      if (!current(lease)) return;
      recovery.current = null;
      setState((value) => ({ ...value, inputValue: "", recovery: null,
        messages: [...value.messages.filter((item) => ![reply.userMessage.id, reply.assistantMessage.id].includes(item.id)),
          bubble(reply.userMessage), { ...bubble(reply.assistantMessage), executionConfirmed: reply.actionExecuted }] }));
    } catch (error) {
      if (!current(lease)) return;
      const code = error?.response?.data?.code;
      const terminal = code === "message_processing_failed" || [400, 403, 404].includes(error?.response?.status);
      // Unknown outcomes retain the exact key/body. Failed creation must be
      // reconciled with the conversation list before another POST /conversations.
      recovery.current = terminal ? null : operation ?? { creationUnknown: true };
      setState((value) => ({ ...value, recovery: recovery.current, error: errorMessage(error, true) }));
    } finally {
      if (current(lease)) { lock.current = false; setState((value) => ({ ...value, isTyping: false })); }
    }
  };

  const view = state.owner === owner ? state : empty(owner);
  const publicView = { ...view };
  delete publicView.owner;
  return { ...publicView, recovery: view.recovery ? { creationUnknown: !!view.recovery.creationUnknown } : null,
    inputValue: owner ? view.inputValue : "", messages: owner ? view.messages : [],
    setInputValue: (inputValue) => { if (owner && generation() === owner && active.current?.owner === owner) setState((value) => ({ ...value, inputValue })); },
    handleSubmit: (event) => { event?.preventDefault?.(); return send(typeof event === "string" ? event : view.inputValue); },
    retryMessage: () => send(null, true),
    selectConversation,
    refreshHistory: () => {
      if (generation() !== owner) return;
      return selectConversation(undefined, true);
    },
    newConversation: () => {
      if (generation() === owner && active.current?.owner === owner && !lock.current && !recovery.current) {
        active.current.conversationId = null;
        setState((value) => ({ ...value, conversationId: null, messages: [], inputValue: "", error: null }));
      }
    },
    canSend: !!owner && !view.loading && !view.isTyping && !view.recovery && conversations.validChatInput(view.inputValue),
  };
}
