import { AxiosError } from "axios";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider } from "./UserContext";
import { useUser } from "./useUser";
import { clearSession, getSessionState, getStoredSession, saveSession } from "@/services/auth/session";

const tokens = { accessToken: "same-access", refreshToken: "same-refresh", expiresInSeconds: 900 };
let api;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear();
  localStorage.clear();
  clearSession();
  ({ api } = await import("@/services/api"));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function renderUser() {
  saveSession(tokens);
  return renderHook(() => useUser(), { wrapper: UserProvider });
}

function pendingRequests() {
  const requests = [];
  api.defaults.adapter = vi.fn((config) => new Promise((resolve, reject) => {
    requests.push({
      reject: (status) => reject(new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status, data: "", config })),
      resolve: () => resolve({ status: 200, data: [], config, headers: {} }),
    });
  }));
  return requests;
}

// Attach the rejection handler immediately, then wait until Axios dispatches.
async function startRequest() {
  const outcome = api.get("/categories", { requiresAuth: true }).catch((error) => error);
  await Promise.resolve();
  await Promise.resolve();
  return { outcome };
}

describe("UserProvider with authenticated HTTP", () => {
  it("expires safely with unavailable storage while the provider is subscribed", () => {
    const { result } = renderUser();
    act(() => result.current.establishSession({ ...tokens, expiresInSeconds: 1 }));
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    expect(getSessionState()).toEqual({ isAuthenticated: false, expiresAt: null });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toMatchObject({ isAuthenticated: false, expiresAt: null });
  });

  it("logs out with unavailable storage and never resurrects the old session", () => {
    const { result } = renderUser();
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    const remove = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    act(() => result.current.endSession());
    expect(result.current).toMatchObject({ isAuthenticated: false, expiresAt: null });
    get.mockRestore();
    remove.mockRestore();
    expect(getStoredSession()).toBeNull();
    act(() => result.current.establishSession(tokens));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it.each([401, 403])("handles current-session %s with a mounted provider", async (status) => {
    const { result } = renderUser();
    act(() => result.current.updateProfile({ email: "a@example.com" }));
    const requests = pendingRequests();
    const { outcome } = await startRequest();
    await act(async () => {
      requests[0].reject(status);
      expect(await outcome).toMatchObject({ response: { status } });
    });
    expect(result.current.isAuthenticated).toBe(status === 403);
    expect(result.current.profile.email).toBe("a@example.com");
    expect(api.defaults.adapter).toHaveBeenCalledTimes(1);
  });

  it.each(["establish", "logout/login", "switch user"])("preserves the new generation after %s and an identical-token late 401", async (transition) => {
    const { result } = renderUser();
    const requests = pendingRequests();
    const { outcome } = await startRequest();
    act(() => {
      if (transition !== "establish") result.current.endSession();
      if (transition === "switch user") result.current.replaceProfile({ email: "b@example.com" });
      result.current.establishSession(tokens);
    });
    const newSession = getStoredSession();
    await act(async () => {
      requests[0].reject(401);
      expect(await outcome).toMatchObject({ response: { status: 401 } });
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(getStoredSession()).toEqual(newSession);
    if (transition === "switch user") expect(result.current.profile.email).toBe("b@example.com");
  });

  it("isolates concurrent old responses and only invalidates the current generation once", async () => {
    const { result } = renderUser();
    const requests = pendingRequests();
    const first = await startRequest();
    const second = await startRequest();
    act(() => result.current.establishSession(tokens));
    const current = await startRequest();
    await act(async () => { requests[1].reject(401); await second.outcome; });
    expect(result.current.isAuthenticated).toBe(true);
    await act(async () => { requests[2].reject(401); await current.outcome; });
    expect(result.current.isAuthenticated).toBe(false);
    act(() => result.current.establishSession(tokens));
    await act(async () => { requests[0].reject(401); await first.outcome; });
    expect(result.current.isAuthenticated).toBe(true);
    expect(api.defaults.adapter).toHaveBeenCalledTimes(3);
  });

  it("preserves a login established after expiration when an old 401 arrives", async () => {
    const { result } = renderUser();
    act(() => result.current.establishSession({ ...tokens, expiresInSeconds: 1 }));
    const requests = pendingRequests();
    const { outcome } = await startRequest();
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isAuthenticated).toBe(false);
    act(() => result.current.establishSession(tokens));
    await act(async () => { requests[0].reject(401); await outcome; });
    expect(result.current.isAuthenticated).toBe(true);
  });
});
