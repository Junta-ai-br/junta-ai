import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Button from "@/components/common/Button";
import Input from "@/components/forms/Input";
import useCanonicalFinance from "@/contexts/useCanonicalFinance";
import { getSessionSnapshot, subscribeSession } from "@/services/auth/session";
import { CATEGORY_TYPES, TRANSACTION_TYPES, FinancialContractError, isCategoryName } from "@/services/financial-contracts";
import { prepareTransactionRequest } from "@/services/finance/transaction-adapter";
import { SignedMoneyError } from "@/services/finance/signed-money";
import "./FinancialForms.css";

const generation = () => getSessionSnapshot()?.generation ?? null;
const labels = { INCOME: "Receita", EXPENSE: "Despesa", BOTH: "Receitas e despesas" };

// A textarea exposes LF even for CRLF/CR. Keep that view separate from the raw
// draft, with a boundary map back to its original UTF-16 offsets.
function projectText(raw) {
  let text = "";
  const offsets = [0];
  for (let index = 0; index < raw.length;) {
    const char = raw[index];
    index += 1;
    if (char === "\r" && raw[index] === "\n") index += 1;
    text += char === "\r" ? "\n" : char;
    offsets.push(index);
  }
  return { text, offsets };
}

function applyTextEdit(raw, next) {
  const { text, offsets } = projectText(raw);
  let start = 0;
  while (start < text.length && start < next.length && text[start] === next[start]) start += 1;
  let end = text.length;
  let nextEnd = next.length;
  while (end > start && nextEnd > start && text[end - 1] === next[nextEnd - 1]) { end -= 1; nextEnd -= 1; }
  // Only the changed interval comes from the DOM. Retained separators come from
  // the original draft; newly inserted/replaced separators have textarea LF.
  const prefix = raw.slice(0, offsets[start]);
  const tail = next.slice(start, nextEnd) + raw.slice(offsets[end]);
  // Editing can join a retained bare CR to LF (insertion or deletion at the
  // boundary). Keep two visible breaks instead of accidentally making one CRLF.
  if (prefix.endsWith("\r") && tail.startsWith("\n")) return prefix.slice(0, -1) + "\n" + tail;
  return prefix + tail;
}

function MultilineField({ label, value, onChange, maxLength, required = false, error }) {
  const id = useId();
  return <div className="input-group">
    <label htmlFor={id} className="input-label">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <div className="input-wrapper">
      <textarea id={id} className="input" rows={3} required={required} maxLength={maxLength}
        value={projectText(value).text} aria-invalid={!!error} aria-describedby={`${id}-message`}
        onChange={(event) => {
          const next = event.target.value;
          onChange((previous) => applyTextEdit(previous, next));
        }} />
    </div>
    <p id={`${id}-message`} className={`input-message input-message--${error ? "error" : "helper"}`} role={error ? "alert" : undefined}>
      {error || "Quebras existentes são mantidas fora do trecho e das fronteiras editadas. Quebras novas ou substituídas usam o padrão do editor."}
    </p>
  </div>;
}

function Unavailable({ children, onCancel }) {
  return <div><p role="status">{children}</p>{onCancel && <Button variant="secondary" onClick={onCancel}>Fechar</Button>}</div>;
}

// A session transition destroys the editor, including drafts and pending feedback.
// The caller must reopen it with a selection belonging to the current account.
function SessionBoundary({ children }) {
  const current = useSyncExternalStore(subscribeSession, generation);
  const [owner] = useState(generation);
  if (!owner || current !== owner) return <p role="status">Sessão alterada ou encerrada. Reabra o formulário após entrar novamente.</p>;
  return children;
}

function useSubmission() {
  const finance = useCanonicalFinance();
  const [owner] = useState(generation);
  const mounted = useRef(false);
  const locked = useRef(false);
  const [state, setState] = useState({ pending: false, result: null });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const submit = async (command) => {
    if (locked.current || !mounted.current || !owner || generation() !== owner) return;
    locked.current = true;
    setState({ pending: true, result: null });
    let result;
    try { result = await command(); }
    finally {
      // Unexpected programming errors still propagate; they never imply success.
      if (mounted.current && generation() === owner) setState((current) => ({ ...current, pending: false }));
    }
    if (!mounted.current || generation() !== owner) return;
    // An uncertain or confirmed write must not be repeated by this form.
    locked.current = result.status !== "error";
    setState({ pending: false, result });
  };
  return { finance, submit, ...state, disabled: state.pending || (state.result && state.result.status !== "error") };
}

