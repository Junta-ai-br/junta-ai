import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider } from "./UserContext";
import { useUser } from "./useUser";
import { getStoredSession, saveSession } from "@/services/auth/session";

const tokens = { accessToken: "access-A", refreshToken: "refresh-A", expiresInSeconds: 900 };

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderUser() {
  return renderHook(() => useUser(), { wrapper: UserProvider });
}

describe("UserContext session lifecycle", () => {
  it("restores valid state on remount without exposing either token", () => {
    const session = saveSession(tokens);
    const first = renderUser();
    expect(first.result.current).toMatchObject({ isAuthenticated: true, expiresAt: session.expiresAt });
    expect(first.result.current).not.toHaveProperty("session");
    expect(first.result.current).not.toHaveProperty("accessToken");
    expect(first.result.current).not.toHaveProperty("refreshToken");
    expect(JSON.stringify(first.result.current)).not.toContain(tokens.refreshToken);
    expect(JSON.stringify(first.result.current)).not.toContain(tokens.accessToken);
    first.unmount();
    const restored = renderUser();
    expect(restored.result.current).toMatchObject({ isAuthenticated: true, expiresAt: session.expiresAt });
  });

  it("rejects and removes an expired stored session", () => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...tokens, expiresAt: Date.now() - 1 }));
    const { result } = renderUser();
    expect(result.current).toMatchObject({ isAuthenticated: false, expiresAt: null });
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it("establishes and ends a session without deleting the profile", () => {
    const { result } = renderUser();
    act(() => result.current.updateProfile({ email: "a@example.com", nome: "A" }));
    act(() => result.current.establishSession(tokens));
    expect(result.current.isAuthenticated).toBe(true);
    expect(getStoredSession()).toMatchObject(tokens);
    act(() => result.current.endSession());
    expect(result.current).toMatchObject({ isAuthenticated: false, expiresAt: null });
    expect(getStoredSession()).toBeNull();
    expect(result.current.profile).toMatchObject({ email: "a@example.com", nome: "A" });
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toMatchObject({ email: "a@example.com" });
  });

  it("expires the mounted session without clearing profile or requesting refresh", () => {
    const { result } = renderUser();
    act(() => result.current.updateProfile({ email: "a@example.com" }));
    act(() => result.current.establishSession({ ...tokens, expiresInSeconds: 1 }));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toMatchObject({ isAuthenticated: false, expiresAt: null });
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(result.current.profile.email).toBe("a@example.com");
  });

  it("clears profile and session together", () => {
    const { result } = renderUser();
    act(() => result.current.updateProfile({ email: "a@example.com" }));
    act(() => result.current.establishSession(tokens));
    act(() => result.current.clearProfile());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.profile.email).toBe("");
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
    expect(localStorage.getItem("junta_user_profile")).toBeNull();
  });
});
