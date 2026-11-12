import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AssistantConversation from "./AssistantConversation";

describe("institutional directions", () => {
  it.each([
    ["Conhecer os planos", "https://junta-ai.com/planos"],
    ["Política de Privacidade", "https://junta-ai.com/privacidade"],
    ["Termos de Uso", "https://junta-ai.com/termos"],
  ])("renders only the approved %s destination in persisted and fresh messages", async (label, url) => {
    const select = vi.fn();
    const view = render(<AssistantConversation messages={[{ id: "history", type: "assistant", text: `Resposta.\n\n${label}: ${url}` }]} selectQuickReply={select} />);
    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", url);
    expect(link).toHaveClass("button--secondary");
    const clicked = vi.fn((event) => event.preventDefault());
    link.addEventListener("click", clicked);
    link.focus();
    expect(link).toHaveFocus();
    await userEvent.setup().keyboard("{Enter}");
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
    view.rerender(<AssistantConversation messages={[{ id: "fresh", type: "assistant", fresh: true, text: `${label}: ${url}` }]} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it.each([
    "Conhecer os planos: https://evil.invalid/planos",
    "Conhecer os planos: https://junta-ai.com/planos?redirect=https://evil.invalid",
    "Conhecer os planos: https://junta-ai.com.evil.invalid/planos",
    "Termos de Uso: https://junta-ai.com/privacidade",
    "[Conhecer os planos](https://junta-ai.com/planos)",
    '<a href="https://evil.invalid">Conhecer os planos</a>',
    "Leia Conhecer os planos: https://junta-ai.com/planos",
    "https://junta-ai.com/planos",
  ])("leaves unapproved content unchanged as text: %s", (text) => {
    render(<AssistantConversation messages={[{ id: "synthetic", type: "assistant", text }]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("does not convert user content or financial quick replies into navigation", () => {
    render(<AssistantConversation messages={[{ id: "user", type: "user", text: "Conhecer os planos: https://junta-ai.com/planos" }]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
