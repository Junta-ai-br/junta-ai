import { describe, expect, it } from "vitest";
import { categoryPresentation } from "./category-presentation";

const approved = [
  ["Salário", "💼"], ["Reembolso", "💸"], ["Renda Extra", "💰"],
  ["Bônus e Premiações", "🏆"], ["Presentes Recebidos", "🎁"],
  ["Alimentação", "🍽️"], ["Moradia", "🏠"], ["Transporte", "🚗"],
  ["Saúde", "🩺"], ["Educação", "🎓"], ["Lazer", "🎮"],
  ["Streaming", "📺"], ["Apostas", "🎰"], ["Outros", "📦"],
];
describe("category presentation", () => {
  it.each(approved)("uses the approved presentation for %s", (name, emoji) => {
    expect(categoryPresentation(name)).toEqual({ name, emoji });
  });
  it("preserves personalized names, including existing emoji, without inferring a category", () => {
    expect(categoryPresentation("Viagem da família")).toEqual({ name: "Viagem da família", emoji: "📦" });
    expect(categoryPresentation("Educação 💜")).toEqual({ name: "Educação 💜", emoji: null });
    expect(categoryPresentation("Pix")).toEqual({ name: "Pix", emoji: "📦" });
    expect(categoryPresentation(null).name).toBe("Sem categoria");
  });
});
