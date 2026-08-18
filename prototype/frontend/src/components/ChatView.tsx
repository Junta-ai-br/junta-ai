import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/lib/useFinance';

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onSuggestionResponse?: (messageId: string, accept: boolean) => void;
  onCategoryPick?: (messageId: string, category: string) => void;
  onRecurringPick?: (messageId: string, accept: boolean) => void;
  onRecurringUpdate?: (messageId: string, accept: boolean) => void;
  userName?: string;
}

const SUGGESTIONS = [
  'Gastei 30 no almoço',
  'Recebi 2000 de salário',
  'Guardei 100 para viagem',
  'Quanto gastei este mês?',
];

export default function ChatView({ messages, onSend, onSuggestionResponse, onCategoryPick, onRecurringPick, onRecurringUpdate, userName }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
          <Sparkles size={14} className="text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground leading-none">Assistente</p>
          <p className="text-[10px] text-success mt-1">● online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-chat-user text-chat-user-foreground rounded-br-md'
                    : 'bg-chat-ai text-chat-ai-foreground rounded-bl-md'
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>

                {msg.suggestion && !msg.suggestion.answered && onSuggestionResponse && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onSuggestionResponse(msg.id, true)}
                      className="flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> Sim, guardar
                    </button>
                    <button
                      onClick={() => onSuggestionResponse(msg.id, false)}
                      className="flex-1 bg-secondary text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-1"
                    >
                      <X size={12} /> Agora não
                    </button>
                  </div>
                )}

                {msg.categoryPick && !msg.categoryPick.answered && onCategoryPick && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {msg.categoryPick.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => onCategoryPick(msg.id, opt)}
                        className="text-xs bg-secondary hover:bg-muted text-foreground rounded-full px-2.5 py-1 transition border border-border"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {msg.recurringPick && !msg.recurringPick.answered && onRecurringPick && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onRecurringPick(msg.id, true)}
                      className="flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> Sim, registrar
                    </button>
                    <button
                      onClick={() => onRecurringPick(msg.id, false)}
                      className="flex-1 bg-secondary text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-1"
                    >
                      <X size={12} /> Agora não
                    </button>
                  </div>
                )}

                {msg.recurringUpdate && !msg.recurringUpdate.answered && onRecurringUpdate && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onRecurringUpdate(msg.id, true)}
                      className="flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> Sim, atualizar
                    </button>
                    <button
                      onClick={() => onRecurringUpdate(msg.id, false)}
                      className="flex-1 bg-secondary text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-1"
                    >
                      <X size={12} /> Manter
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {showSuggestions && (
          <div className="pt-2 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1">
              Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-xs bg-secondary hover:bg-muted text-foreground rounded-full px-3 py-1.5 transition border border-border"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-2 bg-secondary/60 border border-border rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-primary/50 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={userName ? `Conta pra mim, ${userName}...` : 'Digite uma mensagem...'}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none py-1.5"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-30 transition-opacity hover:opacity-90 flex-shrink-0"
            aria-label="Enviar mensagem"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
