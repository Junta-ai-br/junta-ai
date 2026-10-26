import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { importPlannerGoal } from "@/services/planner/goal-import";
import { requirePlannerSession, assertPlannerSession, plannerErrorMessage } from "@/services/planner/session";
import { normalizeMoney } from "@/services/financial-contracts";
import { formatMoneyBRL } from "@/services/finance/signed-money";

export default function PlannerGoalImport({ simulation, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [confirmReimport, setConfirmReimport] = useState(false);
  const [requiresReimport, setRequiresReimport] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [imported, setImported] = useState(false);
  const operation = useRef(null);
  const active = useRef(true);
  const lock = useRef(false);
  const controller = useRef(null);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; controller.current?.abort(); };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!active.current || lock.current || imported || disabled || (requiresReimport && !confirmReimport)) return;
    lock.current = true; setBusy(true); setNotice(null);
    try {
      if (!operation.current) operation.current = { key: crypto.randomUUID(), generation: requirePlannerSession(),
        body: { deadline: deadline || null, confirmReimport } };
      const attempt = operation.current;
      assertPlannerSession(attempt.generation);
      controller.current = new AbortController();
      await importPlannerGoal(simulation.id, attempt.body, attempt.key, { signal: controller.current.signal, sessionGeneration: attempt.generation });
      if (!active.current) return;
      assertPlannerSession(attempt.generation);
      operation.current = null; setUncertain(false); setImported(true); setOpen(false);
      setNotice({ success: true, text: "Meta adicionada às suas metas." });
    } catch (error) {
      if (!active.current) return;
      const status = error?.response?.status;
      const reason = error?.response?.data?.mensagem;
      const terminal = (status >= 400 && status < 500 && status !== 408 && status !== 429)
        || ["SESSION_EXPIRED", "STALE_SESSION", "SESSION_CHANGED", "ERR_API_REQUEST"].includes(error?.code);
      if (terminal) { operation.current = null; setUncertain(false); }
      else setUncertain(true);
      if (reason === "simulation_reimport_confirmation_required") {
        setRequiresReimport(true);
        setNotice({ text: "A meta importada anteriormente foi excluída. Confirme abaixo se deseja criar uma nova meta." });
      } else if (reason === "simulation_already_imported") {
        setNotice({ text: "Esta simulação já foi importada e possui uma meta. Confira suas metas no Assistente." });
      } else if (status === 404 || status === 403) {
        setNotice({ text: "Simulação não encontrada ou indisponível para sua conta." });
      } else if (!terminal) {
        setNotice({ text: "Não foi possível confirmar a importação. Confira suas metas ou retome esta tentativa; ela usará a mesma chave." });
      } else setNotice({ text: plannerErrorMessage(error, "importar esta simulação") });
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }

  return <div className="planner-goal-import">
    {!open && <button type="button" className="planner-history-card__details" disabled={disabled || imported} onClick={() => setOpen(true)}>Adicionar às minhas metas</button>}
    {open && <form className="planner-goal-import__form" aria-label={`Importar ${simulation.goal.name} como meta`} onSubmit={submit}>
      <p>Adicionar <strong>{simulation.goal.name}</strong> às suas metas?</p>
      <p>Valor-alvo: <strong>{formatMoneyBRL(normalizeMoney(simulation.goal.amount))}</strong>. O progresso começará em zero.</p>
      <label>Vencimento (opcional)<input type="date" value={deadline} disabled={busy || uncertain} onChange={(event) => setDeadline(event.target.value)} /></label>
      {requiresReimport && <label className="planner-goal-import__consent"><input type="checkbox" checked={confirmReimport} disabled={busy || uncertain} onChange={(event) => setConfirmReimport(event.target.checked)} />Confirmo uma nova importação após a exclusão da meta anterior.</label>}
      <div className="planner-goal-import__buttons">
        <button type="submit" className="planner-history-card__details" disabled={disabled || busy || (requiresReimport && !confirmReimport)}>{busy ? "Importando…" : uncertain ? "Retomar importação" : "Confirmar importação"}</button>
        <button type="button" className="planner-history-card__details" disabled={busy || uncertain} onClick={() => { setOpen(false); setDeadline(""); setConfirmReimport(false); setNotice(null); }}>Cancelar</button>
      </div>
    </form>}
    {notice && <p role={notice.success ? "status" : "alert"}>{notice.text}</p>}
    {(notice || imported) && <Link to="/assistente">Ver minhas metas no Assistente</Link>}
  </div>;
}
