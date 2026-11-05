import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Termos from "./Termos";
import approvedTerms from "./__fixtures__/approved-terms.md?raw";
import termsStyles from "./Termos.css?raw";
import { CONTACT_EMAIL, SECURITY_EMAIL } from "@/utils/institutional-contacts";

const normalize = (text) => text.replace(/\s+/g, " ").trim();
const approvedBlocks = approvedTerms.split(/\n\s*\n/)
  .flatMap((block) => block.startsWith("- ") ? block.split("\n") : [block])
  .map((block) => block.replace(/^#{1,3} /, "").replace(/^- /, "")
    .replace(/\[\*\*([^*]+)\*\*\]\(mailto\\?:[^)]+\)/g, "$1")
    .replaceAll("**", "").trim())
  .filter((block) => block && block !== "---");

afterEach(cleanup);

describe("Terms of use", () => {
  it("preserves all approved headings, paragraphs and list items in order", () => {
    const { container } = render(<Termos />);
    const renderedBlocks = [...container.querySelectorAll("h1, h2, h3, p, li")].map((node) => normalize(node.textContent));
    expect(renderedBlocks).toEqual(approvedBlocks.map(normalize));
    expect(screen.getByText("05/11/2026")).toHaveAttribute("datetime", "2026-11-05");
  });

  it("uses one main heading and fourteen named sections with real lists", () => {
    render(<Termos />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(14);
    headings.forEach((heading, index) => {
      expect(heading.textContent).toMatch(new RegExp(`^${index + 1}\\.`));
      const section = screen.getByRole("region", { name: heading.textContent });
      expect(within(section).getByRole("heading", { level: 2 })).toBe(heading);
    });
    expect(screen.getAllByRole("list")).toHaveLength(6);
    expect(screen.getAllByRole("listitem")).toHaveLength(34);
  });

  it("keeps the approved age requirement under section four as a real subsection", () => {
    render(<Termos />);
    const section = screen.getByRole("region", { name: /^4\./ });
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(within(section).getByRole("heading", { level: 3 })).toHaveTextContent("Idade");
    expect(within(section).getByText(/destinados a pessoas com 18 anos ou mais\./)).toBeInTheDocument();
    expect(within(section).getByText(/declara possuir a idade/)).toBeInTheDocument();
    expect(within(section).getByText(/Caso seja identificado que uma conta/)).toBeInTheDocument();
  });

  it("links both centralized institutional contacts using mailto", () => {
    render(<Termos />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const email of [CONTACT_EMAIL, SECURITY_EMAIL]) {
      expect(screen.getByRole("link", { name: email })).toHaveAttribute("href", `mailto:${email}`);
    }
  });

  it("scopes every CSS selector to Terms to avoid changing Privacy and other pages", () => {
    const selectors = [...termsStyles.matchAll(/([^{}]+)\{/g)]
      .map((match) => match[1].trim()).filter((selector) => !selector.startsWith("@"));
    expect(selectors.length).toBeGreaterThan(0);
    selectors.flatMap((selector) => selector.split(",")).forEach((selector) => {
      expect(selector.trim()).toMatch(/^\.terms-page(?:\b|__)/);
    });
  });
});
