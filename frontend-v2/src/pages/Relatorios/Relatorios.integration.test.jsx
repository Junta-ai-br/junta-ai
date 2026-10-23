import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
vi.hoisted(() => { vi.stubEnv("VITE_API_URL", "https://backend.example.test"); });
import AppRoutes from "@/app/routes";
import Relatorios from "./Relatorios";
import { isReportSelection, loadReportData } from "./report-data";
import { api } from "@/services/api";
import * as reportExporters from "@/utils/report-exporters";
import { renderWithFinanceProvider } from "@/test-utils";
import { clearSession, saveSession } from "@/services/auth/session";

vi.mock("recharts", async () => import("@/test/rechartsMock"));
const tokens = (account = "A") => ({ accessToken: account, refreshToken: "refresh", expiresInSeconds: 900 });
const categoryId = "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3";
const tx = (index, date, amount, description) => ({ id: `76870c4b-f8df-4eab-b3c2-${String(index).padStart(12, "0")}`,
  categoryId, categoryName: amount > 0 ? "Renda" : "Moradia", type: amount > 0 ? "INCOME" : "EXPENSE",
  amount: Math.abs(amount), description, transactionDate: date, createdAt: "2026-08-19T12:00:00Z" });
const realRecords = [
  tx(1, "2026-08-01", 2000, "Salário real"), tx(2, "2026-08-03", -500, "Aluguel real"),
  tx(3, "2026-07-01", 1000, "Salário anterior"), tx(4, "2026-07-03", -250, "Aluguel anterior"),
];
const response = (config, body) => ({ config, status: 200, headers: {}, data: JSON.stringify(body) });
function page(content, number = 0, totalElements = content.length, size = 100) {
  return { content, number, size, totalElements, totalPages: Math.ceil(totalElements / size),
    numberOfElements: content.length, first: number === 0, last: number + 1 >= Math.ceil(totalElements / size), empty: !content.length };
}
let calls, handler, accounts;
function defaultHandler(config) {
  const records = accounts[config.headers.get("Authorization")?.slice(7)];
  if (!records) throw new Error("Unexpected unauthenticated request");
  const { from, to, page: number } = config.params;
  const selected = records.filter((item) => item.transactionDate >= from && item.transactionDate <= to);
  const size = Math.min(config.params.size, 2);
  return response(config, page(selected.slice(number * size, (number + 1) * size), number, selected.length, size));
}
function renderReports(routes = false) {
  return renderWithFinanceProvider(routes ? <AppRoutes /> : <Relatorios />, { route: "/relatorios" });
}
async function ready() {
  return screen.findByRole("heading", { name: "Visão geral de agosto de 2026" });
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 7, 19, 12));
  localStorage.clear(); sessionStorage.clear(); clearSession(); saveSession(tokens());
  calls = []; accounts = { A: [...realRecords], B: [] }; handler = defaultHandler;
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  api.defaults.adapter = async (config) => { calls.push(config); return handler(config); };
});
afterEach(() => { cleanup(); clearSession(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Relatorios with real transactions", () => {
  it.each([
    [1500, "Seu saldo fechou positivo. Continue priorizando o que traz tranquilidade."],
    [-500, "As despesas superaram as receitas neste período."],
    [0, "Receitas e despesas ficaram equilibradas neste período."],
  ])("shows the factual insight message for a balance of %s", async (balance, message) => {
    accounts.A = [tx(1, "2026-08-01", 2000, "Receita real"), tx(2, "2026-08-03", -(2000 - balance), "Despesa real")];
    const { container } = renderReports();
    await ready();
    const callout = container.querySelector(".insights-panel .positive-callout");
    expect(callout).toHaveTextContent(message);
    expect(container.querySelectorAll(".insights-panel")).toHaveLength(1);
    expect(container.querySelectorAll(".positive-callout")).toHaveLength(1);
    for (const other of [
      "Seu saldo fechou positivo. Continue priorizando o que traz tranquilidade.",
      "As despesas superaram as receitas neste período.",
      "Receitas e despesas ficaram equilibradas neste período.",
    ].filter((text) => text !== message)) expect(screen.queryByText(other)).not.toBeInTheDocument();
  });
  it("loads authenticated complete pages, compares the previous period and preserves insights", async () => {
    const { container } = renderReports(true);
    await ready();
    expect(container.querySelector(".metric-card--green strong")).toHaveTextContent(/2\.000,00/);
    expect(container.querySelector(".metric-card--red strong")).toHaveTextContent(/500,00/);
    expect(container.querySelector(".metric-card--aqua strong")).toHaveTextContent(/1\.500,00/);
    expect(container.querySelector(".metric-card--green b")).toHaveTextContent("+100,0%");
    expect(screen.getByText("Salário real")).toBeInTheDocument();
    expect(screen.getByText("Aluguel real")).toBeInTheDocument();
    expect(container.querySelector(".insights-list .category-label")).toBeInTheDocument();
    expect(container.querySelector(".insights-list")).toHaveTextContent("\ud83c\udfe0");
    expect(screen.getByText("2 lançamentos")).toBeInTheDocument();
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ method: "get", url: "/transactions", requiresAuth: true,
      params: { from: "2026-07-01", to: "2026-08-31", page: 0, size: 100, sort: "transactionDate,id,asc" } });
    expect(calls[1].params).toMatchObject({ page: 1, size: 2 });
    expect(calls.every((call) => call.headers.get("Authorization") === "Bearer A")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Alterar filtros" }));
  });
  it("preserves all four filters, the month selector and explicit report refresh", async () => {
    renderReports(); await ready();
    for (const [tab, from, to, title] of [
      ["Trimestral", "2026-05-01", "2026-10-31", "agosto de 2026 a outubro de 2026"],
      ["Semestral", "2026-02-01", "2027-01-31", "agosto de 2026 a janeiro de 2027"],
      ["Anual", "2025-01-01", "2026-12-31", "janeiro de 2026 a dezembro de 2026"],
      ["Mensal", "2026-07-01", "2026-08-31", "agosto de 2026"],
    ]) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
      await screen.findByRole("heading", { name: `Visão geral de ${title}` });
      expect(calls.at(-1).params).toMatchObject({ from, to });
    }
    fireEvent.change(screen.getByLabelText("Período de consulta"), { target: { value: "2026-07" } });
    await screen.findByRole("heading", { name: "Visão geral de julho de 2026" });
    expect(calls.at(-1).params).toMatchObject({ from: "2026-06-01", to: "2026-07-31" });
    const before = calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
    expect(screen.getByRole("heading", { name: "Estamos preparando seu relatório" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
    await screen.findByRole("heading", { name: "Visão geral de julho de 2026" });
    expect(calls.length).toBeGreaterThan(before);
  });
  it("shows a real empty period even when the previous period has transactions", async () => {
    accounts.A = [realRecords[2]]; renderReports();
    await screen.findByRole("heading", { name: "Ainda não há movimentações neste período" });
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
  });
  it("sends the same real displayed report to CSV, PDF and Excel exporters", async () => {
    const user = userEvent.setup();
    const exporters = ["exportToCSV", "exportToPDF", "exportToExcel"].map((name) => vi.spyOn(reportExporters, name).mockImplementation(() => {}));
    renderReports(); await ready();
    for (const name of ["CSV", "PDF", "Excel"]) await user.click(screen.getByRole("button", { name }));
    for (const exporter of exporters) {
      expect(exporter).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
        period: "agosto de 2026", summary: { income: 2000, expenses: 500, balance: 1500,
          incomeChange: "+100,0%", expensesChange: "+100,0%", balanceChange: "+100,0%" },
        chart: [{ label: "Semana 1", income: 2000, expenses: 500 }], hasTransactions: true,
      }));
    }
  });
  it("never reads demonstration transactions, categories or date ranges", async () => {
    localStorage.setItem("junta_transactions", JSON.stringify([{ amount: 999999, desc: "Demonstração proibida" }]));
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
      if (this === localStorage && ["junta_transactions", "junta_categories", "junta_date_range", "junta_goals"].includes(key)) throw new Error("Legacy financial read");
      return original.call(this, key);
    });
    renderReports(true); await ready();
    expect(screen.queryByText(/Demonstração proibida/)).not.toBeInTheDocument();
    expect(screen.queryByText(/dados locais de demonstração/)).not.toBeInTheDocument();
  });
  it.each([401, 403, 500, "network"])("shows %s as failure rather than empty data and supports retry", async (status) => {
    handler = (config) => { throw new AxiosError("Failed", status === "network" ? "ERR_NETWORK" : "ERR_BAD_RESPONSE",
      config, {}, status === "network" ? undefined : { status, config, data: {}, headers: {} }); };
    renderReports();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(status === 401 ? "Sessão expirada" : status === 403 ? "permissão" : "Não foi possível carregar todas");
    expect(screen.queryByText("Ainda não há movimentações neste período")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
    handler = defaultHandler;
    if (status === 401) act(() => saveSession(tokens()));
    else fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await ready();
  });
  it("refuses an absent session without sending a request", async () => {
    clearSession(); renderReports();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sessão expirada");
    expect(calls).toHaveLength(0);
  });
  it("does not publish a partial first page if loading the next page fails", async () => {
    handler = (config) => { if (config.params.page === 1) throw new Error("Network failed"); return defaultHandler(config); };
    renderReports();
    await screen.findByRole("alert");
    expect(calls).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: /Visão geral de/ })).not.toBeInTheDocument();
  });
  it.each([
    { content: [] }, page([tx(8, "2026-08-01", 1.001, "Invalid precision")]),
    page([tx(9, "2026-06-30", 10, "Outside the requested range")]), page([realRecords[0]], 0, 2, 2),
  ])("rejects invalid DTOs, out-of-range data and incomplete page coverage %j", async (body) => {
    handler = (config) => response(config, body);
    renderReports();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar todas");
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
  });
  it("refuses unsafe aggregate magnitudes instead of rounding real transactions", async () => {
    accounts.A = [tx(8, "2026-08-01", 9999999999.99, "Maximum"), tx(9, "2026-07-01", 0.01, "Exceeds total range")];
    renderReports();
    expect(await screen.findByRole("alert")).toHaveTextContent("limite seguro");
    expect(screen.queryByRole("button", { name: "PDF" })).not.toBeInTheDocument();
  });
  it("validates the selection before sending an invalid calendar request", async () => {
    for (const [date, period] of [[null, "monthly"], ["", "monthly"], ["2026-13", "monthly"],
      ["0000-01", "yearly"], ["9999-01", "quarterly"], ["2026-08", "unknown"]]) {
      expect(isReportSelection(date, period)).toBe(false);
      await expect(loadReportData({ date, period })).rejects.toMatchObject({ code: "INVALID_PERIOD" });
    }
    expect(calls).toHaveLength(0);
  });
  it("hides a previous report and discards late responses after changing filters", async () => {
    renderReports(); await ready();
    let release;
    handler = (config) => new Promise((resolve) => { release = () => resolve(defaultHandler(config)); });
    fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
    await waitFor(() => expect(release).toBeTypeOf("function"));
    expect(screen.queryByRole("heading", { name: /Visão geral de/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excel" })).not.toBeInTheDocument();
    const previousRequest = calls.at(-1);
    handler = defaultHandler;
    fireEvent.change(screen.getByLabelText("Período de consulta"), { target: { value: "2026-09" } });
    await screen.findByRole("heading", { name: "Ainda não há movimentações neste período" });
    expect(previousRequest.signal.aborted).toBe(true);
    await act(async () => release());
    expect(screen.queryByRole("heading", { name: "Visão geral de agosto de 2026" })).not.toBeInTheDocument();
  });
  it("does not revive an old report when returning to the original filter during loading", async () => {
    renderReports(); await ready();
    let release;
    handler = (config) => new Promise((resolve) => { release = () => resolve(defaultHandler(config)); });
    fireEvent.click(screen.getByRole("tab", { name: "Trimestral" }));
    await waitFor(() => expect(release).toBeTypeOf("function"));
    handler = defaultHandler;
    fireEvent.click(screen.getByRole("tab", { name: "Mensal" }));
    expect(screen.getByRole("heading", { name: "Estamos preparando seu relatório" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
    await ready();
    await act(async () => release());
    expect(screen.queryByRole("heading", { name: "Visão geral de agosto de 2026 a outubro de 2026" })).not.toBeInTheDocument();
  });
  it("discards account A's pending response and exports only account B's data", async () => {
    let release;
    handler = (config) => new Promise((resolve) => { release = () => resolve(response(config, page(realRecords))); });
    renderReports(); await waitFor(() => expect(release).toBeTypeOf("function"));
    handler = defaultHandler; accounts.B = [tx(5, "2026-08-02", 25, "Receita da conta B")];
    act(() => saveSession(tokens("B")));
    await ready();
    await act(async () => release());
    expect(screen.queryByText("Salário real")).not.toBeInTheDocument();
    expect(screen.getByText("Receita da conta B")).toBeInTheDocument();
    const csv = vi.spyOn(reportExporters, "exportToCSV").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    expect(csv).toHaveBeenCalledWith(expect.objectContaining({ summary: expect.objectContaining({ income: 25, expenses: 0, balance: 25 }) }));
  });
  it("removes visible results and export actions on logout", async () => {
    renderReports(); await ready();
    act(() => clearSession());
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sessão expirada");
  });
  it("guards an export synchronously when session storage changes without a notification", async () => {
    const csv = vi.spyOn(reportExporters, "exportToCSV").mockImplementation(() => {});
    renderReports(); await ready();
    const stored = JSON.parse(sessionStorage.getItem("junta_auth_session"));
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...stored, accessToken: "B" }));
    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    expect(csv).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sessão expirada ou alterada");
    expect(screen.queryByText("Salário real")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByRole("heading", { name: "Ainda não há movimentações neste período" });
    expect(screen.queryByText("Salário real")).not.toBeInTheDocument();
  });
  it("does not fetch or export a cleared month selection", async () => {
    renderReports(); await ready(); const before = calls.length;
    fireEvent.change(screen.getByLabelText("Período de consulta"), { target: { value: "" } });
    expect(screen.getByRole("heading", { name: "Seu resumo começa aqui" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CSV" })).not.toBeInTheDocument();
    expect(calls).toHaveLength(before);
  });
});
