import { useContext } from "react";

import { ThemeContext } from "@/contexts/theme-context";

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme deve ser utilizado dentro de um ThemeProvider."
    );
  }

  return context;
}