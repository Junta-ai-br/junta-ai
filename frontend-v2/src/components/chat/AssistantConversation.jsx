import { useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SendHorizontal } from "lucide-react";
import logoIcon from "@/assets/logos/logo-icon.svg";

export default function AssistantConversation({
  messages = [],
  inputValue = "",
  setInputValue,
  isTyping = false,
  handleSubmit,
  loading = false,
  error = null,
  recovery = null,
  conversations = [],
  conversationId = null,
  selectConversation,
  newConversation,
  refreshHistory,
  retryMessage,
  canSend,
}) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef(null);
  const followEnd = useRef(true);
  const previousView = useRef(null);

  useLayoutEffect(() => {
    if (loading) return;
    const container = scrollRef.current;
    const previous = previousView.current;
    const lastId = messages.at(-1)?.id;
    // Loading another history starts at its end. Creating a conversation during
    // a send must not override a reader who scrolled up while awaiting a reply.
    const openedHistory = !previous || (previous.conversationId !== conversationId && !isTyping && !previous.isTyping);
    if (openedHistory) followEnd.current = true;
    const contentChanged = openedHistory || previous?.lastId !== lastId || previous?.isTyping !== isTyping;
    if (container && contentChanged && followEnd.current) {
      // Update only this viewport, before paint. Instant positioning avoids
      // competing smooth-scroll animations and also respects reduced motion.
      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    }
    previousView.current = { conversationId, lastId, isTyping };
  }, [messages, conversationId, isTyping, loading]);

  const trackReadingPosition = () => {
    const container = scrollRef.current;
    if (container) {
      followEnd.current = container.scrollHeight - container.clientHeight - container.scrollTop <= 64;
    }
  };
  return (
    <section
      className="assistant__conversation"
      aria-label="Conversa com o Junta.ai"
    >
      {selectConversation && <div className="assistant__conversation-tools">
        <label>Conversa<select aria-label="Conversa" value={conversationId ?? ""} disabled={loading || isTyping || !!recovery}
          onChange={(event) => selectConversation(event.target.value || null)}>
          <option value="">Nova conversa</option>
          {conversations.map((item) => <option key={item.id} value={item.id}>{item.title || "Conversa sem título"} · {item.updatedAt}</option>)}
        </select></label>
        <button type="button" disabled={loading || isTyping || !!recovery} onClick={newConversation}>Nova conversa</button>
        <button type="button" disabled={loading || isTyping} onClick={refreshHistory}>Atualizar histórico</button>
      </div>}
      {loading && <p role="status">Carregando histórico persistido…</p>}
      {(error || recovery) && <div role="alert">{error && <p>{error}</p>}{recovery && !recovery.creationUnknown && <button type="button" disabled={isTyping} onClick={retryMessage}>Retomar envio anterior</button>}
        {recovery?.creationUnknown && <p>Atualize o histórico antes de iniciar outra conversa; a criação pode ter sido processada.</p>}</div>}
      <div className="assistant__conversation-content" ref={scrollRef} onScroll={trackReadingPosition}>
        <div className="assistant__messages">
          {messages.length === 0 && !isTyping && (
            <div className="assistant__empty-state">
              <div className="assistant__empty-icon">
                <img src={logoIcon} alt="" />
              </div>
              <h2>Vamos conversar sobre seu dinheiro?</h2>
              <p>
                Me conte sobre seus gastos, receitas ou objetivos. Eu posso ajudar você a entender melhor sua vida financeira.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`assistant__message assistant__message--${message.type}`}
              initial={message.fresh && !reduceMotion ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="assistant__message-bubble"
                data-execution={message.executionConfirmed === true ? "confirmed" : message.executionConfirmed === false ? "unconfirmed" : undefined}
              >
                {message.type === "assistant" && (
                  <span className="assistant__message-brand">
                    <img src={logoIcon} alt="" width="20" height="20" /> Junta.ai
                  </span>
                )}
                <p style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <div
              className="assistant__message assistant__message--assistant"
            >
              <div className="assistant__processing" role="status" aria-live="polite" aria-atomic="true">
                <img className="assistant__processing-icon" src={logoIcon} alt="" width="20" height="20" />
                <span>Junta.ai está digitando…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <form className="assistant__composer" onSubmitCapture={() => { followEnd.current = true; }} onSubmit={handleSubmit}>
        <input
          type="text"
          className="assistant__composer-input"
          placeholder="Digite uma mensagem..."
          aria-label="Mensagem"
          value={inputValue}
          maxLength={2000}
          disabled={loading || isTyping || !!recovery}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button
          type="submit"
          className="assistant__composer-button"
          aria-label="Enviar mensagem"
          disabled={canSend === undefined ? !inputValue.trim() || isTyping : !canSend}
        >
          <SendHorizontal size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
