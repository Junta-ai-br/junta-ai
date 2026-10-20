import { Activity } from "lucide-react";
import { HEALTH_COLORS, HEALTH_INSUFFICIENT } from "@/services/finance/financeHealth";
import "./FinancialHealthCard.css";

/** Composition adapted from the approved landing health widget; no score calculation. */
export default function FinancialHealthCard({ health, onRetry }) {
  const value = health.status === "ready" ? health.value : null;
  const calculated = value?.status === "CALCULATED";
  const insufficient = value?.status === "INSUFFICIENT_DATA";
  const color = calculated ? HEALTH_COLORS[value.classification] : "var(--gray-400)";
  const label = calculated ? value.classification : insufficient ? "Em avaliação"
    : health.status === "loading" ? "Carregando" : "Indisponível";
  return <section className="assistant__widget assistant__widget--health financial-health" aria-label="Saúde financeira" style={{ "--health-color": color }}>
    <header className="financial-health__heading"><Activity size={22} aria-hidden="true" /><h2>Saúde financeira</h2></header>
    <div className="financial-health__top">
      <div><span className="financial-health__caption">Seu score</span>
        <div className="financial-health__score"><strong>{calculated ? value.score : "—"}</strong>{calculated && <span>/ 100</span>}</div>
      </div>
      <strong className="financial-health__status">{label}</strong>
    </div>
    <div className="financial-health__bar" {...(calculated ? { role: "progressbar", "aria-label": "Health Score", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": value.score } : { "aria-hidden": true })}>
      <span style={{ width: `${calculated ? value.score : insufficient ? 50 : 0}%` }} />
    </div>
    <div className="financial-health__scale"><span>Precisa de atenção</span><span>Saudável</span></div>
    {value && <p className="financial-health__caption">{value.from.split("-").reverse().join("/")} a {value.to.split("-").reverse().join("/")}</p>}
    <p className="financial-health__message" role="status">{insufficient ? HEALTH_INSUFFICIENT
      : calculated ? "Indicador educativo e simplificado de organização financeira. Não é score de crédito nem diagnóstico financeiro."
      : health.status === "loading" ? "Consultando o indicador oficial do mês…" : "Não foi possível confirmar o indicador atual."}</p>
    {health.status === "error" && <button type="button" onClick={onRetry}>Atualizar indicador</button>}
  </section>;
}
