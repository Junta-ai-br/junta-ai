import { beforeEach, describe, expect, it } from "vitest";

import { getTheme, initializeTheme, isDarkTheme, isLightTheme, setTheme, THEMES } from "./theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("theme utilities", () => {
  it("defaults to dark for missing or unrecognized stored values", () => {
    expect(getTheme()).toBe(THEMES.DARK);
    localStorage.setItem("theme", "system");
    expect(getTheme()).toBe(THEMES.DARK);
  });

  it("persists and applies the selected theme", () => {
    setTheme(THEMES.LIGHT);

    expect(getTheme()).toBe(THEMES.LIGHT);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(isLightTheme()).toBe(true);
    expect(isDarkTheme()).toBe(false);
  });

  it("initializes the document from the stored theme", () => {
    localStorage.setItem("theme", THEMES.DARK);

    initializeTheme();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(isDarkTheme()).toBe(true);
    expect(isLightTheme()).toBe(false);
  });
});