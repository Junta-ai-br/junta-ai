import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ inView: false, reduced: false, width: 1440, controls: { start: vi.fn(), stop: vi.fn(), set: vi.fn() } }));
vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  return {
    useReducedMotion: () => state.reduced,
    useInView: () => state.inView,
    useAnimationControls: () => state.controls,
    useScroll: () => ({ scrollYProgress: 0.5 }),
    useTransform: (_value, transform) => transform(0.5),
    motion: { div: ({ initial, animate, ...props }) => createElement("div", { ...props, "data-initial": String(initial), "data-controlled": !!animate }) },
  };
});
import Problem from "./Problem";

const phrases = ["Você sabe quanto gastou.", "Mas sabe por que gastou?", "Números mostram o que aconteceu.", "Contexto explica por que aconteceu.", "Você não precisa de mais gráficos.", "Você precisa de alguém que converse com você."];
beforeEach(() => {
  state.inView = false; state.reduced = false; state.width = 1440;
  Object.values(state.controls).forEach((mock) => mock.mockClear());
  vi.stubGlobal("matchMedia", vi.fn((query) => ({ matches: query.includes("prefers-reduced-motion") ? state.reduced : query.includes("767") ? state.width <= 767 : state.width <= 992, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Problem illustrated narrative", () => {
  it("preserves the approved introduction and all six phrases in reading order", () => {
    const { container } = render(<Problem />);
    expect([...container.querySelectorAll(".problem__story p")].map((p) => p.textContent.trim())).toEqual(phrases);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("A gente aprende a ganhar dinheiro.");
    expect(within(heading).getByText("Mas nem sempre entende e sabe o que faz com ele.")).toBeInTheDocument();
    expect(within(heading).getByText(/Você precisa de mais/)).toHaveTextContent("Você precisa de mais clareza.");
    expect(screen.getByText("O verdadeiro problema")).toBeInTheDocument();
    expect(container.querySelector(".problem__description")).toHaveTextContent("Planilhas, gráficos e aplicativos mostram números. Poucos ajudam você a entender o que eles realmente significam para a sua vida.");
    expect(container.querySelectorAll(".problem__pair")).toHaveLength(3);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("keeps the illustration decorative, reserves image sizes and leaves the character outside motion wrappers", () => {
    const { container } = render(<Problem />);
    const figure = container.querySelector("figure");
    expect(figure).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(figure.querySelectorAll("img")).toHaveLength(9);
    for (const image of figure.querySelectorAll("img")) {
      expect(image).toHaveAttribute("alt", ""); expect(image).toHaveAttribute("width"); expect(image).toHaveAttribute("height");
    }
    expect(figure.querySelector(".problem__person").parentElement).toBe(figure);
    expect(figure.querySelector(".problem__person")).not.toHaveAttribute("style");
  });
  it("animates the independent objects only while in view", () => {
    const view = render(<Problem />);
    expect(state.controls.start).not.toHaveBeenCalled();
    state.inView = true; view.rerender(<Problem />);
    expect(state.controls.start).toHaveBeenCalledTimes(8);
    expect(new Set(state.controls.start.mock.calls.map(([animation]) => animation.transition.duration)).size).toBe(8);
    state.controls.stop.mockClear(); state.inView = false; view.rerender(<Problem />);
    expect(state.controls.stop).toHaveBeenCalled();
    expect(view.container.querySelector("figure")).toHaveAttribute("data-motion", "paused");
  });
  it("pauses when the document becomes hidden", () => {
    state.inView = true;
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const view = render(<Problem />); state.controls.start.mockClear(); state.controls.stop.mockClear();
    visibility.mockReturnValue("hidden");
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(view.container.querySelector("figure")).toHaveAttribute("data-motion", "paused");
    expect(state.controls.start).not.toHaveBeenCalled(); expect(state.controls.stop).toHaveBeenCalled();
  });
  it("resets object movement when reduced motion is preferred", () => {
    state.inView = true; state.reduced = true;
    const { container } = render(<Problem />);
    expect(container.querySelector("figure")).toHaveAttribute("data-motion", "reduced");
    expect(state.controls.start).not.toHaveBeenCalled(); expect(state.controls.set).toHaveBeenCalledTimes(8);
    expect(state.controls.set).toHaveBeenCalledWith({ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 });
  });
  it("does not animate the five objects hidden by the mobile composition", () => {
    state.inView = true; state.width = 390;
    const { container } = render(<Problem />);
    expect(state.controls.start).toHaveBeenCalledTimes(3);
    expect(container.querySelectorAll(".problem__illustration img")).toHaveLength(4);
    expect(container.querySelector(".problem__object--calculator")).toBeNull();
    for (const [animation] of state.controls.start.mock.calls) {
      expect(Math.max(...animation.y.map(Math.abs))).toBeLessThanOrEqual(6);
    }
  });
  it("keeps the landing readable and static when matchMedia is unavailable", () => {
    state.inView = true;
    vi.stubGlobal("matchMedia", undefined);
    const { container } = render(<Problem />);
    expect(container.querySelector("figure")).toHaveAttribute("data-motion", "reduced");
    expect([...container.querySelectorAll(".problem__story p")].map((p) => p.textContent.trim())).toEqual(phrases);
    expect(state.controls.start).not.toHaveBeenCalled();
    expect(state.controls.set).toHaveBeenCalledTimes(8);
  });
});
