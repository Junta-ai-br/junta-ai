import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";

import AppRoutes from "@/app/routes";
import * as reportExporters from "@/utils/report-exporters";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("junta_date_range", JSON.stringify({ start: "2026-08-01", end: "2026-08-31" }));
  localStorage.setItem("junta_transactions", JSON.stringify([
    { id: "income", date: "2026-08-01", category: "Renda", desc: "Salário", amount: 2000 },
    { id: "expense", date: "2026-08-03", category: "Moradia", desc: "Aluguel", amount: -500 },
  ]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Relatorios", () => {
  it("generates a report, changes periods, and wires the CSV export action", () => {
    vi.useFakeTimers();
    const exportCsv = vi.spyOn(reportExporters, "exportToCSV").mockImplementation(() => {});
    const { container } = renderWithProviders(<AppRoutes />, { route: "/relatorios" });

    expect(screen.getByRole("heading", { name: "Visão geral de agosto de 2026" })).toBeInTheDocument();
    expect(screen.getByText("Receitas", { exact: true })).toBeInTheDocument();
    expect(container.querySelector(".metric-card--green strong")).toHaveTextContent(/2\.000,00/);

    fireEvent.click(screen.getByRole("tab", { name: "Anual" }));
    expect(screen.getByRole("heading", { name: "Visão geral de janeiro de 2026 a dezembro de 2026" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Gerar relatório" }));
    expect(screen.getByRole("heading", { name: "Estamos preparando seu relatório" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(650));
    expect(screen.getByRole("heading", { name: "Visão geral de janeiro de 2026 a dezembro de 2026" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    expect(exportCsv).toHaveBeenCalledOnce();
    expect(exportCsv).toHaveBeenCalledWith(expect.objectContaining({ period: "janeiro de 2026 a dezembro de 2026" }));
  });

  it("shows the empty state when the selected period has no transactions", () => {
    localStorage.setItem("junta_transactions", "[]");

    renderWithProviders(<AppRoutes />, { route: "/relatorios" });

    expect(screen.getByRole("heading", { name: "Ainda não há movimentações neste período" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Visão geral de/ })).not.toBeInTheDocument();
  });
});