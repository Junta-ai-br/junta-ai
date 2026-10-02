import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import AppRoutes from "@/app/routes";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("recharts", async () => import("@/test/rechartsMock"));

describe("Dashboard", () => {
  it("renders the finance view before the reusable embedded chat", () => {
    localStorage.clear();
    const { container } = renderWithProviders(<AppRoutes />, { route: "/dashboard" });

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Converse com o Assistente" })).toBeInTheDocument();
    expect(screen.getByText("Vamos conversar sobre seu dinheiro?")).toBeInTheDocument();

    const financePage = container.querySelector(".finance-page");
    const footer = container.querySelector(".dashboard-chat");
    const chat = container.querySelector(".assistant--embedded");
    expect(financePage.nextElementSibling).toBe(footer);
    expect(chat).toHaveClass("assistant--embedded");
    expect(chat.style.getPropertyValue("--assistant-height")).toBe("360px");
    expect(chat.style.getPropertyValue("--assistant-width")).toBe("100%");
  });
});