import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import { renderWithFinanceProvider } from "@/test-utils";

describe("AuthHeader", () => {
  it("renders navigation links and opens the user menu", () => {
    renderWithFinanceProvider(<AuthHeader activePath="/dashboard" />);

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Planejador" })).toHaveAttribute("href", "/planejador");
    expect(screen.getByRole("link", { name: "Relatórios" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Menu de Usuário" }));
    expect(screen.getByRole("menu", { name: "Opções de Usuário" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Perfil" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders finance actions and dispatches category creation", () => {
    const onAddCategory = vi.fn();
    renderWithFinanceProvider(
      <AuthHeader
        activePath="/dashboard"
        variant="finance"
        dateRange={{ start: "2026-08-01", end: "2026-08-31" }}
        onDateRangeChange={vi.fn()}
        onAddCategory={onAddCategory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "＋ Categoria" }));

    expect(onAddCategory).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: /2026-08-01/ })).toBeInTheDocument();
  });
});
