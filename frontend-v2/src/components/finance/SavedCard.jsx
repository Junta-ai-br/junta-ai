import useSaved from "@/hooks/useSaved";
import { formatMoneyBRL } from "@/services/finance/signed-money";
import "./SavedCard.css";

export default function SavedCard({ waiting = false }) {
  const saved = useSaved();
  return <article className="finance-kpi saved-card" aria-label="Guardado" aria-busy={waiting || saved.status === "loading"}>
    <span>Guardado</span>
    <strong>{waiting || saved.status === "loading" ? "Carregando…" : saved.status === "ready" ? formatMoneyBRL(saved.value) : "Indisponível"}</strong>
    <small>Total atual das metas · independente do mês</small>
    {saved.status === "error" && !waiting && <button type="button" onClick={saved.reload}>Atualizar Guardado</button>}
  </article>;
}
