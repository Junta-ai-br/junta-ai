import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/services/auth/session";
import * as conversations from "@/services/conversations.api";
import { readAttempt, startAttempt, finishAttempt } from "@/services/uncertain-attempt";

const generation = () => getSessionSnapshot()?.generation ?? null;
const empty = (owner) => ({ owner, inputValue: "", messages: [], conversations: [], conversationId: null, loading: true, isTyping: false, error: null, recovery: null });
const bubble = (message, fresh = false) => ({ id: message.id, type: message.role.toLowerCase(), text: message.content, fresh });
const history = (messages) => messages.filter((message) => message.role !== "SYSTEM").map((message) => bubble(message));
const errorMessage = (error, sending) => {
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error?.code)) return "O tempo de espera terminou. O servidor pode ter processado a mensagem. Retome o envio anterior com a mesma identidade.";
  if (error?.response?.data?.code === "message_processing_in_progress") return "O envio anterior ainda está em processamento. Aguarde e retome-o manualmente.";
  if (error?.response?.data?.code === "message_processing_failed") return "A IA não conseguiu processar esta mensagem. Nenhuma execução foi confirmada nesta resposta.";
  if (error?.response?.status === 403) return "Você não tem permissão para acessar esta conversa.";
  if (error?.response?.status === 404) return "Conversa não encontrada. Atualize o histórico.";
  return sending ? "Não foi possível confirmar a resposta do assistente. Nenhuma resposta ou execução financeira será simulada." : "Não foi possível carregar o histórico. Verifique a conexão com o servidor.";
};

