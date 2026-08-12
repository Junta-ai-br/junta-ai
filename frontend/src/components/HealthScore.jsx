import { jsx, jsxs } from "react/jsx-runtime";
import { HeartPulse } from "lucide-react";
import { computeHealthScore } from "@/lib/finance";
function HealthScore({ state }) {
  const { score, status, label, emoji, message } = computeHealthScore(state);
  const barColor = status === "healthy" ? "bg-success" : status === "attention" ? "bg-warning" : "bg-destructive";
  const textColor = status === "healthy" ? "text-success" : status === "attention" ? "text-warning" : "text-destructive";
  return /* @__PURE__ */ jsxs("div", { className: "bg-card rounded-2xl p-4 border border-border", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsx(HeartPulse, { size: 14, className: "text-primary" }),
      /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Sa\xFAde Financeira" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "font-heading text-2xl font-bold tabular-nums", children: score }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "/100" }),
      /* @__PURE__ */ jsxs("span", { className: `ml-auto text-xs font-medium ${textColor}`, children: [
        emoji,
        " ",
        label
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full h-1.5 rounded-full bg-muted overflow-hidden mb-3", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: `h-full ${barColor} transition-all duration-500`,
        style: { width: `${score}%` }
      }
    ) }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: message })
  ] });
}
export {
  HealthScore as default
};
