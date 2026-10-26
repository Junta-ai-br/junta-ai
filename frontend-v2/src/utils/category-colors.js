// Shared with the Assistant's monthly overview. Identity, never display order,
// determines the color so filtering, sorting and renaming keep charts consistent.
const CATEGORY_COLORS = ["#7c3aed", "#00a873", "#e07a15", "#cd537a", "#3589cb"];

export function categoryColor(categoryId) {
  let hash = 2166136261;
  for (const character of categoryId.toLowerCase()) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return CATEGORY_COLORS[(hash >>> 0) % CATEGORY_COLORS.length];
}