export default function useAssistantConversation({ refreshFinancialData } = {}) {
  const owner = useSyncExternalStore(subscribeSession, generation);
  const [state, setState] = useState(() => empty(owner));
  const active = useRef(null);
  const lock = useRef(false);
  const recovery = useRef(null);
  const current = (lease) => active.current === lease && generation() === lease?.owner && !lease.controller.signal.aborted;
  const options = (lease) => ({ signal: lease.controller.signal, generation: lease.owner });

  useEffect(() => {
    const restored = readAttempt("chat", owner);
    const lease = { owner, controller: new AbortController(), conversationId: null, historyLoaded: false };
    active.current = lease; lock.current = true; recovery.current = restored ? { key: restored, reloaded: true } : null;
    setState({ ...empty(owner), recovery: recovery.current });
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
            lease.historyLoaded = true;
            setState({ ...empty(owner), recovery: recovery.current, loading: false, conversations: list, conversationId: id, messages: history(messages) });
          }
        } catch (error) {
          if (current(lease)) setState({ ...empty(owner), recovery: recovery.current, loading: false, error: errorMessage(error, false) });
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
        lease.historyLoaded = true;
        if (recovery.current?.creationUnknown) recovery.current = null;
        setState((value) => ({ ...value, loading: false, inputValue: recovery.current ? value.inputValue : "", recovery: recovery.current, conversations: list, conversationId: selected, messages: history(messages) }));
      }
    } catch (error) { if (current(lease)) setState((value) => ({ ...value, loading: false, error: errorMessage(error, false) })); }
    finally { if (current(lease)) lock.current = false; }
  };

  const send = async (message, retry = false) => {
    const lease = active.current;
    if (!lease || lease.owner !== owner || !current(lease) || lock.current || recovery.current?.reloaded || (!retry && recovery.current) || (retry && !recovery.current?.key)) return;
    if (!retry && !conversations.validChatInput(message)) {
      setState((value) => ({ ...value, error: "Informe uma mensagem não vazia de até 2000 caracteres." })); return;
    }
    lock.current = true;
    const optimisticId = retry ? recovery.current.optimisticId : `pending-${crypto.randomUUID()}`;
    setState((value) => ({ ...value, isTyping: true, error: null,
      inputValue: "",
      messages: retry ? value.messages : [...value.messages, { id: optimisticId, type: "user", text: message, fresh: true }],
    }));
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
        operation = { id, message, key: crypto.randomUUID(), optimisticId };
      }
      if (!current(lease)) return;
      if (!startAttempt("chat", operation.key, lease.owner)) throw Object.assign(new Error("Attempt not sent"), { code: "ATTEMPT_NOT_SENT" });
      recovery.current = operation;
      const reply = await conversations.sendMessage(operation.id, operation.message, operation.key, options(lease));
      if (!current(lease)) return;
      finishAttempt("chat", operation.key, lease.owner);
      // Replays can report actionExecuted=false even when the original request committed.
      // Reconcile every successful message response before exposing current finances.
      recovery.current = null;
      setState((value) => ({ ...value, inputValue: "", recovery: null, isTyping: false, isReconciling: true,
        messages: [...value.messages.filter((item) => ![operation.optimisticId, reply.userMessage.id, reply.assistantMessage.id].includes(item.id)),
          bubble(reply.userMessage, !value.messages.some((item) => item.id === reply.userMessage.id)),
          { ...bubble(reply.assistantMessage, !value.messages.some((item) => item.id === reply.assistantMessage.id)), executionConfirmed: reply.actionExecuted }] }));
      try { await refreshFinancialData?.(); }
      catch {
        if (current(lease)) setState((value) => ({ ...value, error: "A resposta foi recebida, mas não foi possível atualizar os dados financeiros. Atualize os dados antes de consultar os totais." }));
      }
    } catch (error) {
      if (!current(lease)) return;
      const code = error?.response?.data?.code;
      const notSent = error?.code === "ATTEMPT_NOT_SENT";
      const terminal = notSent || code === "message_processing_failed" || [400, 403, 404].includes(error?.response?.status);
      // Unknown outcomes retain the exact key/body. Failed creation must be
      // reconciled with the conversation list before another POST /conversations.
      if (terminal && operation) {
        try { await refreshFinancialData?.(); } catch { /* Preserve the original send failure and recovery state. */ }
        if (!current(lease)) return;
      }
      recovery.current = terminal ? null : operation ?? { creationUnknown: true };
      if (terminal && operation) finishAttempt("chat", operation.key, lease.owner);
      setState((value) => ({ ...value, recovery: recovery.current, error: notSent ? "Não foi possível preservar a tentativa. A mensagem não foi enviada. Atualize a página e confira suas metas." : errorMessage(error, true) }));
    } finally {
      if (current(lease)) { lock.current = false; setState((value) => ({ ...value, isTyping: false, isReconciling: false })); }
    }
  };

  const view = state.owner === owner ? state : empty(owner);
  const publicView = { ...view };
  delete publicView.owner;
  return { ...publicView, recovery: view.recovery ? { creationUnknown: !!view.recovery.creationUnknown, reloaded: !!view.recovery.reloaded } : null,
    inputValue: owner ? view.inputValue : "", messages: owner ? view.messages : [],
    setInputValue: (inputValue) => { if (owner && generation() === owner && active.current?.owner === owner) setState((value) => ({ ...value, inputValue })); },
    handleSubmit: (event) => { event?.preventDefault?.(); return send(typeof event === "string" ? event : view.inputValue); },
    retryMessage: () => send(null, true),
    acknowledgeUncertain: async () => {
      const lease = active.current;
      if (!current(lease) || lease.owner !== owner || lock.current || !lease.historyLoaded || !recovery.current?.reloaded) return;
      const key = recovery.current.key;
      lock.current = true;
      try {
        await refreshFinancialData?.();
        if (!current(lease)) return;
        finishAttempt("chat", key, lease.owner); recovery.current = null;
        setState((value) => ({ ...value, recovery: null, error: null }));
      } catch { if (current(lease)) setState((value) => ({ ...value, error: "Não foi possível atualizar suas metas. Confira os dados antes de encerrar o aviso." })); }
      finally { if (current(lease)) lock.current = false; }
    },
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
    canSend: !!owner && !view.loading && !view.isTyping && !view.isReconciling && !view.recovery && conversations.validChatInput(view.inputValue),
  };
}
