import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import AppRoutes from "@/app/routes";
import Assistente from "./Assistente";
import { loadTransactions } from "@/services/finance/store";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("Assistente chat", () => {
  it("renders the chat composer on the /assistente route", () => {
    localStorage.clear();
    renderWithProviders(<AppRoutes />, { route: "/assistente" });

    expect(screen.getByRole("textbox", { name: "Mensagem" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
  });

  it("asks for an expense category and persists the selected transaction", async () => {
    localStorage.clear();
    const { container } = renderWithProviders(
      <Assistente variant="embedded" className="test-chat" height={280} width={420} />,
      { route: "/assistente" },
    );

    const chat = container.querySelector(".assistant--embedded");
    expect(chat).toHaveClass("test-chat");
    expect(chat.style.getPropertyValue("--assistant-height")).toBe("280px");
    expect(chat.style.getPropertyValue("--assistant-width")).toBe("420px");

    fireEvent.change(screen.getByRole("textbox", { name: "Mensagem" }), {
      target: { value: "gastei 25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(await screen.findByText("Qual categoria devo usar para essa saída?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Alimentação/ }));

    expect(await screen.findByText("Saída registrada em Alimentação. Seus gráficos já foram atualizados.")).toBeInTheDocument();
    expect(loadTransactions()).toEqual(expect.arrayContaining([
      expect.objectContaining({ desc: "Saída via chat", category: "Alimentação", amount: -25 }),
    ]));
  });
});