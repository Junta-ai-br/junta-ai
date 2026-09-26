import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { ThemeProvider } from "./ThemeContext";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  it("exposes theme state and actions from ThemeProvider", () => {
    localStorage.clear();
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.theme).toBe("dark");
    expect(result.current.isSwitching).toBe(false);
    expect(result.current.toggleTheme).toEqual(expect.any(Function));
  });

  it("throws a clear error when rendered without its provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useTheme())).toThrow("useTheme deve ser utilizado dentro de um ThemeProvider.");
    consoleError.mockRestore();
  });
});