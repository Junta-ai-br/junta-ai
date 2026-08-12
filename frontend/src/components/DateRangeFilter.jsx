import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
const PRESETS = [
  { label: "Hoje", start: "2026-08-12", end: "2026-08-12" },
  { label: "Esta semana", start: "2026-08-06", end: "2026-08-12" },
  { label: "Este m\xEAs", start: "2026-08-01", end: "2026-08-12" },
  { label: "M\xEAs passado", start: "2026-07-01", end: "2026-07-31" },
  { label: "\xDAltimos 3 meses", start: "2026-06-01", end: "2026-08-12" },
  { label: "Todo per\xEDodo", start: "2026-03-01", end: "2026-08-12" }
];
function formatLabel(range) {
  const preset = PRESETS.find((item) => item.start === range.start && item.end === range.end);
  if (preset) return preset.label;
  if (!range.start && !range.end) return "Todo per\xEDodo";
  const start = range.start ? range.start.split("-").reverse().join("/") : "in\xEDcio";
  const end = range.end ? range.end.split("-").reverse().join("/") : "fim";
  return `${start} \u2192 ${end}`;
}
function DateRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  useEffect(() => {
    const onDocumentMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);
  const apply = () => {
    onChange(draft);
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((current) => !current),
        className: "flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] px-4 py-2 text-sm text-[#aaa] transition hover:border-[#7c3aed] hover:text-white",
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm", children: "\u{1F4C5}" }),
          formatLabel(value),
          /* @__PURE__ */ jsx("span", { className: "ml-1 text-[10px] opacity-60", children: open ? "\u25B2" : "\u25BC" })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-[calc(100%+8px)] z-20 w-[300px] rounded-2xl border border-[#2e2e2e] bg-[#1a1a1a] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]", children: "Atalhos" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: PRESETS.map((preset) => {
          const active = draft.start === preset.start && draft.end === preset.end;
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setDraft({ start: preset.start, end: preset.end }),
              className: [
                "rounded-full border px-3 py-1 text-[11px] transition",
                active ? "border-[#7c3aed] bg-[#7c3aed33] text-[#c4b5fd]" : "border-[#2e2e2e] bg-[#111] text-[#888] hover:text-white"
              ].join(" "),
              children: preset.label
            },
            preset.label
          );
        }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "my-3 h-px bg-[#222]" }),
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]", children: "Per\xEDodo personalizado" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#666]", children: "Data inicial" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: draft.start,
                onChange: (event) => setDraft((current) => ({ ...current, start: event.target.value })),
                className: "w-full rounded-xl border border-[#2e2e2e] bg-[#111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7c3aed]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#666]", children: "Data final" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: draft.end,
                onChange: (event) => setDraft((current) => ({ ...current, end: event.target.value })),
                className: "w-full rounded-xl border border-[#2e2e2e] bg-[#111] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7c3aed]"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setOpen(false),
            className: "flex-1 rounded-xl border border-[#2e2e2e] bg-transparent px-3 py-2 text-sm text-[#666] transition hover:text-white",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: apply,
            className: "flex-1 rounded-xl border border-transparent bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] px-3 py-2 text-sm font-semibold text-white",
            children: "Aplicar"
          }
        )
      ] })
    ] })
  ] });
}
export {
  DateRangeFilter as default
};
