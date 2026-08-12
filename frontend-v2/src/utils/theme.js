/* ==========================================================================
   Theme Utilities
   ========================================================================== */

const STORAGE_KEY = "theme";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

/* ==========================================================================
   Helpers
   ========================================================================== */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function persistTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

/* ==========================================================================
   Public API
   ========================================================================== */

export function getTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  return savedTheme === THEMES.LIGHT
    ? THEMES.LIGHT
    : THEMES.DARK;
}

export function setTheme(theme) {
  applyTheme(theme);
  persistTheme(theme);
}

export function initializeTheme() {
  applyTheme(getTheme());
}

export function isDarkTheme() {
  return getTheme() === THEMES.DARK;
}

export function isLightTheme() {
  return getTheme() === THEMES.LIGHT;
}