import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import DesktopChatPreview from "./DesktopChatPreview";
import { DEMO_PHASE_MS, DEMO_SCENES } from "./demo-scenes";
import Hero from "@/pages/Landing/sections/Hero/Hero";

const viewport = vi.hoisted(() => ({ visible: true, reduced: false }));
vi.mock("motion/react", () => {
  const domProps = (props) => Object.fromEntries(Object.entries(props).filter(([name]) => !["initial", "animate", "transition"].includes(name)));
  const Element = (props) => <div {...domProps(props)} />;
  const Span = (props) => <span {...domProps(props)} />;
  return { motion: { div: Element, span: Span }, useInView: () => viewport.visible, useReducedMotion: () => viewport.reduced };
});

function visual(container) {
  return within(container.querySelector(".desktop-chat-preview__window"));
}

function tick(ms) {
  act(() => vi.advanceTimersByTime(ms));
}

beforeEach(() => {
  vi.useFakeTimers();
  viewport.visible = true;
  viewport.reduced = false;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("DesktopChatPreview", () => {
  it("preserves the Hero copy and CTAs and provides a stable accessible fictional transcript", () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Organizar sua vida financeira pode começar com uma conversa." })).toBeInTheDocument();
    expect(screen.getByText("Assistente financeiro conversacional")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Experimentar o Junta.ai" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Conhecer a proposta" })).toHaveAttribute("href", "#problem");
    expect(screen.queryByText("Prévia da interface")).not.toBeInTheDocument();
    const figure = screen.getByRole("figure", { name: "Demonstração do assistente Junta.ai" });
    expect(within(figure).getByText("Demonstração ilustrativa · Dados fictícios")).toBeInTheDocument();
    for (const scene of DEMO_SCENES) {
      const transcript = within(screen.getByRole("region", { name: scene.label }));
      expect(transcript.getByText(`Você: ${scene.user}`)).toBeInTheDocument();
      expect(transcript.getByText(`Junta.ai: ${scene.assistant}`)).toBeInTheDocument();
      expect(transcript.getByText(scene.card)).toBeInTheDocument();
    }
    expect(within(figure).queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(figure).queryByRole("button")).not.toBeInTheDocument();
    expect(figure.querySelector("[aria-live], input, textarea, button, a, [tabindex]")).toBeNull();
  });

  it("sequences messages, typing, response, contextual card and both scenes before looping", () => {
    const { container } = render(<DesktopChatPreview />);
    const preview = visual(container);
    expect(preview.queryByText(DEMO_SCENES[0].user)).not.toBeInTheDocument();
    tick(DEMO_PHASE_MS[0]);
    expect(preview.getByText(DEMO_SCENES[0].user)).toBeInTheDocument();
    tick(DEMO_PHASE_MS[1]);
    expect(preview.getByTestId("preview-typing")).toBeInTheDocument();
    tick(DEMO_PHASE_MS[2]);
    expect(preview.queryByTestId("preview-typing")).not.toBeInTheDocument();
    expect(preview.getByText(DEMO_SCENES[0].assistant)).toBeInTheDocument();
    expect(preview.queryByText(DEMO_SCENES[0].card)).not.toBeInTheDocument();
    tick(DEMO_PHASE_MS[3]);
    expect(preview.getByText(DEMO_SCENES[0].card)).toBeInTheDocument();
    tick(DEMO_PHASE_MS[4]); tick(DEMO_PHASE_MS[5]); tick(DEMO_PHASE_MS[0]);
    expect(preview.getByText(DEMO_SCENES[1].user)).toBeInTheDocument();
    for (const delay of DEMO_PHASE_MS.slice(1)) tick(delay);
    expect(preview.getByText(DEMO_SCENES[0].label)).toBeInTheDocument();
  });

  it("does not start outside the viewport and resumes only the remaining phase time", () => {
    viewport.visible = false;
    const { container, rerender, unmount } = render(<DesktopChatPreview />);
    tick(10000);
    expect(visual(container).queryByText(DEMO_SCENES[0].user)).not.toBeInTheDocument();
    viewport.visible = true; rerender(<DesktopChatPreview />);
    tick(200);
    viewport.visible = false; rerender(<DesktopChatPreview />);
    expect(vi.getTimerCount()).toBe(0);
    tick(10000);
    expect(visual(container).queryByText(DEMO_SCENES[0].user)).not.toBeInTheDocument();
    viewport.visible = true; rerender(<DesktopChatPreview />);
    tick(299);
    expect(visual(container).queryByText(DEMO_SCENES[0].user)).not.toBeInTheDocument();
    tick(1);
    expect(visual(container).getByText(DEMO_SCENES[0].user)).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("shows both complete static scenes without scheduling timers when motion is reduced", () => {
    viewport.reduced = true;
    const { container } = render(<DesktopChatPreview />);
    for (const scene of DEMO_SCENES) {
      expect(visual(container).getByText(scene.user)).toBeInTheDocument();
      expect(visual(container).getByText(scene.assistant)).toBeInTheDocument();
      expect(visual(container).getByText(scene.card)).toBeInTheDocument();
    }
    expect(visual(container).queryByTestId("preview-typing")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("runs a full demonstration without issuing network requests", () => {
    const fetch = vi.fn();
    const send = vi.spyOn(XMLHttpRequest.prototype, "send");
    vi.stubGlobal("fetch", fetch);
    render(<DesktopChatPreview />);
    for (let scene = 0; scene < DEMO_SCENES.length; scene++) {
      for (const delay of DEMO_PHASE_MS) tick(delay);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    send.mockRestore();
  });
});
