import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";

import AppRoutes from "@/app/routes";
import { renderWithProviders } from "@/test/renderWithProviders";

const title = "A gente evolui. Você ganha novas possibilidades.";
const paragraphs = [
  "TEM NOVIDADE VINDO AÍ",
  'Sabe quando você olha para os seus gastos e pensa: "Tá, mas o que eu faço com essa informação?"',
  "É justamente aí que queremos chegar.",
  "Estamos preparando o Junta.ai para ir além dos números: ajudar você a entender melhor seus hábitos, tirar dúvidas e descobrir possibilidades que façam sentido para o seu momento.",
  "Sem fórmulas mágicas, sem sermão e sem fingir que todo mundo vive a mesma realidade.",
  "E isso é só o começo. Tem muita coisa que a gente ainda quer construir por aqui.",
  "Tem alguma ideia que gostaria de ver no Junta.ai?",
  "Conta pra gente! Afinal, ninguém melhor do que você para dizer o que faz falta. 😉",
];

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(cleanup);

async function openPage() {
  renderWithProviders(<><Location /><AppRoutes /></>, { route: "/atualizacoes" });
  await screen.findByRole("heading", { level: 1, name: title });
}

describe("public updates page", () => {
  it("allows anonymous access and preserves the approved editorial copy and layout landmarks", async () => {
    await openPage();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/atualizacoes$/);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    const article = screen.getByRole("article", { name: title });
    expect(within(article).getAllByRole("paragraph").map((node) => node.textContent.trim())).toEqual(paragraphs);
    expect(article.querySelector("a a, a button, button a, button button, a input, button input")).toBeNull();
    const heading = within(article).getByRole("heading", { level: 1, name: title });
    expect(Array.from(heading.querySelectorAll("span"), (node) => node.textContent)).toEqual(["evolui", "possibilidades"]);
    const question = within(article).getByText('"Tá, mas o que eu faço com essa informação?"', { selector: "strong" });
    expect(question.previousElementSibling.tagName).toBe("BR");
    const invitation = within(article).getAllByRole("paragraph").at(-1);
    expect(invitation.querySelector("br")).toBeNull();
    expect(within(invitation).getByText("falta. 😉")).toHaveClass("updates-page__closing-tail");
  });

  it("links the public footer to the updates route", async () => {
    await openPage();
    expect(within(screen.getByRole("contentinfo")).getByRole("link", { name: "Atualizações" }))
      .toHaveAttribute("href", "/atualizacoes");
  });

  it("provides a single link CTA and navigates to the public feedback form", async () => {
    const user = userEvent.setup();
    await openPage();
    const article = screen.getByRole("article", { name: title });
    const cta = within(article).getByRole("link", { name: "Compartilhar uma ideia", exact: true });
    expect(cta).toHaveAttribute("href", "/feedback");
    expect(within(article).queryByRole("button")).not.toBeInTheDocument();
    await user.click(cta);
    expect(await screen.findByRole("heading", { name: /Tem algo para contar/ })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/feedback$/);
  });
});
