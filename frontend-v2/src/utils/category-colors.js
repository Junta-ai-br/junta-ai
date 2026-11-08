// Presentation only: keys come from the owned category catalog, never names.
// UUID fallback intentionally preserves legacy/custom colors; collisions are possible.
export const STANDARD_CATEGORY_COLORS = Object.freeze({
  "FOOD": "#008E72",
  "GAMBLING": "#ED0C57",
  "BONUSES": "#ED0CC8",
  "EDUCATION": "#A57E00",
  "LEISURE": "#A05ADB",
  "HOUSING": "#A9613C",
  "OTHER": "#B02AF4",
  "GIFTS_RECEIVED": "#DD40A9",
  "REFUND": "#C04470",
  "EXTRA_INCOME": "#347F8E",
  "SALARY": "#2A6DF4",
  "HEALTH": "#77862D",
  "STREAMING": "#D65324",
  "TRANSPORT": "#4773C4"
});

const CATEGORY_COLORS = ["#7c3aed", "#00a873", "#e07a15", "#cd537a", "#3589cb"];

export function categoryColor(categoryOrId) {
  const category = categoryOrId && typeof categoryOrId === "object" ? categoryOrId : null;
  const key = category?.standardKey;
  if (typeof key === "string" && Object.hasOwn(STANDARD_CATEGORY_COLORS, key)) return STANDARD_CATEGORY_COLORS[key];
  const categoryId = category?.id ?? categoryOrId;
  let hash = 2166136261;
  for (const character of categoryId.toLowerCase()) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return CATEGORY_COLORS[(hash >>> 0) % CATEGORY_COLORS.length];
}
