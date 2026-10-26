import { describe, expect, it } from "vitest";
import { categoryColor } from "./category-colors";

describe("category chart colors", () => {
  it("preserves identity colors across ranking, casing, renaming and filtering", () => {
    const categories = [{ id: "A1", name: "Food" }, { id: "B2", name: "Travel" }, { id: "C3", name: "Home" }];
    const colors = new Map(categories.map(({ id }) => [id, categoryColor(id)]));
    for (const { id } of categories.toReversed().slice(1).map((item) => ({ ...item, name: "Renamed" }))) {
      expect(categoryColor(id.toLowerCase())).toBe(colors.get(id));
    }
  });
  it("uses multiple colors for category identities", () => {
    expect(new Set(Array.from({ length: 30 }, (_, id) => categoryColor(String(id)))).size).toBe(5);
  });
});
