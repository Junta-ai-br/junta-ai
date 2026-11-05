import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Team from "./Team";
import teamMembers from "./teamMembers";

afterEach(cleanup);

describe("About team", () => {
  it("shows four featured humans and alphabetized regular humans followed by Ju", () => {
    const { container } = render(<Team />);
    const names = (selector) => [...container.querySelectorAll(`${selector} .team-card__name`)].map((node) => node.firstChild.textContent);
    expect(names(".team__featured")).toEqual(["Danieli Dutra", "Daniel Ferreira", "Thais Rodrigues", "Simone Frez"]);
    expect(names(".team__members")).toEqual(["Artur Alejandro", "Caio Firmino", "Jordan Fischer", "Larissa Gama", "Maria Eduarda", "Renan Estrela", "Robert Melo", "Ju"]);
    expect(teamMembers.filter((member) => !member.virtual)).toHaveLength(11);
  });

  it("presents Ju as a future virtual character with the official avatar and no social links", () => {
    render(<Team />);
    const card = screen.getByRole("heading", { name: "Ju", exact: true }).closest("article");
    expect(within(card).getByText("Assistente virtual do Junta.ai")).toBeInTheDocument();
    expect(within(card).getByText(/Personagem virtual.*Em breve/)).toBeInTheDocument();
    expect(within(card).getByRole("img")).toHaveAttribute("src", expect.stringContaining("ava-ju.png"));
    expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    expect(card).toHaveClass("team-card--virtual");
    expect(card).not.toHaveClass("team-card--featured");
  });

  it("places the accessible Chile flag next to Artur's name and renders only real social links", () => {
    const { container } = render(<Team />);
    const flag = screen.getByRole("img", { name: "Bandeira do Chile" });
    expect(flag.closest("h3")).toHaveTextContent("Artur Alejandro");
    expect(flag.textContent).toBe("\u{1f1e8}\u{1f1f1}");
    expect(container.querySelector('a[href="#"], a:not([href])')).toBeNull();
    for (const member of teamMembers.filter((member) => !member.virtual)) {
      const card = screen.getByRole("heading", { name: new RegExp(member.name) }).closest("article");
      expect(within(card).getByText(member.role)).toBeInTheDocument();
      expect(within(card).getByRole("link", { name: `GitHub de ${member.name}` })).toHaveAttribute("href", member.github);
    }
  });
});
