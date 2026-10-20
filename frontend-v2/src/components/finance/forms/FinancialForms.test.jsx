import { StrictMode, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider } from "@/contexts/UserContext";
import useCanonicalFinance from "@/contexts/useCanonicalFinance";
import { clearSession, saveSession } from "@/services/auth/session";
import { CategoryForm, DeleteFinancialRecordForm, TransactionForm } from "./FinancialForms";

const period = { from: "2026-10-01", to: "2026-10-31" };
const tokens = { accessToken: "A", refreshToken: "R", expiresInSeconds: 900 };
const cat = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", name: "Mesma categoria", type: "BOTH", createdAt: "2026-10-18T12:00:00Z" };
const second = { ...cat, id: "ec17e3c2-b24a-4e17-9ff5-58d370cc9862" };
const dto = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: cat.id, categoryName: cat.name,
  type: "EXPENSE", amount: "0.01", description: "Original", transactionDate: "2026-10-01", createdAt: cat.createdAt };
const page = { content: [dto], number: 0, size: 100, totalElements: 1, totalPages: 1, numberOfElements: 1, first: true, last: true, empty: false };
const wire = (body) => JSON.stringify(body).replace(/"amount":"(\d+\.\d{2})"/g, '"amount":$1');
const response = (config, body, status = 200) => ({ config, status, headers: {}, data: status === 204 ? "" : wire(body) });
const deferred = () => { let resolve; const promise = new Promise((yes) => { resolve = yes; }); return { promise, resolve }; };
let api, CanonicalFinanceProvider, calls, transport, latest, categoryRecords, transactionRecords;

beforeEach(async () => {
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear(); localStorage.clear(); clearSession(); saveSession(tokens);
  ({ api } = await import("@/services/api"));
  ({ CanonicalFinanceProvider } = await import("@/contexts/CanonicalFinanceProvider"));
  calls = [];
  categoryRecords = [cat, second]; transactionRecords = [dto];
  transport = async (config) => {
    if (config.method === "get") return response(config, config.url === "/categories" ? categoryRecords : {
      ...page, content: transactionRecords, totalElements: transactionRecords.length,
      numberOfElements: transactionRecords.length, totalPages: transactionRecords.length ? 1 : 0, empty: !transactionRecords.length,
    });
    if (config.method === "delete") return response(config, null, 204);
    if (config.url.startsWith("/categories")) return response(config, {
      ...(categoryRecords.find((item) => config.url.endsWith(item.id)) ?? cat), ...JSON.parse(config.data),
    });
    const fields = JSON.parse(config.data);
    const amount = /"amount":(\d+\.\d{2})/.exec(config.data)[1];
    return response(config, { ...dto, ...fields, amount });
  };
  api.defaults.adapter = (config) => { calls.push(config); return transport(config); };
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); clearSession(); vi.unstubAllEnvs(); });
const writes = () => calls.filter((call) => call.method !== "get");

function Host({ children }) {
  const finance = useCanonicalFinance();
  useEffect(() => { latest = finance; }, [finance]);
  const [open, setOpen] = useState(false);
  return <><button disabled={finance.status !== "success"} onClick={() => setOpen(true)}>Abrir</button>{open && children}</>;
}
async function mountForm(form, { strict = false } = {}) {
  const tree = (content) => {
    const providers = <UserProvider><CanonicalFinanceProvider initialPeriod={period}><Host>{content}</Host></CanonicalFinanceProvider></UserProvider>;
    return strict ? <StrictMode>{providers}</StrictMode> : providers;
  };
  const view = render(tree(form));
  await waitFor(() => expect(screen.getByRole("button", { name: "Abrir" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
  return { ...view, rerenderForm: (content) => view.rerender(tree(content)) };
}
function fillTransaction({ amount = "0,01", type = "EXPENSE", categoryId = cat.id, description = 'Literal "texto" / Unicode 💜' } = {}) {
  if (description !== null) fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: description } });
  fireEvent.change(screen.getByLabelText(/Data/), { target: { value: "2026-10-01" } });
  fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: type } });
  fireEvent.change(screen.getByLabelText(/^Categoria/), { target: { value: categoryId } });
  fireEvent.change(screen.getByLabelText(/Valor/), { target: { value: amount } });
}
const submit = (name) => fireEvent.submit(screen.getByRole("form", { name }));
const confirmed = () => screen.findByText(/^Operação confirmada/);

