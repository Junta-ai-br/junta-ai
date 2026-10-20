import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
vi.hoisted(() => { vi.stubEnv("VITE_API_URL", "https://backend.example.test"); vi.stubEnv("VITE_GOOGLE_CLIENT_ID", ""); });
import AppRoutes from "@/app/routes";
import { renderWithFinanceProvider } from "@/test-utils";
import { api } from "@/services/api";
import { clearSession, saveSession } from "@/services/auth/session";
import { currentCivilMonth } from "@/services/finance/finance-provider-store";
vi.mock("recharts", async () => import("@/test/rechartsMock"));
const period = currentCivilMonth();
const cat = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", name: "Trabalho", type: "BOTH", createdAt: "2026-10-18T12:00:00Z" };
const id = "ec17e3c2-b24a-4e17-9ff5-58d370cc9862";
const entry = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: cat.id, categoryName: cat.name, type: "INCOME", amount: "100.00", description: "Receita real", transactionDate: period.from, createdAt: cat.createdAt };
const tokens = (account) => ({ accessToken: account, refreshToken: `refresh-${account}`, expiresInSeconds: 900 });
const page = (content) => ({ content, number: 0, size: 100, totalElements: content.length, totalPages: content.length ? 1 : 0, numberOfElements: content.length, first: true, last: true, empty: !content.length });
const wire = (body) => JSON.stringify(body).replace(/"amount":"(\d+\.\d{2})"/g, '"amount":$1');
const response = (config, body, status = 200) => ({ config, status, headers: {}, data: status === 204 || status === 202 ? "" : wire(body) });
let calls, accounts;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); clearSession();
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
  calls = []; accounts = { A: { categories: [cat], transactions: [entry] }, B: { categories: [], transactions: [] } };
  api.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.url === "/auth/access-code/request") return response(config, null, 202);
    if (config.url === "/auth/access-code/verify") return response(config, tokens(JSON.parse(config.data).email.startsWith("b") ? "B" : "A"));
    const account = accounts[config.headers.get("Authorization")?.slice(7)];
    if (!account) throw new Error("Unauthenticated financial request");
    const collection = config.url.startsWith("/categories") ? "categories" : "transactions";
    if (config.method === "get") return response(config, collection === "categories" ? account.categories : page(account.transactions.filter((item) => item.transactionDate >= config.params.from && item.transactionDate <= config.params.to)));
    const uuid = config.url.split("/").at(-1);
    if (config.method === "delete") { account[collection] = account[collection].filter((item) => item.id !== uuid); return response(config, null, 204); }
    const body = JSON.parse(config.data);
    if (collection === "transactions") { body.amount = /"amount":(\d+\.\d{2})/.exec(config.data)[1]; body.categoryName = account.categories.find((item) => item.id === body.categoryId).name; }
    const record = { ...(collection === "categories" ? cat : entry), ...body, id: config.method === "post" ? id : uuid };
    account[collection] = config.method === "post" ? [...account[collection], record] : account[collection].map((item) => item.id === uuid ? record : item);
    return response(config, record);
  };
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function Navigation() { const navigate = useNavigate(); return <button onClick={() => navigate("/login")}>Ir ao login</button>; }
async function login(user, email) {
  await user.type(await screen.findByLabelText(/Seu e-mail/), email);
  fireEvent.submit(screen.getByLabelText(/Seu e-mail/).closest("form"));
  await user.type(await screen.findByLabelText(/Chave de acesso/), "123456");
  await user.click(screen.getByRole("button", { name: "Confirmar chave" }));
  await user.click(await screen.findByRole("link", { name: "Dashboard" }));
  await screen.findByRole("heading", { name: "Dashboard" });
}
function kpi(label, value) { const region = within(screen.getByRole("region", { name: "Indicadores financeiros" })); expect(within(region.getByText(label).closest("article")).getByText(value)).toBeInTheDocument(); }
async function finish(user) { await screen.findByText(/^Operação confirmada/); await user.click(screen.getByRole("button", { name: "Fechar" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); }
describe("real finance cutover", () => {
  it("logs in through OTP, creates, edits, deletes and isolates the next account", async () => {
    const user = userEvent.setup();
    renderWithFinanceProvider(<><Navigation /><AppRoutes /></>, { route: "/login" });
    await login(user, "a@example.test"); await waitFor(() => kpi("Saldo", "R$ 100,00"));
    const storage = vi.spyOn(Storage.prototype, "setItem");
    await user.click(screen.getByRole("button", { name: "＋ Lançamento" }));
    fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Cinema" } });
    fireEvent.change(screen.getByLabelText(/^Data/), { target: { value: period.from } });
    await user.selectOptions(screen.getByLabelText("Categoria"), cat.id);
    fireEvent.change(screen.getByLabelText(/Valor/), { target: { value: "0,01" } });
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" })); await finish(user); kpi("Saldo", "R$ 99,99");
    expect(screen.getByRole("button", { name: "＋ Lançamento" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Transações" }));
    await user.click(screen.getByRole("button", { name: "Editar Cinema" }));
    fireEvent.change(screen.getByLabelText(/Valor/), { target: { value: "0.02" } });
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" })); await finish(user); kpi("Saldo", "R$ 99,98");
    await user.click(screen.getByRole("button", { name: "Excluir Cinema" }));
    await user.click(screen.getByRole("button", { name: "Confirmar exclusão" })); await finish(user); kpi("Saldo", "R$ 100,00");
    expect(screen.queryByText("Cinema")).not.toBeInTheDocument();
    expect(calls.filter((call) => call.method !== "get" && call.url.startsWith("/transactions")).map((call) => call.method)).toEqual(["post", "put", "delete"]);
    expect(storage.mock.calls.filter(([key]) => ["junta_transactions", "junta_categories"].includes(key))).toEqual([]);
    await user.click(screen.getByRole("button", { name: /Menu de/ })); await user.click(screen.getByRole("menuitem", { name: "Sair" }));
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(screen.queryByRole("region", { name: "Indicadores financeiros" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ir ao login" })); await login(user, "b@example.test");
    await waitFor(() => kpi("Saldo", "R$ 0,00")); expect(screen.getByText(/Nenhuma movimentação neste período/)).toBeInTheDocument();
  }, 15000);
  it("uses all three category commands without recategorizing transactions locally", async () => {
    saveSession(tokens("A")); const user = userEvent.setup(); renderWithFinanceProvider(<AppRoutes />, { route: "/visao-mes" });
    await waitFor(() => kpi("Categorias", "1")); await user.click(screen.getByRole("button", { name: "Categorias" }));
    await user.click(screen.getByRole("button", { name: "＋ Nova categoria" })); fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Educação 💜" } });
    await user.click(screen.getByRole("button", { name: "Salvar" })); await finish(user); kpi("Categorias", "2");
    await user.click(screen.getByRole("button", { name: "Editar categoria Educação 💜" })); fireEvent.change(screen.getByLabelText(/Nome/), { target: { value: "Educação\nUnicode 💜" } });
    await user.click(screen.getByRole("button", { name: "Salvar" })); await finish(user);
    await user.click(screen.getByRole("button", { name: /Excluir categoria Educação\s+Unicode/ })); await user.click(screen.getByRole("button", { name: "Confirmar exclusão" })); await finish(user); kpi("Categorias", "1");
    expect(calls.filter((call) => call.method !== "get" && call.url.startsWith("/categories")).map((call) => call.method)).toEqual(["post", "put", "delete"]);
  });
  it("queries an explicit historical range and filters equal category names by UUID", async () => {
    accounts.A.categories.push({ ...cat, id }); accounts.A.transactions.push({ ...entry, id, categoryId: id, description: "Histórico remoto", transactionDate: "2020-01-01" });
    saveSession(tokens("A")); const user = userEvent.setup(); renderWithFinanceProvider(<AppRoutes />, { route: "/visao-mes" });
    await waitFor(() => kpi("Saldo", "R$ 100,00")); await user.click(screen.getByRole("button", { name: /Este mês/ }));
    expect(screen.queryByRole("button", { name: "Todo período" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Data inicial"), { target: { value: "2020-01-01" } }); await user.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() => kpi("Saldo", "R$ 200,00")); await user.click(screen.getByRole("button", { name: "Transações" }));
    await user.selectOptions(screen.getByLabelText("Filtrar por categoria"), id); expect(screen.getByText("Histórico remoto")).toBeInTheDocument(); expect(screen.queryByText("Receita real")).not.toBeInTheDocument();
    expect(calls.some((call) => call.params?.from === "2020-01-01" && call.params.to === period.to)).toBe(true);
  });
  it.each(["http", "coverage"])("does not show local data or zero KPIs on %s failure", async (kind) => {
    saveSession(tokens("A")); api.defaults.adapter = async (config) => {
      if (kind === "http") throw new AxiosError("Failure", "ERR_BAD_RESPONSE", config, {}, { status: 500, config, data: '{"mensagem":"Erro"}' });
      return response(config, config.url === "/categories" ? [] : page([entry]));
    };
    renderWithFinanceProvider(<AppRoutes />, { route: "/visao-mes", initialFinanceData: { transactions: [{ id: "mock", amount: 999999, desc: "Seed proibido" }] } });
    await screen.findByRole("alert"); kpi("Saldo", "Indisponível"); expect(screen.queryByText("Seed proibido")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "＋ Lançamento" })).toBeDisabled();
  });
  it("blocks another write after an indeterminate result until explicit reconciliation", async () => {
    saveSession(tokens("A")); const user = userEvent.setup();
    const normal = api.defaults.adapter;
    api.defaults.adapter = (config) => {
      if (config.method === "post" && config.url === "/transactions") {
        calls.push(config);
        accounts.A.transactions.push({ ...entry, id, description: "Servidor processou", type: "EXPENSE", amount: "0.01" });
        return Promise.reject(Object.assign(new Error("Lost response"), { code: "ERR_NETWORK" }));
      }
      return normal(config);
    };
    renderWithFinanceProvider(<AppRoutes />, { route: "/visao-mes" });
    await waitFor(() => kpi("Saldo", "R$ 100,00"));
    await user.click(screen.getByRole("button", { name: "＋ Lançamento" }));
    fireEvent.change(screen.getByLabelText(/^Data/), { target: { value: period.from } });
    await user.selectOptions(screen.getByLabelText("Categoria"), cat.id);
    fireEvent.change(screen.getByLabelText(/Valor/), { target: { value: "0.01" } });
    await user.click(screen.getByRole("button", { name: "Salvar lançamento" }));
    await screen.findByText(/Não foi possível determinar o resultado/);
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.getByRole("button", { name: "＋ Lançamento" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Atualizar consulta" }));
    await waitFor(() => kpi("Saldo", "R$ 99,99"));
    expect(screen.getByRole("button", { name: "＋ Lançamento" })).toBeEnabled();
    expect(calls.filter((call) => call.method === "post" && call.url === "/transactions")).toHaveLength(1);
  });
});
