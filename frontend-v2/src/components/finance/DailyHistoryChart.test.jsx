import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import DailyHistoryChart, { CumulativeTooltip } from "./DailyHistoryChart";
import { transactionDtoToView } from "@/services/finance/transaction-adapter";
vi.mock("recharts", async () => {
  const charts = await import("@/test/rechartsMock");
  return { ...charts, Line: vi.fn(charts.Line), LineChart: vi.fn(charts.LineChart), XAxis: vi.fn(charts.XAxis), YAxis: vi.fn(charts.YAxis) };
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const period = { from: "2024-02-01", to: "2024-02-03" };
const record = transactionDtoToView({ id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", categoryName: "Mercado", type: "EXPENSE", amount: "351.00", description: null, transactionDate: period.from, createdAt: "2024-02-01T12:00:00Z" });
it("renders two independent step lines, readable dates and monetary scale", () => {
  render(<DailyHistoryChart transactions={[record]} period={period} />);
  expect(screen.getByText("Evolução acumulada até hoje. Os indicadores consideram todo o período selecionado, incluindo movimentações futuras.")).toBeInTheDocument();
  expect(screen.getByText(/Acumulado diário/)).toHaveTextContent("01/02/2024 até 03/02/2024");
  const data = LineChart.mock.calls.at(-1)[0].data;
  expect(data.map((d) => d.expensesCents)).toEqual([35100n, 35100n, 35100n]);
  expect(Line.mock.calls.map(([p]) => [p.dataKey, p.stroke, p.type])).toEqual([["incomePlot", "var(--success)", "stepAfter"], ["expensesPlot", "var(--error)", "stepAfter"]]);
  expect(YAxis.mock.calls.at(-1)[0].tickFormatter(1000000)).toBe("R$ 351,00");
  expect(XAxis.mock.calls.at(-1)[0].tickFormatter(period.from)).toBe("01/02");
});
it("tooltips use exact amounts rather than rounded plotting coordinates", () => {
  render(<CumulativeTooltip active payload={[{ payload: { date: period.from, incomeCents: 10000000000000000001n, expensesCents: 35100n, incomePlot: 1 } }]} />);
  expect(screen.getByRole("status")).toHaveTextContent("R$ 100.000.000.000.000.000,01");
  expect(screen.getByRole("status")).toHaveTextContent("Despesas acumuladas: R$ 351,00");
});
it("renders explicit zero totals for an empty past period", () => {
  render(<DailyHistoryChart transactions={[]} period={period} />);
  expect(screen.getByText(/Acumulado até/)).toHaveTextContent("receitas R$ 0,00 · despesas R$ 0,00");
});
