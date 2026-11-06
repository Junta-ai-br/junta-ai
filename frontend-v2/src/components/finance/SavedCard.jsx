import useSaved from "@/hooks/useSaved";
import { PiggyBank } from "lucide-react";
import { formatMoneyBRL } from "@/services/finance/signed-money";
import "./SavedCard.css";

export default function SavedCard({ waiting = false, variant = "default" }) {
  const saved = useSaved();
  return <article className={`saved-card ${variant === "summary" ? "assistant__summary-card assistant__summary-card--saved" : "finance-kpi"}`} aria-label="Guardado" aria-busy={waiting || saved.status === "loading"}>
    <div className={variant === "summary" ? "assistant__summary-icon" : "saved-card__icon"}><PiggyBank size={22} strokeWidth={1.8} aria-hidden="true" /></div>
    <span className={variant === "summary" ? "assistant__summary-label" : undefined} title="Total atual das metas · independente do mês">Guardado</span>
    <strong className={variant === "summary" ? "assistant__summary-value" : undefined}>{waiting || saved.status === "loading" ? "Carregando…" : saved.status === "ready" ? formatMoneyBRL(saved.value) : "Indisponível"}</strong>
    <small className="saved-card__description--hidden">Total atual das metas · independente do mês</small>
    {!waiting && saved.status === "ready" && saved.position && <dl className="saved-card__position">
      <div><dt>Saldo disponível</dt><dd>{!waiting && saved.status === "ready" && saved.position ? formatMoneyBRL(saved.position.availableBalance) : "Indisponível"}</dd></div>
      <div><dt>Total acompanhado</dt><dd>{!waiting && saved.status === "ready" && saved.position ? formatMoneyBRL(saved.position.totalTracked) : "Indisponível"}</dd></div>
    </dl>}
    {!waiting && saved.status === "ready" && !saved.position && <p>Saldo disponível e total acompanhado indisponíveis.</p>}
    {!waiting && saved.position?.reservationInconsistent && <p role="status">O dinheiro reservado supera o total registrado. Revise seus registros ou retire parte da reserva antes de guardar mais.</p>}
    {saved.status === "error" && !waiting && <button type="button" onClick={saved.reload}>Atualizar Guardado</button>}
  </article>;
}
