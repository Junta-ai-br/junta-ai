import { motion } from "motion/react";
import { SendHorizontal } from "lucide-react";

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
      {error && <div role="alert"><p>{error}</p>{recovery && !recovery.creationUnknown && <button type="button" disabled={isTyping} onClick={retryMessage}>Retomar envio anterior</button>}
        {recovery?.creationUnknown && <p>Atualize o histórico antes de iniciar outra conversa; a criação pode ter sido processada.</p>}</div>}
      <div className="assistant__conversation-content">
        <div className="assistant__messages">
          {messages.length === 0 && !isTyping && (
            <div className="assistant__empty-state">
              <div className="assistant__empty-icon">
                <img src="/src/assets/logos/logo-icon.svg" alt="" />
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="assistant__message-bubble">
                {message.type === "assistant" && (
                  <span className="assistant__message-brand" aria-hidden="true">
                    <img src="/src/assets/logos/logo-icon.svg" alt="" />
                  </span>
                )}
                <p style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                {message.executionConfirmed === true && <p role="status">O backend confirmou a execução desta operação. Consulte os lançamentos reais na Visão do mês.</p>}
                {message.executionConfirmed === false && <p>Esta resposta não confirma uma nova execução financeira.</p>}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              className="assistant__message assistant__message--assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="assistant__message-bubble assistant__message-bubble--typing">
                <span className="assistant__message-brand" aria-hidden="true">
                  <img src="/src/assets/logos/logo-icon.svg" alt="" />
                </span>
                <span className="assistant__typing" aria-label="Junta.ai está digitando">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {selectConversation && <p>Conversa conectada ao servidor. Os cartões de demonstração não são atualizados por este chat. O histórico textual, sozinho, não comprova execução financeira.</p>}

      <form className="assistant__composer" onSubmit={handleSubmit}>
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
