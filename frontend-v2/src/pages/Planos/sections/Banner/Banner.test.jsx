import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Banner from "./Banner";

const animation = vi.hoisted(() => ({ reduced: false, props: null }));
vi.mock("motion/react", () => ({
  useReducedMotion: () => animation.reduced,
  motion: {
    div: ({ animate, transition, ...props }) => {
      animation.props = { animate, transition };
      return <div {...props} />;
    },
  },
}));

afterEach(cleanup);

describe("Planos closing banner", () => {
  it.each([false, true])("preserves content and respects reduced motion=%s", (reduced) => {
    animation.reduced = reduced;
    const { container } = render(<Banner />);
    expect(screen.getByRole("heading", { name: "Converse. Entenda. Planeje." })).toBeInTheDocument();
    expect(screen.getByText("Seu dinheiro. Do seu jeito.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teste o Junta.ai" })).toHaveAttribute("href", "/cadastro");
    expect(container.querySelector(".planos-banner__animated-border")).toHaveAttribute("aria-hidden", "true");
    expect(animation.props).toEqual(reduced
      ? { animate: { rotate: 0 }, transition: { duration: 0 } }
      : { animate: { rotate: 360 }, transition: { duration: 12, repeat: Infinity, ease: "linear" } });
  });
});
