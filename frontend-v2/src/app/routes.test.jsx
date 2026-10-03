import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import AppRoutes from "@/app/routes";
import { renderWithFinanceProvider } from "@/test-utils";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

beforeEach(() => {
  localStorage.clear();
});

describe("lazy finance routes", () => {
  it("integrates the Planner route with the shared navigation", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/planejador" });

    expect(await screen.findByRole("heading", { name: "Planeje uma meta do seu jeito." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejador" })).toHaveAttribute("href", "/planejador");
  });
  it("loads the monthly finance view asynchronously", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/visao-mes" });

    expect(await screen.findByRole("heading", { name: "Visão do mês" })).toBeInTheDocument();
  });

  it("loads the reports page asynchronously", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/relatorios" });

    expect(await screen.findByRole("heading", { name: "Relatórios financeiros" })).toBeInTheDocument();
  });
});
