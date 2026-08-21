import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";

import "./ThemeSwitch.css";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === THEMES.DARK;

  return (
    <button
      type="button"
      className={`theme-switch ${isDark ? "is-dark" : "is-light"}`}
      onClick={toggleTheme}
      aria-label={`Alternar para tema ${isDark ? "claro" : "escuro"}`}
      aria-pressed={isDark}
    >
      <span className="theme-switch__thumb">
        {isDark ? (
          <Moon size={14} strokeWidth={2.4} />
        ) : (
          <Sun size={14} strokeWidth={2.4} />
        )}
      </span>
    </button>
  );
}