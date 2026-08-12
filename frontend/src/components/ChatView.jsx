import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
const SUGGESTIONS = [
  "Gastei 30 no almo\xE7o",
  "Recebi 2000 de sal\xE1rio",
  "Guardei 100 para viagem",
  "Quanto gastei este m\xEAs?"
];
function ChatView({ messages, onSend, onSuggestionResponse, onCategoryPick, onRecurringPick, onRecurringUpdate, userName }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };
  const showSuggestions = messages.length <= 1;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full min-h-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-5 py-3.5 border-b border-border flex items-center gap-2.5 flex-shrink-0", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { size: 14, className: "text-primary-foreground" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-foreground leading-none", children: "Assistente" }),
        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-success mt-1", children: "\u25CF online" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-hide min-h-0", children: [
      /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: messages.map((msg) => /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.2 },
          className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`,
          children: /* @__PURE__ */ jsxs(
            "div",
            {
              className: `max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-chat-user text-chat-user-foreground rounded-br-md" : "bg-chat-ai text-chat-ai-foreground rounded-bl-md"}`,
              children: [
                /* @__PURE__ */ jsx(
                  ReactMarkdown,
                  {
                    components: {
                      p: ({ children }) => /* @__PURE__ */ jsx("p", { className: "mb-1 last:mb-0", children }),
                      strong: ({ children }) => /* @__PURE__ */ jsx("strong", { className: "font-semibold text-primary", children })
                    },
                    children: msg.content
                  }
                ),
                msg.suggestion && !msg.suggestion.answered && onSuggestionResponse && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => onSuggestionResponse(msg.id, true),
                      className: "flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(Check, { size: 12 }),
                        " Sim, guardar"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => onSuggestionResponse(msg.id, false),
                      className: "flex-1 bg-secondary text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(X, { size: 12 }),
                        " Agora n\xE3o"
                      ]
                    }
                  )
                ] }),
                msg.categoryPick && !msg.categoryPick.answered && onCategoryPick && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mt-3", children: msg.categoryPick.options.map((opt) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => onCategoryPick(msg.id, opt),
                    className: "text-xs bg-secondary hover:bg-muted text-foreground rounded-full px-2.5 py-1 transition border border-border",
                    children: opt
                  },
                  opt
                )) }),
                msg.recurringPick && !msg.recurringPick.answered && onRecurringPick && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => onRecurringPick(msg.id, true),
                      className: "flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(Check, { size: 12 }),
                        " Sim, registrar"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => onRecurringPick(msg.id, false),
                      className: "flex-1 bg-secondary text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(X, { size: 12 }),
                        " Agora n\xE3o"
                      ]
                    }
                  )
                ] }),
                msg.recurringUpdate && !msg.recurringUpdate.answered && onRecurringUpdate && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-3", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => onRecurringUpdate(msg.id, true),
                      className: "flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(Check, { size: 12 }),
                        " Sim, atualizar"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => onRecurringUpdate(msg.id, false),
                      className: "flex-1 bg-secondary text-foreground rounded-lg py-1.5 text-xs font-medium hover:bg-muted transition flex items-center justify-center gap-1",
                      children: [
                        /* @__PURE__ */ jsx(X, { size: 12 }),
                        " Manter"
                      ]
                    }
                  )
                ] })
              ]
            }
          )
        },
        msg.id
      )) }),
      showSuggestions && /* @__PURE__ */ jsxs("div", { className: "pt-2 space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1", children: "Sugest\xF5es" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: SUGGESTIONS.map((s) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onSend(s),
            className: "text-xs bg-secondary hover:bg-muted text-foreground rounded-full px-3 py-1.5 transition border border-border",
            children: s
          },
          s
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: bottomRef })
    ] }),
    /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "px-4 py-3 border-t border-border flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-secondary/60 border border-border rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-primary/50 transition-colors", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          value: input,
          onChange: (e) => setInput(e.target.value),
          placeholder: userName ? `Conta pra mim, ${userName}...` : "Digite uma mensagem...",
          className: "flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none py-1.5"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: !input.trim(),
          className: "p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-30 transition-opacity hover:opacity-90 flex-shrink-0",
          "aria-label": "Enviar mensagem",
          children: /* @__PURE__ */ jsx(Send, { size: 14 })
        }
      )
    ] }) })
  ] });
}
export {
  ChatView as default
};