function Feedback({ result, refreshRequired }) {
  if (!result) return null;
  if (result.status === "confirmed") return <p role="status">Operação confirmada.{refreshRequired || result.refresh?.status !== "synced" ? " A gravação foi confirmada, mas a visualização ainda precisa ser atualizada." : ""}</p>;
  if (["stale", "cancelled"].includes(result.status)) return <p role="status">Operação interrompida. Isso não garante que o servidor deixou de processá-la. Consulte os dados antes de tentar novamente.</p>;
  const error = result.error;
  return <div role="alert">
    <p>{result.status === "indeterminate"
      ? "Não foi possível determinar o resultado da operação. Consulte os dados antes de realizar outra gravação. Não haverá nova tentativa automática."
      : "Não foi possível concluir a operação. Revise os campos ou tente novamente após resolver o erro."}</p>
    {error?.status && <p>HTTP {error.status}</p>}
    {error?.mensagem && <p>{error.mensagem}</p>}
    {error?.campos && <ul>{Object.entries(error.campos).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul>}
  </div>;
}

function FormShell({ title, submission, onSubmit, onCancel, children, submitLabel = "Salvar" }) {
  const id = useId();
  return <form className="canonical-financial-form" aria-labelledby={id} aria-busy={submission.pending} onSubmit={onSubmit} noValidate>
    <h2 id={id}>{title}</h2>
    <fieldset disabled={!!submission.disabled}>{children}</fieldset>
    <Feedback result={submission.result} refreshRequired={submission.finance.getSnapshot().refreshRequired} />
    <div className="canonical-financial-form__actions">
      {onCancel && <Button variant="secondary" disabled={submission.pending} onClick={onCancel}>Fechar</Button>}
      <Button type="submit" loading={submission.pending} loadingText="Enviando…" disabled={!!submission.disabled}>{submitLabel}</Button>
    </div>
  </form>;
}

export function TransactionForm(props) {
  return <SessionBoundary><TransactionEditor key={props.transactionId ?? "create"} {...props} /></SessionBoundary>;
}

function TransactionEditor({ transactionId, onCancel }) {
  const submission = useSubmission();
  const { finance } = submission;
  const [initial] = useState(() => transactionId ? finance.getSnapshot().transactions.find((item) => item.id === transactionId) : null);
  const [fields, setFields] = useState(() => ({ categoryId: initial?.categoryId ?? "", type: initial?.type ?? "EXPENSE",
    description: initial?.description ?? null, amount: initial?.amount ?? "", transactionDate: initial?.transactionDate ?? "" }));
  const [errors, setErrors] = useState({});
  const helpId = useId();
  const update = (key) => (event) => setFields((current) => ({ ...current, [key]: event.target.value }));
  if (transactionId && !initial) return <Unavailable onCancel={onCancel}>Transação indisponível neste período. Atualize a consulta antes de editar.</Unavailable>;
  const submit = (event) => {
    event.preventDefault();
    if (submission.disabled) return;
    const nextErrors = {};
    let body;
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(fields.amount)) nextErrors.amount = "Informe uma magnitude positiva com até duas casas decimais, sem separador de milhares.";
    try { body = prepareTransactionRequest({ ...fields, amount: fields.amount.replace(",", ".") }); }
    catch (error) {
      if (!(error instanceof FinancialContractError) && !(error instanceof SignedMoneyError)) throw error;
      nextErrors.form = "Revise categoria, tipo, data civil, descrição (até 500 caracteres) e valor positivo até 99999999999999999,99.";
    }
    if (!finance.getSnapshot().categories.some((item) => item.id === fields.categoryId)) nextErrors.categoryId = "Selecione uma categoria disponível.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    return submission.submit(() => transactionId ? finance.updateTransaction(transactionId, body) : finance.createTransaction(body));
  };
  return <FormShell title={transactionId ? "Editar lançamento" : "Adicionar lançamento"} submission={submission} onSubmit={submit} onCancel={onCancel} submitLabel="Salvar lançamento">
    <MultilineField label="Descrição" value={fields.description ?? ""} maxLength={500}
      onChange={(edit) => setFields((current) => ({ ...current, description: edit(current.description ?? "") }))} />
    <Input label="Data" type="date" required value={fields.transactionDate} onChange={update("transactionDate")} />
    <label>Tipo<select value={fields.type} onChange={update("type")}>{TRANSACTION_TYPES.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
    <label>Categoria<select required value={fields.categoryId} onChange={update("categoryId")} aria-invalid={!!errors.categoryId} aria-describedby={helpId}>
      <option value="">Selecione uma categoria</option>
      {finance.categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {labels[category.type]} · {category.id}</option>)}
    </select></label>
    <p id={helpId}>{errors.categoryId || "A categoria é identificada pelo UUID; nomes iguais não são mesclados."}</p>
    <Input label="Valor" type="text" inputMode="decimal" required value={fields.amount} onChange={update("amount")} maxLength={21} error={errors.amount} helperText="Ex.: 0,01. Use vírgula ou ponto, sem separador de milhares." />
    {errors.form && <p role="alert">{errors.form}</p>}
  </FormShell>;
}