describe("canonical financial forms with real commands and controlled HTTP", () => {
  describe("literal multiline text", () => {
    it.each([
      ["LF", "Linha 1\nLinha 2", "Linha 1\nLinha 2"],
      ["CRLF", "Linha 1\r\nLinha 2", "Linha 1\nLinha 2"],
      ["mixed", "Linha 1\nLinha 2\r\nFinal", "Linha 1\nLinha 2\nFinal"],
      ["CR", "Linha 1\rLinha 2", "Linha 1\nLinha 2"],
    ])("preserves description %s separators when editing another region", async (_kind, original, visible) => {
      transactionRecords = [{ ...dto, description: original }];
      await mountForm(<TransactionForm transactionId={dto.id} />);
      const control = screen.getByLabelText("Descrição");
      expect(control.value).toBe(visible);
      fireEvent.change(control, { target: { value: `${control.value}!` } });
      submit("Editar lançamento"); await confirmed();
      expect(JSON.parse(writes()[0].data).description).toBe(`${original}!`);
    });

    it.each([
      ["LF", "Cat\nA", "Cat\nA"],
      ["CRLF", "Cat\r\nA", "Cat\nA"],
      ["CR", "Cat\rA", "Cat\nA"],
    ])("preserves category name %s separators when editing another region", async (_kind, original, visible) => {
      categoryRecords = [{ ...cat, name: original }, second];
      await mountForm(<CategoryForm categoryId={cat.id} />);
      const control = screen.getByLabelText(/Nome/);
      expect(control.value).toBe(visible);
      fireEvent.change(control, { target: { value: `${control.value}!` } });
      submit("Editar categoria"); await confirmed();
      expect(JSON.parse(writes()[0].data).name).toBe(`${original}!`);
    });

    it("preserves mixed description separators when only amount changes", async () => {
      const description = "\u00a0A 💜\nB\r\nC\rD\u2003";
      transactionRecords = [{ ...dto, description }];
      await mountForm(<TransactionForm transactionId={dto.id} />);
      fireEvent.change(screen.getByLabelText(/Valor/), { target: { value: "0.02" } });
      submit("Editar lançamento"); await confirmed();
      expect(JSON.parse(writes()[0].data).description).toBe(description);
    });

    it("preserves category separators when only type changes", async () => {
      const name = "\u00a0Cat 💜\r\nA\nB\u2003";
      categoryRecords = [{ ...cat, name }, second];
      await mountForm(<CategoryForm categoryId={cat.id} />);
      fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "INCOME" } });
      submit("Editar categoria"); await confirmed();
      expect(JSON.parse(writes()[0].data)).toEqual({ name, type: "INCOME" });
    });

    it("preserves every surrounding separator across sequential edits in the middle and beginning", async () => {
      transactionRecords = [{ ...dto, description: "A\r\nMeio 💜\nC\rD" }];
      await mountForm(<TransactionForm transactionId={dto.id} />);
      const field = screen.getByLabelText("Descrição");
      fireEvent.change(field, { target: { value: "A\nMeio novo 💜\nC\nD" } });
      fireEvent.change(field, { target: { value: "Antes A\nMeio novo 💜\nC\nD" } });
      submit("Editar lançamento"); await confirmed();
      expect(JSON.parse(writes()[0].data).description).toBe("Antes A\r\nMeio novo 💜\nC\rD");
    });

    it("uses LF for an edited separator interval without changing retained CRLF", async () => {
      transactionRecords = [{ ...dto, description: "A\r\nB\rC\nD" }];
      await mountForm(<TransactionForm transactionId={dto.id} />);
      fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "A\nBX\nYC\nD" } });
      submit("Editar lançamento"); await confirmed();
      expect(JSON.parse(writes()[0].data).description).toBe("A\r\nBX\nYC\nD");
    });

    it.each([
      ["A\rB", "A\n\nB"],
      ["A\rX\nB", "A\n\nB"],
    ])("does not merge two visible breaks at an edited CR/LF boundary: %j", async (original, next) => {
      transactionRecords = [{ ...dto, description: original }];
      await mountForm(<TransactionForm transactionId={dto.id} />);
      const field = screen.getByLabelText("Descrição");
      fireEvent.change(field, { target: { value: next } });
      expect(field.value).toBe(next);
      submit("Editar lançamento"); await confirmed();
      expect(JSON.parse(writes()[0].data).description).toBe("A\n\nB");
    });

    it("preserves raw text for an unchanged projection and drops only explicitly removed breaks", async () => {
      categoryRecords = [{ ...cat, name: "A\r\nB\rC\nD" }, second];
      await mountForm(<CategoryForm categoryId={cat.id} />);
      const field = screen.getByLabelText(/Nome/);
      // The identical visible value is not evidence of an intent to normalize.
      fireEvent.change(field, { target: { value: field.value } });
      fireEvent.change(field, { target: { value: "A\nBC\nD" } });
      submit("Editar categoria"); await confirmed();
      expect(JSON.parse(writes()[0].data).name).toBe("A\r\nBC\nD");
    });

    it.each(["transaction", "category"])("creates Unicode multiline %s with explicitly new LF separators", async (kind) => {
      await mountForm(kind === "transaction" ? <TransactionForm /> : <CategoryForm />);
      const pasted = "\u00a0Unicode 💜\r\nOutra\u2003";
      if (kind === "transaction") fillTransaction({ description: null });
      const field = screen.getByLabelText(kind === "transaction" ? "Descrição" : /Nome/);
      fireEvent.change(field, { target: { value: pasted } });
      expect(field.value).toBe("\u00a0Unicode 💜\nOutra\u2003");
      submit(kind === "transaction" ? "Adicionar lançamento" : "Adicionar categoria"); await confirmed();
      expect(JSON.parse(writes()[0].data)[kind === "transaction" ? "description" : "name"]).toBe("\u00a0Unicode 💜\nOutra\u2003");
    });

    it("keeps original UTF-16 length validation even when textarea LF projection is shorter", async () => {
      categoryRecords = [{ ...cat, name: `${"A".repeat(116)}\r\nBC` }, second];
      await mountForm(<CategoryForm categoryId={cat.id} />);
      const field = screen.getByLabelText(/Nome/);
      expect(field.value.length).toBe(119);
      fireEvent.change(field, { target: { value: `${field.value}!` } });
      submit("Editar categoria");
      expect(screen.getByRole("alert")).toHaveTextContent(/Informe um nome/);
      expect(writes()).toHaveLength(0);
    });

    it("inserts a real newline with Enter and submits once with repeated Enter on Save", async () => {
      await mountForm(<CategoryForm />, { strict: true });
      const user = userEvent.setup();
      const field = screen.getByLabelText(/Nome/);
      await user.type(field, "Categoria{Enter}Unicode 💜");
      expect(field.value).toBe("Categoria\nUnicode 💜");
      expect(writes()).toHaveLength(0);
      screen.getByRole("button", { name: "Salvar" }).focus();
      await user.keyboard("{Enter}{Enter}{Enter}"); await confirmed();
      expect(writes()).toHaveLength(1);
      expect(JSON.parse(writes()[0].data).name).toBe("Categoria\nUnicode 💜");
    });

    it("allows another record after confirmation without carrying the old lock or text", async () => {
      categoryRecords = [{ ...cat, name: "A\r\nOriginal" }, { ...second, name: "B\r\nOriginal" }];
      const view = await mountForm(<CategoryForm categoryId={cat.id} />);
      submit("Editar categoria"); await confirmed();
      view.rerenderForm(<CategoryForm categoryId={second.id} />);
      expect(screen.queryByText(/^Operação confirmada/)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Nome/)).toHaveValue("B\nOriginal");
      expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
      fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "B\nOriginal!" } });
      submit("Editar categoria"); await confirmed();
      expect(writes()).toHaveLength(2);
      expect(writes()[1].url).toBe(`/categories/${second.id}`);
      expect(JSON.parse(writes()[1].data).name).toBe("B\r\nOriginal!");
    });

    it("discards late A feedback after opening B and preserves B's multiline draft", async () => {
      categoryRecords = [cat, { ...second, name: "B\r\nOriginal" }];
      const view = await mountForm(<CategoryForm categoryId={cat.id} />);
      const base = transport, held = deferred(); let config;
      transport = (request) => {
        if (request.method === "put" && request.url.endsWith(cat.id)) { config = request; return held.promise; }
        return base(request);
      };
      submit("Editar categoria"); await waitFor(() => expect(config).toBeDefined());
      view.rerenderForm(<CategoryForm categoryId={second.id} />);
      fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "B\nOriginal!" } });
      await act(async () => { held.resolve(response(config, cat)); await held.promise; });
      await waitFor(() => expect(latest.pending).toBe(0));
      expect(screen.queryByText(/^Operação confirmada/)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Nome/)).toHaveValue("B\nOriginal!");
      submit("Editar categoria"); await confirmed();
      expect(writes()).toHaveLength(2);
      expect(JSON.parse(writes()[1].data).name).toBe("B\r\nOriginal!");
    });

    it("resets create-to-edit props after confirmation", async () => {
      const view = await mountForm(<CategoryForm />);
      fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Criada\n💜" } });
      submit("Adicionar categoria"); await confirmed();
      view.rerenderForm(<CategoryForm categoryId={second.id} />);
      expect(screen.getByLabelText(/Nome/)).toHaveValue(second.name);
      submit("Editar categoria"); await confirmed();
      expect(writes()).toHaveLength(2);
      expect(writes()[1].url).toBe(`/categories/${second.id}`);
    });

    it("announces local category validation and keeps its field association", async () => {
      await mountForm(<CategoryForm />);
      fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "\n " } });
      submit("Adicionar categoria");
      expect(screen.getByRole("alert")).toHaveTextContent(/Informe um nome/);
      const field = screen.getByLabelText(/Nome/);
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(document.getElementById(field.getAttribute("aria-describedby"))).toHaveTextContent(/Informe um nome/);
      expect(writes()).toHaveLength(0);
    });

    it.each(["transaction", "category", "delete"])("keeps Close for unavailable %s", async (kind) => {
      const onCancel = vi.fn();
      const missing = "e17fd077-445c-4d97-a940-7fa701833b41";
      await mountForm(kind === "transaction" ? <TransactionForm transactionId={missing} onCancel={onCancel} />
        : kind === "category" ? <CategoryForm categoryId={missing} onCancel={onCancel} />
          : <DeleteFinancialRecordForm kind="category" id={missing} onCancel={onCancel} />);
      fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
      expect(onCancel).toHaveBeenCalledTimes(1); expect(writes()).toHaveLength(0);
    });
  });
  it.each(["INCOME", "EXPENSE"])("creates %s with exact cents and civil date", async (type) => {
    await mountForm(<TransactionForm />); fillTransaction({ type, categoryId: second.id });
    submit("Adicionar lançamento"); await confirmed();
    expect(writes()).toHaveLength(1);
    expect(writes()[0]).toMatchObject({ method: "post", url: "/transactions" });
    expect(writes()[0].data).toContain('"amount":0.01');
    expect(JSON.parse(writes()[0].data)).toMatchObject({ type, categoryId: second.id, transactionDate: "2026-10-01" });
    expect(writes()[0].data).not.toMatch(/signedCents|createdAt|categoryName/);
  });

  it("preserves the maximum magnitude without Number conversion", async () => {
    await mountForm(<TransactionForm />); fillTransaction({ amount: "99999999999999999,99" });
    submit("Adicionar lançamento"); await confirmed();
    expect(writes()[0].data).toContain('"amount":99999999999999999.99');
  });

  it("edits a transaction by UUID without replacing collections", async () => {
    await mountForm(<TransactionForm transactionId={dto.id} />);
    expect(screen.getByLabelText(/Valor/)).toHaveValue("0.01");
    fireEvent.change(screen.getByLabelText(/Valor/), { target: { value: "0.02" } });
    submit("Editar lançamento"); await confirmed();
    expect(writes()).toHaveLength(1);
    expect(writes()[0]).toMatchObject({ method: "put", url: `/transactions/${dto.id}` });
    expect(JSON.parse(writes()[0].data).type).toBe("EXPENSE");
  });

  it.each(["transaction", "category"])("deletes %s by UUID with 204", async (kind) => {
    const id = kind === "transaction" ? dto.id : cat.id;
    await mountForm(<DeleteFinancialRecordForm kind={kind} id={id} />);
    submit(kind === "transaction" ? "Excluir lançamento" : "Excluir categoria"); await confirmed();
    expect(writes()).toHaveLength(1);
    expect(writes()[0]).toMatchObject({ method: "delete", url: `/${kind === "transaction" ? "transactions" : "categories"}/${id}` });
  });

  it.each([false, true])("creates/edits category with literal Unicode, editing=%s", async (editing) => {
    await mountForm(<CategoryForm categoryId={editing ? cat.id : undefined} />);
    const name = " \u00a0Educação 💜\u2003 ";
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "INCOME" } });
    submit(editing ? "Editar categoria" : "Adicionar categoria"); await confirmed();
    expect(writes()[0]).toMatchObject({ method: editing ? "put" : "post", url: editing ? `/categories/${cat.id}` : "/categories" });
    expect(JSON.parse(writes()[0].data)).toEqual({ name, type: "INCOME" });
    expect(writes()).toHaveLength(1);
  });

  it("keeps two equal category names distinct by UUID", async () => {
    await mountForm(<TransactionForm />);
    expect(screen.getByRole("option", { name: new RegExp(cat.id) })).toHaveValue(cat.id);
    expect(screen.getByRole("option", { name: new RegExp(second.id) })).toHaveValue(second.id);
    fillTransaction({ categoryId: second.id }); submit("Adicionar lançamento"); await confirmed();
    expect(JSON.parse(writes()[0].data).categoryId).toBe(second.id);
  });

  it.each(["-0.01", "-0.00", "0", "0.001", "999999999999999999.99", "1e3", "1.000,00"])("rejects invalid magnitude %s without HTTP", async (amount) => {
    await mountForm(<TransactionForm />); fillTransaction({ amount }); submit("Adicionar lançamento");
    expect(screen.getByRole("alert")).toBeInTheDocument(); expect(writes()).toHaveLength(0);
  });

  it("rejects invalid category name without HTTP", async () => {
    await mountForm(<CategoryForm />);
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: " " } });
    submit("Adicionar categoria"); expect(screen.getByText(/Informe um nome/)).toBeInTheDocument();
    expect(writes()).toHaveLength(0);
  });

  it.each([400, 403, 409, 500])("preserves real HTTP %s and category integrity error without cascade", async (status) => {
    await mountForm(<DeleteFinancialRecordForm kind="category" id={cat.id} />);
    const base = transport;
    transport = async (config) => {
      if (config.method === "get") return base(config);
      throw new AxiosError("Rejected", "ERR_BAD_RESPONSE", config, {}, { config, status, data: '{"mensagem":"Categoria vinculada."}' });
    };
    submit("Excluir categoria"); await screen.findByRole("alert");
    expect(screen.getByText(`HTTP ${status}`)).toBeInTheDocument();
    expect(screen.getByText("Categoria vinculada.")).toBeInTheDocument();
    if (status === 500) expect(screen.getByText(/Não foi possível determinar/)).toBeInTheDocument();
    expect(writes()).toHaveLength(1);
    expect(writes()[0].url).toBe(`/categories/${cat.id}`);
  });

  it("keeps editable fields and backend validation errors on failure", async () => {
    await mountForm(<CategoryForm />);
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Literal" } });
    transport = async (config) => { throw new AxiosError("Bad", "ERR_BAD_REQUEST", config, {}, { config, status: 400, data: '{"mensagem":"Validação","campos":{"name":"Já existe"}}' }); };
    submit("Adicionar categoria"); await screen.findByRole("alert");
    expect(screen.getByLabelText(/Nome/)).toHaveValue("Literal");
    expect(screen.getByLabelText(/Nome/)).toBeEnabled();
    expect(screen.getByText("name: Já existe")).toBeInTheDocument();
  });

  it("preserves edited empty description and rejects missing date without a write", async () => {
    await mountForm(<TransactionForm />);
    fillTransaction();
    fireEvent.change(screen.getByLabelText(/Data/), { target: { value: "" } });
    submit("Adicionar lançamento");
    expect(writes()).toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/Data/), { target: { value: "2026-10-01" } });
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "" } });
    submit("Adicionar lançamento"); await confirmed();
    expect(JSON.parse(writes()[0].data).description).toBe("");
  });

  it("preserves optional null description when the field is untouched", async () => {
    await mountForm(<TransactionForm />); fillTransaction({ description: null });
    submit("Adicionar lançamento"); await confirmed();
    expect(JSON.parse(writes()[0].data).description).toBeNull();
  });

  it("preserves the literal description sent by an editor", async () => {
    await mountForm(<TransactionForm transactionId={dto.id} />);
    const description = '  "Texto" / \\ Unicode 💜 \\n  ';
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: description } });
    submit("Editar lançamento"); await confirmed();
    expect(JSON.parse(writes()[0].data).description).toBe(description);
  });

  it("handles current-session 401 by destroying the draft without showing old feedback", async () => {
    await mountForm(<CategoryForm />);
    fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Rascunho A" } });
    transport = async (config) => { throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, {}, { config, status: 401, data: '{"mensagem":"Sessão expirada"}' }); };
    submit("Adicionar categoria");
    await screen.findByText(/Sessão alterada ou encerrada/);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(writes()).toHaveLength(1);
  });

  it.each(["double click", "repeated Enter"])("blocks %s synchronously and never confirms before HTTP", async (mode) => {
    await mountForm(<TransactionForm />, { strict: true }); fillTransaction();
    const held = deferred(); let config;
    const base = transport;
    transport = (request) => { if (request.method === "post") { config = request; return held.promise; } return base(request); };
    const button = screen.getByRole("button", { name: "Salvar lançamento" });
    if (mode === "double click") {
      act(() => {
        fireEvent.click(button);
        fireEvent.click(button);
        submit("Adicionar lançamento");
      });
    }
    else { const user = userEvent.setup(); screen.getByLabelText(/Valor/).focus(); await user.keyboard("{Enter}{Enter}{Enter}"); }
    // Further submits after the commit also respect the disabled/terminal guard.
    submit("Adicionar lançamento"); submit("Adicionar lançamento");
    await waitFor(() => expect(config).toBeDefined());
    expect(writes()).toHaveLength(1); expect(screen.queryByText(/^Operação confirmada/)).not.toBeInTheDocument();
    expect(latest.transactions[0].description).toBe("Original");
    await act(async () => { held.resolve(response(config, dto)); await held.promise; });
    await confirmed(); submit("Adicionar lançamento"); expect(writes()).toHaveLength(1);
  });

  it("shows indeterminate transport outcome without retry or local storage fallback", async () => {
    await mountForm(<TransactionForm />); fillTransaction();
    const storage = vi.spyOn(Storage.prototype, "setItem");
    transport = async () => { throw Object.assign(new Error("Network"), { code: "ERR_NETWORK" }); };
    submit("Adicionar lançamento"); await screen.findByText(/Não foi possível determinar/);
    submit("Adicionar lançamento"); await Promise.resolve();
    expect(writes()).toHaveLength(1);
    expect(storage.mock.calls).toEqual([]);
    expect(screen.queryByText(/^Operação confirmada/)).not.toBeInTheDocument();
  });

  it("distinguishes confirmed writing from failed refresh without repeating the write", async () => {
    await mountForm(<TransactionForm />); fillTransaction();
    const base = transport;
    transport = (config) => config.method === "get" ? Promise.reject(Object.assign(new Error("Network"), { code: "ERR_NETWORK" })) : base(config);
    submit("Adicionar lançamento"); await confirmed();
    expect(screen.getByText(/visualização ainda precisa ser atualizada/)).toBeInTheDocument();
    expect(latest.refreshRequired).toBe(true); submit("Adicionar lançamento"); expect(writes()).toHaveLength(1);
  });

  it.each(["new session", "unmount"])("discards pending feedback and drafts after %s", async (mode) => {
    const view = await mountForm(<TransactionForm />); fillTransaction();
    const held = deferred(); let config;
    const base = transport;
    transport = (request) => { if (request.method === "post") { config = request; return held.promise; } return base(request); };
    submit("Adicionar lançamento"); await waitFor(() => expect(config).toBeDefined());
    act(() => { if (mode === "new session") saveSession(tokens); else view.unmount(); });
    expect(config.signal.aborted).toBe(true);
    await act(async () => { held.resolve(response(config, dto)); await held.promise; });
    expect(screen.queryByRole("textbox", { name: "Descrição" })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Operação confirmada/)).not.toBeInTheDocument();
    expect(writes()).toHaveLength(1);
  });
});
