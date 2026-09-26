import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import AppRoutes from "@/app/routes";
import { getCurrentMonthRange } from "@/services/finance/store";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

describe("VisaoMes", () => {
  it("filters the current month and includes prior transactions after selecting all time", () => {
    localStorage.clear();
    const currentRange = getCurrentMonthRange();
    const currentStart = new Date(`${currentRange.start}T00:00:00Z`);
    const previousRange = getCurrentMonthRange(new Date(Date.UTC(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth() - 1,
      1,
    )));
    localStorage.setItem("junta_date_range", JSON.stringify(currentRange));
    localStorage.setItem("junta_transactions", JSON.stringify([
      { id: "current", date: currentRange.start, category: "Lazer", desc: "Compra atual", amount: -10 },
      { id: "previous", date: previousRange.start, category: "Moradia", desc: "Compra anterior", amount: -20 },
    ]));

    renderWithProviders(<AppRoutes />, { route: "/visao-mes" });

    expect(screen.getByText(`${currentRange.start.split("-").reverse().join("/")} até ${currentRange.end.split("-").reverse().join("/")} · 1 transações`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Transações" }));
    expect(screen.getByRole("heading", { name: "Transações no período (1)" })).toBeInTheDocument();
    expect(screen.getByText("Compra atual")).toBeInTheDocument();
    expect(screen.queryByText("Compra anterior")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Este mês/ }));
    fireEvent.click(screen.getByRole("button", { name: "Todo período" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Todos os períodos · 2 transações")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Transações no período (2)" })).toBeInTheDocument();
    expect(screen.getByText("Compra anterior")).toBeInTheDocument();
  });
});