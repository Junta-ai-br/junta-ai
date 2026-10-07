import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AppRoutes from "@/app/routes";
import * as reportExporters from "@/utils/report-exporters";
import { renderWithFinanceProvider } from "@/test-utils";
import { saveSession } from "@/services/auth/session";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

const REPORT_RANGE = { start: "2026-08-01", end: "2026-08-31" };
const REPORT_TRANSACTIONS = [
  { id: "income", date: "2026-08-01", category: "Renda", desc: "Salário", amount: 2000 },
  { id: "expense", date: "2026-08-03", category: "Moradia", desc: "Aluguel", amount: -500 },
];

function renderReports(transactions = REPORT_TRANSACTIONS) {
  return renderWithFinanceProvider(<AppRoutes />, {
    route: "/relatorios",
    initialFinanceData: { dateRange: REPORT_RANGE, transactions },
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  saveSession({ accessToken: "test-access", refreshToken: "test-refresh", expiresInSeconds: 900 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Relatorios", () => {
  it("generates a report, changes periods, and wires the CSV export action", async () => {
    const exportCsv = vi.spyOn(reportExporters, "exportToCSV").mockImplementation(() => {});
    const { container } = renderReports();

    expect(await screen.findByRole("heading", { name: "Visão geral de agosto de 2026" })).toBeInTheDocument();
    expect(screen.getByText("Receitas", { exact: true })).toBeInTheDocument();
    expect(container.querySelector(".metric-card--green strong")).toHaveTextContent(/2\.000,00/);
    expect(container.querySelector(".metric-card--red strong")).toHaveTextContent(/500,00/);
    expect(container.querySelector(".metric-card--aqua strong")).toHaveTextContent(/1\.500,00/);

    fireEvent.click(screen.getByRole("tab", { name: "Anual" }));
    expect(screen.getByRole("heading", { name: "Visão geral de janeiro de 2026 a dezembro de 2026" })).toBeInTheDocument();

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
    expect(screen.getByRole("heading", { name: "Estamos preparando seu relatório" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByRole("heading", { name: "Visão geral de janeiro de 2026 a dezembro de 2026" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    expect(exportCsv).toHaveBeenCalledOnce();
    expect(exportCsv).toHaveBeenCalledWith(expect.objectContaining({ period: "janeiro de 2026 a dezembro de 2026" }));
  });

  it("shows the empty state when the selected period has no transactions", async () => {
    renderReports([]);

    expect(await screen.findByRole("heading", { name: "Ainda não há movimentações neste período" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Visão geral de/ })).not.toBeInTheDocument();
  });

  it("sends the calculated report payload to CSV, PDF, and Excel exporters", async () => {
    const user = userEvent.setup();
    const exportCsv = vi.spyOn(reportExporters, "exportToCSV").mockImplementation(() => {});
    const exportPdf = vi.spyOn(reportExporters, "exportToPDF").mockImplementation(() => {});
    const exportExcel = vi.spyOn(reportExporters, "exportToExcel").mockImplementation(() => {});
    renderReports();

    expect(await screen.findByRole("heading", { name: "Visão geral de agosto de 2026" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "CSV" }));
    await user.click(screen.getByRole("button", { name: "PDF" }));
    await user.click(screen.getByRole("button", { name: "Excel" }));

    for (const exporter of [exportCsv, exportPdf, exportExcel]) {
      expect(exporter).toHaveBeenCalledOnce();
      expect(exporter).toHaveBeenCalledWith(expect.objectContaining({
        period: "agosto de 2026",
        summary: expect.objectContaining({ income: 2000, expenses: 500, balance: 1500 }),
        chart: expect.arrayContaining([
          expect.objectContaining({ label: "Semana 1", income: 2000, expenses: 500 }),
        ]),
        hasTransactions: true,
      }));
    }
  });
});
