import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { decimalToCents, formatMoneyBRL } from "@/services/finance/signed-money";
import "./GoalsCard.css";

export default function GoalsCard({ model, waiting = false }) {
  const owner = model.owner;
  const formKey = useMemo(() => ({ owner, key: crypto.randomUUID() }), [owner]);
  return <GoalsContent key={formKey.key} model={model} waiting={waiting} />;
}
function GoalsContent({ model, waiting }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const resetForm = () => { setOpen(false); setName(""); setAmount(""); setDeadline(""); setError(""); };
  const disabled = model.busy || !!model.pending || waiting || !model.owner;
  const submit = async (event) => {
    event.preventDefault(); setError("");
    try {
      if (!/^\d+(?:[.,]\d{1,2})?$/.test(amount)) throw new Error();
      if (await model.create({ name, targetAmount: amount.replace(",", "."), deadline })) {
        resetForm();
      }
    } catch { setError("Informe nome de 2 a 150 caracteres, valor positivo com até duas casas decimais e prazo válido."); }
  };
  return <section className="assistant__widget assistant__widget--goals goals-card" aria-label="Minhas metas">
    <div className="assistant__widget-header">
      <div><span className="assistant__widget-label">Metas</span><h2 className="assistant__widget-title">Minhas metas</h2></div>
      <button type="button" className="goals-card__icon" aria-label={open ? "Fechar criação de meta" : "Criar meta"} disabled={disabled} onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Plus size={18} />}</button>
    </div>
    {open && <form className="goals-card__form" onSubmit={submit}>
      <label>Nome da meta<input required minLength={2} maxLength={150} value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} /></label>
      <label>Valor-alvo (R$)<input required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={disabled} /></label>
      <label>Prazo (opcional)<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} disabled={disabled} /></label>
      <button type="submit" disabled={disabled}>Salvar meta</button>
      {error && <p role="alert">{error}</p>}
    </form>}
    {model.error && <p role="alert">{model.error}</p>}
    {model.pending?.reloaded ? <div role="alert">
      <p>Há uma operação anterior com resultado incerto. Confira as metas abaixo antes de tentar novamente. Nada foi reenviado e nenhum sucesso foi presumido.</p>
      <button type="button" disabled={model.status === "loading"} onClick={() => model.reload().catch(() => {})}>Conferir metas atualizadas</button>
      <button type="button" disabled={waiting || !["success", "empty"].includes(model.status)} onClick={() => {
        if (window.confirm("Você conferiu as metas atualizadas? Encerrar este aviso não desfaz nem repete a operação anterior. Um novo envio será outra operação e poderá duplicá-la.")) model.discardUncertain();
      }}>Já conferi; encerrar aviso</button>
    </div> : model.pending && <button type="button" disabled={model.busy} onClick={async () => { if (await model.retry()) resetForm(); }}>Retomar tentativa</button>}
    {model.busy && <p role="status">Confirmando operação…</p>}
    {waiting ? <p role="status">Aguardando confirmação do chat…</p>
      : model.status === "loading" ? <p role="status">Carregando metas…</p>
      : model.status === "error" ? <button type="button" onClick={() => model.reload().catch(() => {})}>Atualizar metas</button>
      : model.status === "empty" ? <p>Você ainda não tem metas. Use o botão + para criar a primeira.</p>
      : <ul className="goals-card__list">{model.goals.map((goal) => {
        const target = decimalToCents(goal.targetAmount), current = decimalToCents(goal.currentAmount);
        const percent = Number(current * 10000n / target > 10000n ? 10000n : current * 10000n / target) / 100;
        return <li key={goal.id}>
          <div className="goals-card__row"><strong>{goal.name}</strong>
            <button type="button" className="goals-card__icon" disabled={disabled || current > 0n} title={current > 0n ? "Retire o valor guardado antes de excluir a meta" : undefined} aria-label={`Excluir meta ${goal.name}`} onClick={() => {
              if (window.confirm(`Excluir a meta "${goal.name}"?`)) model.remove(goal.id);
            }}><Trash2 size={16} /></button></div>
          <progress max="100" value={percent} aria-label={`Progresso de ${goal.name}`} />
          <div className="goals-card__amounts"><span>{formatMoneyBRL(goal.currentAmount)}</span><span>de {formatMoneyBRL(goal.targetAmount)}</span></div>
          <div className="goals-card__amounts"><span>Faltam {formatMoneyBRL(target > current ? target - current : 0n)}</span><span>{percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% concluído</span></div>
          <small>{goal.status === "COMPLETED" ? "Concluída" : goal.status === "CANCELLED" ? "Cancelada" : "Em andamento"}{goal.deadline ? ` · Prazo: ${goal.deadline.split("-").reverse().join("/")}` : ""}</small>
        </li>;
      })}</ul>}
  </section>;
}
