import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { RotateCcw } from "lucide-react";
import Onboarding from "@/components/Onboarding";
import ChatView from "@/components/ChatView";
import SummaryCards from "@/components/SummaryCards";
import GoalsPanel from "@/components/GoalsPanel";
import MiniDashboard from "@/components/MiniDashboard";
import HealthScore from "@/components/HealthScore";
import { useFinance } from "@/lib/useFinance";
import logo from "@/assets/grana-logo.png";
function Index() {
  const {
    state,
    messages,
    sendMessage,
    completeOnboarding,
    addGoal,
    deleteGoal,
    respondToSuggestion,
    respondToCategoryPick,
    respondToRecurringPick,
    respondToRecurringUpdate,
    resetAll
  } = useFinance();
  if (!state.user.onboarded) {
    return /* @__PURE__ */ jsx(Onboarding, { onComplete: completeOnboarding });
  }
  const handleReset = () => {
    if (confirm("Voltar ao in\xEDcio e apagar seus dados?")) resetAll();
  };
  return /* @__PURE__ */ jsxs("div", { className: "h-[100dvh] flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxs("header", { className: "px-5 md:px-8 pt-5 pb-4 flex items-center justify-between flex-shrink-0", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx("img", { src: logo, alt: "Grana.ai", className: "h-24 md:h-28 w-auto object-contain" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs md:text-sm text-muted-foreground hidden sm:block", children: (() => {
          const h = (/* @__PURE__ */ new Date()).getHours();
          const g = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
          const e = h < 12 ? "\u2600\uFE0F" : h < 18 ? "\u2615" : "\u{1F319}";
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            g,
            ", ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground font-medium", children: state.user.name }),
            " ",
            e
          ] });
        })() }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleReset,
            className: "text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1.5",
            "aria-label": "Voltar ao in\xEDcio",
            title: "Voltar ao in\xEDcio",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { size: 14 }),
              /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: "Reiniciar" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "px-5 md:px-8 flex-shrink-0", children: /* @__PURE__ */ jsx(SummaryCards, { state }) }),
    /* @__PURE__ */ jsxs("main", { className: "flex-1 min-h-0 px-5 md:px-8 py-4 md:py-5 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-10", children: [
      /* @__PURE__ */ jsx("section", { className: "md:col-span-7 min-h-0 bg-card rounded-2xl border border-border overflow-hidden flex flex-col", children: /* @__PURE__ */ jsx(
        ChatView,
        {
          messages,
          onSend: sendMessage,
          onSuggestionResponse: respondToSuggestion,
          onCategoryPick: respondToCategoryPick,
          onRecurringPick: respondToRecurringPick,
          onRecurringUpdate: respondToRecurringUpdate,
          userName: state.user.name
        }
      ) }),
      /* @__PURE__ */ jsxs("aside", { className: "md:col-span-3 min-h-0 flex flex-col gap-4 md:gap-5 overflow-y-auto scrollbar-hide", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[240px]", children: /* @__PURE__ */ jsx(GoalsPanel, { goals: state.goals, onAdd: addGoal, onDelete: deleteGoal }) }),
        /* @__PURE__ */ jsx(HealthScore, { state }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[240px]", children: /* @__PURE__ */ jsx(MiniDashboard, { state }) })
      ] })
    ] })
  ] });
}
export {
  Index as default
};
