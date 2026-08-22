import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ThemeContext } from "@/contexts/theme-context";

import {
  getTheme,
  setTheme,
  THEMES,
} from "@/utils/theme";

export function ThemeProvider({ children }) {
  const [theme, setCurrentTheme] = useState(getTheme);
  const [isSwitching, setIsSwitching] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function toggleTheme() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSwitching(true);

    setCurrentTheme((current) =>
      current === THEMES.DARK
        ? THEMES.LIGHT
        : THEMES.DARK
    );

    timeoutRef.current = setTimeout(() => {
      setIsSwitching(false);
      timeoutRef.current = null;
    }, 220);
  }

  const value = useMemo(
    () => ({
      theme,
      isSwitching,
      toggleTheme,
    }),
    [theme, isSwitching]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
