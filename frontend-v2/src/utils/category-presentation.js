const CATEGORY_EMOJI = new Map([
  ["Salário", "💼"], ["Reembolso", "💸"], ["Renda Extra", "💰"],
  ["Bônus e Premiações", "🏆"], ["Presentes Recebidos", "🎁"],
  ["Alimentação", "🍽️"], ["Moradia", "🏠"], ["Transporte", "🚗"],
  ["Saúde", "🩺"], ["Educação", "🎓"], ["Lazer", "🎮"],
  ["Streaming", "📺"], ["Apostas", "🎰"], ["Outros", "📦"],
]);

/** Presentation only: never infer a category from a transaction description. */
export function categoryPresentation(categoryName) {
  const name = typeof categoryName === "string" && categoryName.trim() ? categoryName : "Sem categoria";
  // Keep user-defined names and their existing emoji intact.
  const emoji = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(name)
    ? null : CATEGORY_EMOJI.get(name) ?? "📦";
  return { name, emoji };
}
