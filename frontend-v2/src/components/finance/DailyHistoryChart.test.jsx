import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { act } from "react";
import { historyAxisTicks } from "./history-axis";
import DailyHistoryChart, { CumulativeTooltip } from "./DailyHistoryChart";
import { transactionDtoToView } from "@/services/finance/transaction-adapter";
vi.mock("recharts", async () => {
  const charts = await import("@/test/rechartsMock");
  return { ...charts, Line: vi.fn(charts.Line), LineChart: vi.fn(charts.LineChart), ResponsiveContainer: vi.fn(charts.ResponsiveContainer), XAxis: vi.fn(charts.XAxis), YAxis: vi.fn(charts.YAxis) };
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

it.each([28, 29, 30, 31])("selects monthly references without duplicate end dates for %i days", (length) => {
  const days = Array.from({ length }, (_, i) => ({ date: `2024-01-${String(i + 1).padStart(2, "0")}` }));
  expect(historyAxisTicks(days)).toEqual([1, 5, 10, 15, 20, 25, length].map(d => `2024-01-${String(d).padStart(2, "0")}`));
  expect(new Set(historyAxisTicks(days)).size).toBe(7);
});
it("handles partial periods and a final day that is already a reference", () => {
  const days = Array.from({ length: 16 }, (_, i) => ({ date: `2024-01-${String(i + 10).padStart(2, "0")}` }));
  expect(historyAxisTicks(days)).toEqual([10, 15, 20, 25].map(d => `2024-01-${d}`));
  expect(historyAxisTicks([])).toEqual([]);
  expect(historyAxisTicks([{ date: "2024-01-01" }])).toEqual(["2024-01-01"]);
});
it("adapts long-period labels to width while preserving every daily tooltip point", () => {
  render(<DailyHistoryChart transactions={[record]} period={{ from: "2024-02-01", to: "2024-05-31" }} />);
  const before = LineChart.mock.calls.at(-1)[0].data;
  const desktop = XAxis.mock.calls.at(-1)[0].ticks;
  act(() => ResponsiveContainer.mock.calls.at(-1)[0].onResize(390));
  const mobile = XAxis.mock.calls.at(-1)[0].ticks;
  expect(mobile.length).toBeLessThan(desktop.length);
  expect(mobile[0]).toBe(before[0].date);
  expect(mobile.at(-1)).toBe(before.at(-1).date);
  expect(LineChart.mock.calls.at(-1)[0].data).toEqual(before);
  expect(before).toHaveLength(121);
  expect(Line.mock.calls.every(([p]) => p.type === "stepAfter" && p.dot === false)).toBe(true);
  expect(XAxis.mock.calls.at(-1)[0]).toMatchObject({ interval: "preserveStartEnd", minTickGap: 16 });
});
it("retains intermediate daily points independently of monthly tick labels", () => {
  render(<DailyHistoryChart transactions={[record]} period={{ from: "2024-02-01", to: "2024-02-29" }} />);
  const data = LineChart.mock.calls.at(-1)[0].data;
  expect(data).toHaveLength(29);
  const day = data.find(d => d.date === "2024-02-03");
  expect(XAxis.mock.calls.at(-1)[0].ticks).not.toContain(day.date);
  cleanup();
  render(<CumulativeTooltip active payload={[{ payload: day }]} />);
  expect(screen.getByRole("status")).toHaveTextContent("03/02/2024");
  expect(screen.getByRole("status")).toHaveTextContent("Despesas acumuladas: R$ 351,00");
});

it.each([["2024-01-31", "2024-02-29"], ["2024-12-31", "2025-01-31"], ["2024-01-30", "2024-02-02"]])("keeps chronological, unique and spaced references across %s to %s", (from, to) => {
  const days = [];
  for (let date = new Date(`${from}T00:00:00Z`); date.toISOString().slice(0, 10) <= to; date.setUTCDate(date.getUTCDate() + 1)) days.push({ date: date.toISOString().slice(0, 10) });
  const ticks = historyAxisTicks(days);
  expect(ticks).toEqual([...ticks].sort());
  expect(new Set(ticks).size).toBe(ticks.length);
  expect(ticks[0]).toBe(from);
  expect(ticks.at(-1)).toBe(to);
  const positions = ticks.map(tick => days.findIndex(day => day.date === tick));
  expect(positions.slice(1).every((position, i) => position - positions[i] >= 3)).toBe(true);
});
