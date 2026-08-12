import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Target, X, Trash2 } from "lucide-react";
function formatCurrency(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function GoalsPanel({ goals, onAdd, onDelete }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    const a = parseFloat(amount.replace(",", "."));
    if (!n || !a || a <= 0) return;
    onAdd(n, a);
    setName("");
    setAmount("");
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-4 border border-border flex flex-col min-h-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Target, { size: 14, className: "text-primary" }),
        /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Minhas metas" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setOpen((o) => !o),
          className: "text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium",
          children: [
            open ? /* @__PURE__ */ jsx(X, { size: 14 }) : /* @__PURE__ */ jsx(Plus, { size: 14 }),
            open ? "Cancelar" : "Criar meta"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsxs(
      motion.form,
      {
        onSubmit: submit,
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: "auto" },
        exit: { opacity: 0, height: 0 },
        className: "space-y-2 mb-3 overflow-hidden",
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: "Ex: Viagem",
              className: "w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm", children: "R$" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  value: amount,
                  onChange: (e) => setAmount(e.target.value.replace(/[^\d.,]/g, "")),
                  placeholder: "0,00",
                  inputMode: "decimal",
                  className: "w-full bg-secondary text-foreground rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90",
                children: "Salvar"
              }
            )
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3 overflow-y-auto scrollbar-hide flex-1 min-h-0", children: [
      goals.length === 0 && !open && /* @__PURE__ */ jsxs("div", { className: "text-center py-6 px-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5", children: /* @__PURE__ */ jsx(Target, { size: 16, className: "text-primary" }) }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground font-medium mb-1", children: "Defina sua primeira meta" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: "Metas pequenas ajudam a manter o foco. Comece com algo simples como uma viagem ou reserva." }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setOpen(true),
            className: "mt-3 text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 12 }),
              " Criar meta"
            ]
          }
        )
      ] }),
      goals.map((goal) => {
        const progress = Math.min(100, goal.currentAmount / goal.targetAmount * 100);
        return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground font-medium truncate", children: goal.name }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onDelete(goal.id),
                className: "opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive",
                "aria-label": "Excluir meta",
                children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full bg-muted rounded-full h-1.5", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-1.5 rounded-full bg-gradient-to-r from-primary to-accent-blue transition-all",
              style: { width: `${progress}%` }
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: formatCurrency(goal.currentAmount) }),
            /* @__PURE__ */ jsx("span", { children: formatCurrency(goal.targetAmount) })
          ] })
        ] }, goal.id);
      })
    ] })
  ] });
}
export {
  GoalsPanel as default
};
