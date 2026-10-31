import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

const motionState = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  return {
    useReducedMotion: () => motionState.reduced,
    motion: { div: ({ initial, animate, transition, ...props }) => createElement("div", {
      ...props, "data-initial": JSON.stringify(initial), "data-duration": transition?.duration, "data-animate": JSON.stringify(animate),
    }) },
  };
});

import AssistantConversation from "@/components/chat/AssistantConversation";

describe("AssistantConversation", () => {
  it("exposes source choices to keyboard and disables obsolete or sending options", async () => {
    const user = userEvent.setup();
    const option = { option_id: "source_registered", pending_id: "pending", conversation_id: "conversation" };
    const message = { id: "source", type: "assistant", text: "Esses recursos já foram registrados?", quickReplies: [option, { ...option, option_id: "source_unregistered" }] };
    const select = vi.fn();
    const view = render(<AssistantConversation messages={[message]} selectQuickReply={select} />);
    const button = screen.getByRole("button", { name: "Sim, já registrei" });
    button.focus(); await user.keyboard("{Enter}");
    expect(select).toHaveBeenCalledWith(option);
    expect(screen.getByRole("textbox", { name: "Mensagem" })).toBeEnabled();
    view.rerender(<AssistantConversation messages={[message]} selectQuickReply={select} isTyping />);
    expect(button).toBeDisabled();
    expect(screen.getByRole("group", { name: "Origem dos recursos" })).toHaveAttribute("aria-busy", "true");
    view.rerender(<AssistantConversation messages={[message, { id: "later", type: "assistant", text: "Proposta atual" }]} selectQuickReply={select} />);
    expect(button).toBeDisabled();
  });
  it("renders user and assistant message bubbles", () => {
    render(
      <AssistantConversation
        messages={[
          { id: "user-1", type: "user", text: "gastei 25" },
          { id: "assistant-1", type: "assistant", text: "Qual categoria devo usar?" },
        ]}
      />,
    );

    expect(screen.getByText("gastei 25")).toBeInTheDocument();
    expect(screen.getByText("Qual categoria devo usar?")).toBeInTheDocument();
  });

  it("submits the message when the send button is clicked", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn((event) => event.preventDefault());
    const setInputValue = vi.fn();
    const { rerender } = render(
      <AssistantConversation
        inputValue=""
        setInputValue={setInputValue}
        handleSubmit={handleSubmit}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Mensagem" });
  await user.type(input, "Oi");
    expect(setInputValue).toHaveBeenNthCalledWith(1, "O");
    expect(setInputValue).toHaveBeenNthCalledWith(2, "i");

    rerender(
      <AssistantConversation
        inputValue="Oi"
        setInputValue={setInputValue}
        handleSubmit={handleSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.calls[0][0]).toEqual(expect.objectContaining({ type: "submit" }));
  });
  it("shows history immediately and animates only fresh messages without replay on updates", () => {
    const history = { id: "old", type: "assistant", text: "Hist\u00f3rico" };
    const fresh = { id: "new", type: "user", text: "https://example.com/" + "a".repeat(300), fresh: true };
    const { container, rerender } = render(<AssistantConversation messages={[history]} />);
    expect(container.querySelector(".assistant__message")).toHaveAttribute("data-initial", "false");
    rerender(<AssistantConversation messages={[history, fresh]} />);
    const rows = container.querySelectorAll(".assistant__message");
    expect(rows[1]).toHaveAttribute("data-initial", JSON.stringify({ opacity: 0, y: 6 }));
    expect(rows[1]).toHaveAttribute("data-duration", "0.3");
    rerender(<AssistantConversation messages={[history, fresh]} inputValue="Rascunho" />);
    expect(container.querySelectorAll(".assistant__message")[1]).toBe(rows[1]);
    rerender(<AssistantConversation messages={[{ ...fresh, fresh: false }]} conversationId="other" />);
    expect(container.querySelector(".assistant__message")).toHaveAttribute("data-initial", "false");
    expect(screen.getByText(fresh.text)).toBeInTheDocument();
  });

  it("exposes one stable processing status and removes it on completion or error", () => {
    const { rerender } = render(<AssistantConversation isTyping />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Junta.ai está digitando…");
    expect(status).toHaveAttribute("aria-atomic", "true");
    expect(status.querySelector("img")).toHaveAttribute("width", "20");
    rerender(<AssistantConversation isTyping inputValue="Mensagem" />);
    expect(screen.getByRole("status")).toBe(status);
    rerender(<AssistantConversation messages={[{ id: "reply", type: "assistant", text: "Resposta" }]} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(<AssistantConversation isTyping />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<AssistantConversation error="Timeout" recovery={{}} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Timeout");
  });

  it("disables Motion entrance when reduced motion is requested", () => {
    motionState.reduced = true;
    try {
      const { container } = render(<AssistantConversation messages={[{ id: "new", type: "assistant", text: "Resposta", fresh: true }]} />);
      expect(container.querySelector(".assistant__message")).toHaveAttribute("data-initial", "false");
      expect(container.querySelector(".assistant__message")).toHaveAttribute("data-duration", "0");
      expect(screen.getByText("Junta.ai")).toBeInTheDocument();
    } finally { motionState.reduced = false; }
  });

});

describe("contextual message scrolling", () => {
  afterEach(() => { vi.restoreAllMocks(); motionState.reduced = false; });
  const history = Array.from({ length: 60 }, (_, index) => ({ id: `history-${index}`, type: index % 2 ? "assistant" : "user", text: `Message ${index}` }));
  function viewport() {
    const dimensions = { height: 2400, visible: 400 };
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => dimensions.height);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => dimensions.visible);
    return dimensions;
  }
  const readAt = (element, top) => { element.scrollTop = top; fireEvent.scroll(element); };

  it.each(["full", "embedded"])("opens long history at the end of the %s message viewport only", (variant) => {
    viewport();
    const pageScroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { container, rerender } = render(<main className={variant === "embedded" ? "assistant--embedded" : "assistant"}><AssistantConversation loading conversationId="a" messages={[]} /></main>);
    const content = container.querySelector(".assistant__conversation-content");
    rerender(<main className={variant === "embedded" ? "assistant--embedded" : "assistant"}><AssistantConversation conversationId="a" messages={history} /></main>);
    expect(content.scrollTop).toBe(2000);
    expect(pageScroll).not.toHaveBeenCalled();
  });

  it("follows a new response near the end, but preserves a reader consulting older messages", () => {
    const dimensions = viewport();
    const { container, rerender } = render(<AssistantConversation conversationId="a" messages={history} />);
    const content = container.querySelector(".assistant__conversation-content");
    readAt(content, 1960);
    dimensions.height = 2600;
    const reply = { id: "reply", type: "assistant", text: "Reply", fresh: true };
    rerender(<AssistantConversation conversationId="a" messages={[...history, reply]} />);
    expect(content.scrollTop).toBe(2200);
    readAt(content, 500);
    dimensions.height = 2800;
    rerender(<AssistantConversation conversationId="a" messages={[...history, reply, { ...reply, id: "next" }]} />);
    expect(content.scrollTop).toBe(500);
    rerender(<AssistantConversation conversationId="a" messages={[...history, reply, { ...reply, id: "next" }]} inputValue="draft" />);
    expect(content.scrollTop).toBe(500);
  });

  it("reveals processing on explicit submission and stops following when the reader scrolls up", () => {
    const dimensions = viewport();
    const submit = vi.fn((event) => event.preventDefault());
    const { container, rerender } = render(<AssistantConversation conversationId="a" messages={history} handleSubmit={submit} />);
    const content = container.querySelector(".assistant__conversation-content");
    readAt(content, 300);
    fireEvent.submit(container.querySelector("form"));
    expect(submit).toHaveBeenCalledOnce();
    dimensions.height = 2500;
    rerender(<AssistantConversation conversationId="a" messages={history} isTyping handleSubmit={submit} />);
    expect(content.scrollTop).toBe(2100);
    readAt(content, 350);
    dimensions.height = 2700;
    rerender(<AssistantConversation conversationId="a" messages={[...history, { id: "user", type: "user", text: "Sent", fresh: true }, { id: "agent", type: "assistant", text: "Answer", fresh: true }]} handleSubmit={submit} />);
    expect(content.scrollTop).toBe(350);
    expect(submit).toHaveBeenCalledOnce();
  });

  it("keeps processing visible near the end and reveals published user messages without smooth scrolling", () => {
    const dimensions = viewport();
    motionState.reduced = true;
    const { container, rerender } = render(<AssistantConversation conversationId="a" messages={history} />);
    const content = container.querySelector(".assistant__conversation-content");
    readAt(content, 1980);
    dimensions.height = 2460;
    rerender(<AssistantConversation conversationId="a" messages={history} isTyping />);
    expect(content.scrollTop).toBe(2060);
    expect(screen.getByRole("status")).toBeInTheDocument();
    dimensions.height = 2700;
    rerender(<AssistantConversation conversationId="a" messages={[...history, { id: "user", type: "user", text: "Sent", fresh: true }, { id: "agent", type: "assistant", text: "Answer", fresh: true }]} />);
    expect(content.scrollTop).toBe(2300);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("preserves reading position on refresh, resets for another conversation and leaves no work on unmount", () => {
    viewport();
    const { container, rerender, unmount } = render(<AssistantConversation conversationId="a" messages={history} />);
    const content = container.querySelector(".assistant__conversation-content");
    readAt(content, 600);
    rerender(<AssistantConversation conversationId="a" messages={history} loading />);
    rerender(<AssistantConversation conversationId="a" messages={[...history]} />);
    expect(content.scrollTop).toBe(600);
    rerender(<AssistantConversation conversationId="a" messages={history} loading />);
    rerender(<AssistantConversation conversationId="b" messages={history.map((message) => ({ ...message, id: `b-${message.id}` }))} />);
    expect(content.scrollTop).toBe(2000);
    const position = content.scrollTop;
    unmount();
    fireEvent.scroll(content);
    expect(content.scrollTop).toBe(position);
  });
});
