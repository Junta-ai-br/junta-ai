import { describe, expect, it } from "vitest";
import { categoryColor, STANDARD_CATEGORY_COLORS } from "./category-colors";

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

it("assigns fourteen unique colors by immutable identity across users and renames", () => {
  const entries = Object.entries(STANDARD_CATEGORY_COLORS);
  expect(entries).toHaveLength(14);
  expect(new Set(entries.map(([,color])=>color)).size).toBe(14);
  for(const [standardKey,color] of entries) {
    expect(color).toMatch(/^#[0-9A-F]{6}$/);
    expect(categoryColor({id:"one",name:"Original",standardKey})).toBe(color);
    expect(categoryColor({id:"another-user",name:"Renamed",standardKey})).toBe(color);
    expect(Object.fromEntries([...entries].reverse())[standardKey]).toBe(color);
  }
});
it.each([undefined,null,"FUTURE_KEY","constructor","__proto__",{},17])("preserves UUID fallback for legacy or unknown metadata %j", (standardKey) => {
  expect(categoryColor({id:"Legacy-ID",name:"Renamed",standardKey})).toBe(categoryColor("legacy-id"));
});
it("keeps standard colors visible on both themes and legend backgrounds", () => {
  const linear = (value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  const luminance = (hex) => [1,3,5].map(i=>linear(parseInt(hex.slice(i,i+2),16)/255)).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for(const color of Object.values(STANDARD_CATEGORY_COLORS)) for(const background of ["#FFFFFF","#F3F4F6","#171A23","#202636"]) {
    const [dark,light]=[luminance(color),luminance(background)].sort((a,b)=>a-b);
    expect((light+.05)/(dark+.05)).toBeGreaterThanOrEqual(3);
  }
});
