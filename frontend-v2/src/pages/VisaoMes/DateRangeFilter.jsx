import { useEffect, useRef, useState } from "react";

const PRESETS = [
  ["Este mês", "2026-08-01", "2026-08-31"],
  ["Mês passado", "2026-07-01", "2026-07-31"],
  ["Últimos 3 meses", "2026-06-01", "2026-08-31"],
  ["Todo período", "2026-03-01", "2026-08-31"],
];

export default function DateRangeFilter({ value, onChange, tokens }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const label = PRESETS.find(([, start, end]) => start === value.start && end === value.end)?.[0] || `${value.start} → ${value.end}`;
  return <div ref={ref} style={{ position: "relative" }}>
    <button type="button" onClick={() => { setDraft(value); setOpen((current) => !current); }} style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 8, color: tokens.textMuted, padding: "9px 12px", cursor: "pointer" }}>📅 {label} ▾</button>
    {open && <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 4, width: 280, padding: 16, background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 12, boxShadow: "0 16px 40px #0008" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>{PRESETS.map(([name, start, end]) => <button type="button" key={name} onClick={() => setDraft({ start, end })} style={{ border: `1px solid ${draft.start === start && draft.end === end ? "#7c3aed" : tokens.border}`, background: tokens.inputBg, color: tokens.textMuted, borderRadius: 16, padding: "5px 9px", cursor: "pointer" }}>{name}</button>)}</div>
      {["start", "end"].map((field) => <label key={field} style={{ display: "block", color: tokens.textMuted, fontSize: 12, marginBottom: 10 }}>{field === "start" ? "Data inicial" : "Data final"}<input type="date" value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} style={{ display: "block", width: "100%", marginTop: 4, padding: 8, background: tokens.inputBg, border: `1px solid ${tokens.border}`, color: tokens.text, borderRadius: 7 }} /></label>)}
      <button type="button" onClick={() => { onChange(draft); setOpen(false); }} style={{ width: "100%", border: 0, borderRadius: 7, background: "#7c3aed", color: "white", padding: 9, cursor: "pointer" }}>Aplicar</button>
    </div>}
  </div>;
}
