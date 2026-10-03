import { motion } from "motion/react";
import { SendHorizontal } from "lucide-react";

import { CATEGORY_META } from "@/services/finance/store";

export default function AssistantConversation({
  messages = [],
  inputValue = "",
  setInputValue,
  isTyping = false,
  pendingExpense = null,
  categories = [],
  handleSubmit,
  registerExpense,
}) {
  return (
    <section
      className="assistant__conversation"
      aria-label="Conversa com o Junta.ai"
    >
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
                <p>{message.text}</p>
              </div>
            </motion.div>
          ))}

          {pendingExpense && (
            <div className="assistant__message assistant__message--assistant">
              <div className="assistant__message-bubble assistant__category-picker">
                {categories.filter((category) => category !== "Renda").map((category) => (
                  <button type="button" key={category} onClick={() => registerExpense(category)}>
                    {CATEGORY_META[category]?.icon || "💰"} {category}
                  </button>
                ))}
              </div>
            </div>
          )}

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

      <form className="assistant__composer" onSubmit={handleSubmit}>
        <input
          type="text"
          className="assistant__composer-input"
          placeholder="Digite uma mensagem..."
          aria-label="Mensagem"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
        />
        <button
          type="submit"
          className="assistant__composer-button"
          aria-label="Enviar mensagem"
          disabled={!inputValue.trim() || isTyping}
        >
          <SendHorizontal size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
