import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import CategoryExpenseChart from "./CategoryExpenseChart";
import { categoryColor } from "@/utils/category-colors";

const chart = vi.hoisted(() => ({ props: null, x: null, y: null, bar: null, selectedId: null }));
vi.mock("recharts", async () => {
  const { cloneElement } = await import("react");
  return {
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    BarChart: (props) => { chart.props = props; return <div data-testid="columns">{props.children}</div>; },
    Bar: (props) => { chart.bar = props; return <div>{props.children}</div>; },
    CartesianGrid: () => null,
    Cell: ({ fill }) => <span data-testid="column-color" style={{ backgroundColor: fill }} />,
    XAxis: (props) => {
      chart.x = props;
      return <svg>{chart.props.data.map((category, index) => cloneElement(props.tick, { key: category.id, x: index * 50, y: 100, payload: { value: category.id } }))}</svg>;
    },
    YAxis: (props) => {
      chart.y = props;
      return <div data-testid="money-axis">{props.ticks.map((tick) => <span key={tick}>{props.tickFormatter(tick)}</span>)}</div>;
    },
    Tooltip: ({ content }) => cloneElement(content, { active: true, payload: [{ payload: chart.props.data.find((item) => item.id === chart.selectedId) ?? chart.props.data[0] }] }),
  };
});

const categories = [
  { id: "home", name: "Moradia", expensesCents: 50000n },
  { id: "food", name: "Alimentação", expensesCents: 12656n },
];
const mount = (items = categories, total = 62656n) => render(<CategoryExpenseChart categories={items} totalExpensesCents={total} />);
afterEach(() => { cleanup(); chart.selectedId = null; });

describe("CategoryExpenseChart", () => {
  it("shows columns, category labels and a zero-based monetary Y axis", () => {
    mount();
    expect(chart.props.layout).toBe("horizontal");
    expect(chart.x.type).toBe("category");
    expect(chart.y.type).toBe("number");
    const axis = within(screen.getByTestId("money-axis"));
    expect(axis.getByText("R$ 0,00")).toBeInTheDocument();
    expect(axis.getByText("R$ 500,00")).toBeInTheDocument();
    expect(axis.getByText("R$ 250,00")).toBeInTheDocument();
    expect(screen.getByTestId("money-axis").textContent).not.toContain("%");
    expect(chart.bar.radius).toEqual([5, 5, 0, 0]);
  });
  it("uses the exact category value and the real period total for participation", () => {
    mount();
    const tooltip = within(screen.getByRole("status"));
    expect(tooltip.getByText("Moradia")).toBeInTheDocument();
    expect(tooltip.getByText("Valor: R$ 500,00")).toBeInTheDocument();
    expect(tooltip.getByText("Participação nas despesas: 79,8%")).toBeInTheDocument();
  });
  it("keeps ID colors across sorting, renaming and filtering", () => {
    const view = mount();
    screen.getAllByTestId("column-color").forEach((column, index) => expect(column).toHaveStyle({ backgroundColor: categoryColor(categories[index].id) }));
    view.rerender(<CategoryExpenseChart categories={[{ ...categories[1], name: "Novo nome" }]} totalExpensesCents={62656n} />);
    expect(screen.getByTestId("column-color")).toHaveStyle({ backgroundColor: categoryColor("food") });
    view.rerender(<CategoryExpenseChart categories={categories.toReversed()} totalExpensesCents={62656n} />);
    screen.getAllByTestId("column-color").forEach((column, index) => expect(column).toHaveStyle({ backgroundColor: categoryColor(categories.toReversed()[index].id) }));
  });
  it.each([{ items: [] }, { items: [{ id: "none", name: "Sem gastos", expensesCents: 0n }] }])("shows an empty state without an invalid chart", ({ items }) => {
    mount(items, 0n);
    expect(screen.getByRole("status")).toHaveTextContent("Nenhuma despesa neste período.");
    expect(screen.queryByTestId("columns")).not.toBeInTheDocument();
  });
  it("shows 100% for a single category representing the entire total", () => {
    mount([categories[0]], 50000n);
    expect(screen.getByRole("status")).toHaveTextContent("Participação nas despesas: 100,0%");
  });
  it("shows distinct zero and one-cent ticks for the smallest expense", () => {
    mount([{ id: "cent", name: "Centavo", expensesCents: 1n }], 1n);
    expect(screen.getByTestId("money-axis").children).toHaveLength(2);
    expect(within(screen.getByTestId("money-axis")).getByText("R$ 0,01")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("100,0%");
  });
  it("keeps tiny positive expenses visible without reporting an invalid percentage", () => {
    chart.selectedId = "tiny";
    mount([...categories, { id: "tiny", name: "Centavo", expensesCents: 1n }], 62657n);
    expect(screen.getByRole("status")).toHaveTextContent("Valor: R$ 0,01");
    expect(screen.getByRole("status")).toHaveTextContent("Participação nas despesas: < 0,1%");
    expect(chart.props.data.at(-1).height).toBeGreaterThan(0);
    expect(chart.bar.minPointSize).toBe(2);
    expect(chart.props.data.every((item) => Number.isFinite(item.height))).toBe(true);
  });
  it("retains exact amounts beyond Number precision and uses readable compact axis labels", () => {
    mount([{ id: "large", name: "Grande", expensesCents: 9999999999999999999n }], 9999999999999999999n);
    expect(screen.getByRole("status")).toHaveTextContent("Valor: R$ 99.999.999.999.999.999,99");
    expect(screen.getByRole("status")).toHaveTextContent("Participação nas despesas: 100,0%");
    expect(screen.getByTestId("money-axis").textContent).toContain("R$");
    expect(screen.getByTestId("money-axis").textContent).not.toMatch(/NaN|Infinity|%/);
  });
  it("abbreviates long ticks while preserving full names in title and tooltip", () => {
    const name = "Moradia e manutenção da residência principal";
    const { container } = mount([{ ...categories[0], name }], 50000n);
    expect(container.querySelector("svg title")).toHaveTextContent(name);
    expect(container.querySelector("svg text").lastChild.textContent).toMatch(/…$/);
    expect(within(screen.getByRole("status")).getByText(name)).toBeInTheDocument();
  });
  it("contains many categories in a labeled scroll region without removing any", () => {
    const items = Array.from({ length: 20 }, (_, index) => ({ id: String(index), name: `Categoria ${index}`, expensesCents: 100n }));
    mount(items, 2000n);
    expect(chart.props.data).toHaveLength(20);
    const region = screen.getByRole("region", { name: "Colunas de despesas por categoria" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getByText(/Deslize o gráfico/)).toBeInTheDocument();
  });
  it("updates monetary labels and participation after a period change", () => {
    const view = mount();
    view.rerender(<CategoryExpenseChart categories={[{ ...categories[0], expensesCents: 20000n }]} totalExpensesCents={80000n} />);
    expect(screen.getByRole("status")).toHaveTextContent("Valor: R$ 200,00");
    expect(screen.getByRole("status")).toHaveTextContent("Participação nas despesas: 25,0%");
    expect(within(screen.getByTestId("money-axis")).getByText("R$ 200,00")).toBeInTheDocument();
  });
  it("avoids NaN even when an empty total is supplied during a transition", () => {
    mount([categories[0]], 0n);
    expect(screen.getByRole("status")).toHaveTextContent("Participação nas despesas: 0,0%");
    expect(screen.getByRole("status").textContent).not.toContain("NaN");
  });
});
