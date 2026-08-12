import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import logo from "@/assets/grana-logo.png";
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [objective, setObjective] = useState("");
  const objectives = [
    "Economizar mais",
    "Sair das d\xEDvidas",
    "Investir",
    "Organizar gastos",
    "Realizar um sonho"
  ];
  const next = () => setStep((s) => s + 1);
  const finish = () => {
    onComplete({
      name: name.trim() || "Voc\xEA",
      monthlyIncome: income ? parseFloat(income.replace(",", ".")) : void 0,
      objective: objective || void 0
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 py-10", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md flex flex-col items-center", children: [
    /* @__PURE__ */ jsx(
      "img",
      {
        src: logo,
        alt: "Grana.ai",
        className: "w-56 md:w-64 h-auto object-contain mb-8 select-none",
        draggable: false
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        className: "w-full bg-card rounded-3xl p-7 md:p-8 border border-border",
        children: [
          step === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "font-heading text-2xl md:text-3xl font-bold tracking-tight", children: "Ol\xE1 \u{1F44B}" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mt-2 leading-relaxed", children: "Sua companheira financeira. Conversa simples, controle real." })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: next,
                className: "w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:opacity-90 transition flex items-center justify-center gap-2",
                children: [
                  "Come\xE7ar ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                ]
              }
            )
          ] }),
          step === 1 && /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-primary uppercase tracking-wider mb-2", children: "Passo 1 de 3" }),
              /* @__PURE__ */ jsx("h2", { className: "font-heading text-2xl font-bold", children: "Como voc\xEA se chama?" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                autoFocus: true,
                value: name,
                onChange: (e) => setName(e.target.value),
                placeholder: "Seu nome",
                className: "w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary",
                onKeyDown: (e) => e.key === "Enter" && name.trim() && next()
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: next,
                disabled: !name.trim(),
                className: "w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium disabled:opacity-30 transition flex items-center justify-center gap-2",
                children: [
                  "Continuar ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                ]
              }
            )
          ] }),
          step === 2 && /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-primary uppercase tracking-wider mb-2", children: "Passo 2 de 3" }),
              /* @__PURE__ */ jsx("h2", { className: "font-heading text-2xl font-bold", children: "Qual sua renda mensal?" }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Opcional, ajuda nos insights." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground", children: "R$" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  autoFocus: true,
                  type: "text",
                  inputMode: "decimal",
                  value: income,
                  onChange: (e) => setIncome(e.target.value.replace(/[^\d.,]/g, "")),
                  placeholder: "0,00",
                  className: "w-full bg-secondary text-foreground rounded-xl pl-10 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: next,
                  className: "flex-1 bg-secondary text-foreground rounded-xl py-3 font-medium hover:bg-muted transition",
                  children: "Pular"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: next,
                  className: "flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-medium transition flex items-center justify-center gap-2",
                  children: [
                    "Continuar ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                  ]
                }
              )
            ] })
          ] }),
          step === 3 && /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-primary uppercase tracking-wider mb-2", children: "Passo 3 de 3" }),
              /* @__PURE__ */ jsx("h2", { className: "font-heading text-2xl font-bold", children: "Qual seu objetivo?" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: objectives.map((obj) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setObjective(obj),
                className: `w-full text-left px-4 py-3 rounded-xl border transition ${objective === obj ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-foreground hover:border-primary/50"}`,
                children: obj
              },
              obj
            )) }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: finish,
                disabled: !objective,
                className: "w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium disabled:opacity-30 transition flex items-center justify-center gap-2",
                children: [
                  "Entrar no app ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                ]
              }
            )
          ] })
        ]
      },
      step
    )
  ] }) });
}
export {
  Onboarding as default
};
