import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import AssistantConversation from "@/components/chat/AssistantConversation";

describe("AssistantConversation", () => {
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
});
