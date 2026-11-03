import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Showcase from "./Showcase";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Showcase assistant demonstration", () => {
  it("places the desktop demonstration in Como funciona with four ordered indicators and three sidebar panels", () => {
    const { container } = render(<Showcase />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Uma conversa quefaz sentido para você.");
    const demo = screen.getByRole("figure", { name: "Prévia demonstrativa do assistente Junta.ai" });
    expect(container.querySelector("#como-funciona .showcase__demo")).toContainElement(demo);
    expect(screen.queryByText("Chat preview")).not.toBeInTheDocument();
    expect([...demo.querySelectorAll("dt")].map((node) => node.textContent)).toEqual(["Receitas", "Despesas", "Saldo", "Guardado"]);
    expect(within(demo).getAllByRole("definition").map((node) => node.textContent.replace(/\s/g, " "))).toEqual(["R$ 3.200,00", "R$ 1.850,00", "R$ 1.350,00", "R$ 200,00"]);
    const sidebar = within(demo).getByRole("complementary", { name: "Planejamento financeiro fictício" });
    const goal = within(sidebar).getByRole("region", { name: "Minhas metas demonstrativas" });
    expect(goal).toHaveTextContent("Viagem de férias");
    expect(goal).toHaveTextContent(/R\$\s*200,00 guardados/);
    expect(goal).toHaveTextContent(/de R\$\s*2.000,00/);
    expect(within(goal).getByRole("progressbar")).toHaveAttribute("value", "10");
    expect(goal).not.toHaveTextContent("Guardado é o valor destinado às metas financeiras");
    expect([...sidebar.children].map((panel) => panel.getAttribute("aria-label"))).toEqual(["Minhas metas demonstrativas", "Saúde financeira demonstrativa", "Visão do mês demonstrativa"]);
    const health = within(sidebar).getByRole("region", { name: "Saúde financeira demonstrativa" });
    expect(within(health).getByRole("progressbar")).toHaveAttribute("value", "78");
    expect(health).toHaveTextContent("sem cálculo real");
    expect(within(demo).getByRole("region", { name: "Conversa fictícia com o Junta.ai" })).toHaveTextContent("Quanto posso guardar este mês?");
    expect(demo.querySelector("input, textarea, button, a, [tabindex]")).toBeNull();
  });

  it("keeps category amounts, percentages, monthly total and balance consistent with the four indicators", () => {
    render(<Showcase />);
    const parseMoney = (text) => Number(text.replace(/[^\d,-]/g, "").replace(",", "."));
    const indicators = screen.getAllByRole("definition").map((node) => parseMoney(node.textContent));
    const month = screen.getByRole("region", { name: "Visão do mês demonstrativa" });
    const rows = within(month).getAllByRole("listitem");
    expect(rows.map((row) => row.querySelector("span:nth-child(2)").firstChild.textContent)).toEqual(["Moradia", "Alimentação", "Transporte"]);
    const amounts = rows.map((row) => parseMoney(row.querySelector("small").textContent));
    expect(amounts).toEqual([950, 550, 350]);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    expect(total).toBe(1850);
    expect(total).toBe(indicators[1]);
    rows.forEach((row, index) => {
      const percent = Number(row.querySelector("strong").textContent.replace("%", "").replace(",", "."));
      expect(percent).toBeCloseTo(amounts[index] / total * 100, 1);
    });
    expect(month.querySelector(".assistant-demo__month-total")).toHaveTextContent(/R\$\s*1.850,00/);
    const balance = parseMoney(month.querySelector(".assistant-demo__month-heading > strong").textContent);
    expect(balance).toBe(1350);
    expect(balance).toBe(indicators[2]);
    expect(balance).toBe(indicators[0] - total);
    const chart = within(month).getByRole("img", { name: /Distribuição das despesas fictícias/ });
    expect(chart.style.background).toContain("conic-gradient");
    expect(chart.style.background).toContain("100%");
  });

  it("renders without network, session or browser storage data", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const send = vi.spyOn(XMLHttpRequest.prototype, "send");
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    render(<Showcase />);
    expect(fetch).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(screen.getByText("Prévia demonstrativa · Dados fictícios")).toBeInTheDocument();
  });
});