export function CategoryForm(props) {
  return <SessionBoundary><CategoryEditor key={props.categoryId ?? "create"} {...props} /></SessionBoundary>;
}

function CategoryEditor({ categoryId, onCancel }) {
  const submission = useSubmission();
  const { finance } = submission;
  const [initial] = useState(() => categoryId ? finance.getSnapshot().categories.find((item) => item.id === categoryId) : null);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "BOTH");
  const [error, setError] = useState(null);
  if (categoryId && !initial) return <Unavailable onCancel={onCancel}>Categoria indisponível. Atualize a consulta antes de editar.</Unavailable>;
  const submit = (event) => {
    event.preventDefault();
    if (submission.disabled) return;
    if (!isCategoryName(name) || !CATEGORY_TYPES.includes(type)) { setError("Informe um nome não vazio de 2 a 120 caracteres e um tipo válido."); return; }
    setError(null);
    return submission.submit(() => categoryId ? finance.updateCategory(categoryId, { name, type }) : finance.createCategory({ name, type }));
  };
  return <FormShell title={categoryId ? "Editar categoria" : "Adicionar categoria"} submission={submission} onSubmit={submit} onCancel={onCancel}>
    <MultilineField label="Nome" required value={name} onChange={setName} maxLength={120} error={error} />
    <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}>{CATEGORY_TYPES.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
  </FormShell>;
}

export function DeleteFinancialRecordForm(props) {
  return <SessionBoundary><DeleteEditor key={`${props.kind}:${props.id}`} {...props} /></SessionBoundary>;
}

function DeleteEditor({ kind, id, onCancel }) {
  const submission = useSubmission();
  const { finance } = submission;
  const [record] = useState(() => (kind === "transaction" ? finance.getSnapshot().transactions
    : kind === "category" ? finance.getSnapshot().categories : []).find((item) => item.id === id));
  if (!record) return <Unavailable onCancel={onCancel}>Registro indisponível. Atualize a consulta antes de excluir.</Unavailable>;
  const submit = (event) => {
    event.preventDefault();
    if (submission.disabled) return;
    return submission.submit(() => kind === "transaction" ? finance.deleteTransaction(id) : finance.deleteCategory(id));
  };
  return <FormShell title={kind === "transaction" ? "Excluir lançamento" : "Excluir categoria"} submission={submission} onSubmit={submit} onCancel={onCancel} submitLabel="Confirmar exclusão">
    <p>Excluir {kind === "transaction" ? record.description || "lançamento sem descrição" : record.name}?</p>
    <p>Identificador: {id}</p>
    {kind === "category" && <p>Transações vinculadas não serão excluídas nem recategorizadas por este formulário.</p>}
  </FormShell>;
}
