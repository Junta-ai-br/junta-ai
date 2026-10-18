import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, getAuthenticatedSession, getSessionSnapshot, getSessionState, getStoredSession, saveSession, subscribeSession } from "./session";

const tokens = { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 };

beforeEach(() => { sessionStorage.clear(); clearSession(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("Application session", () => {
  it("provides an opaque snapshot tied to every establishment, without tokens", () => {
    expect(getSessionSnapshot()).toBeNull();
    saveSession(tokens);
    const first = getSessionSnapshot();
    expect(Object.keys(first).sort()).toEqual(["expiresAt", "generation"]);
    expect(first.generation).toBe(getAuthenticatedSession().generation);
    saveSession(tokens);
    expect(getSessionSnapshot().generation).not.toBe(first.generation);
    clearSession();
    expect(getSessionSnapshot()).toBeNull();
  });
  it.each(["logout", "401"])("does not restore old tokens after %s removal fails and the module reloads", async (reason) => {
    vi.stubEnv("VITE_API_URL", "https://backend.example.test");
    vi.resetModules();
    const active = await import("./session");
    active.saveSession(tokens);
    const removal = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    if (reason === "logout") {
      active.clearSession();
    } else {
      const { api } = await import("../api");
      const { AxiosError } = await import("axios");
      api.defaults.adapter = async (config) => {
        throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status: 401, config });
      };
      await expect(api.get("/categories", { requiresAuth: true })).rejects.toMatchObject({ response: { status: 401 } });
    }
    expect(active.getSessionState().isAuthenticated).toBe(false);
    expect(sessionStorage.getItem("junta_auth_session")).toBe("null");
    removal.mockRestore();
    // Preserve storage but discard all module state, as on a page reload.
    vi.resetModules();
    const reloaded = await import("./session");
    expect(reloaded.getStoredSession()).toBeNull();
    expect(reloaded.getSessionState()).toEqual({ isAuthenticated: false, expiresAt: null });
    reloaded.saveSession(tokens);
    expect(reloaded.getStoredSession()).toMatchObject(tokens);
  });

  it("stays logged out in memory when both removal and overwrite are unavailable", () => {
    saveSession(tokens);
    const removal = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    expect(() => clearSession()).not.toThrow();
    expect(getSessionState()).toEqual({ isAuthenticated: false, expiresAt: null });
    removal.mockRestore();
    write.mockRestore();
    expect(getStoredSession()).toBeNull();
  });
  it("changes generation on every establishment even when the stored JSON is identical", () => {
    vi.spyOn(Date, "now").mockReturnValue(1800000000000);
    saveSession(tokens);
    const first = getAuthenticatedSession();
    saveSession(tokens);
    const second = getAuthenticatedSession();
    expect(second.accessToken).toBe(first.accessToken);
    expect(second.expiresAt).toBe(first.expiresAt);
    expect(second.generation).not.toBe(first.generation);
    expect(sessionStorage.getItem("junta_auth_session")).not.toContain("generation");
  });

  it("does not publish notifications while reading unavailable storage", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSession(listener);
    try {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
      expect(getSessionState()).toEqual({ isAuthenticated: false, expiresAt: null });
      expect(listener).not.toHaveBeenCalled();
    } finally { unsubscribe(); }
  });

  it("does not recursively deliver nested session notifications", () => {
    const nested = vi.fn(() => clearSession());
    const observer = vi.fn(() => getSessionState());
    const offNested = subscribeSession(nested);
    const offObserver = subscribeSession(observer);
    try {
      clearSession();
      expect(nested).toHaveBeenCalledOnce();
      expect(observer).toHaveBeenCalledOnce();
      expect(observer).toHaveReturnedWith({ isAuthenticated: false, expiresAt: null });
    } finally { offNested(); offObserver(); }
  });

  it("propagates programming errors from subscribers and releases the notification guard", () => {
    const error = new Error("Subscriber bug");
    const off = subscribeSession(() => { throw error; });
    try { expect(() => clearSession()).toThrow(error); } finally { off(); }
    const observer = vi.fn();
    const unsubscribe = subscribeSession(observer);
    try {
      clearSession();
      expect(observer).toHaveBeenCalledOnce();
    } finally { unsubscribe(); }
  });

  it("does not restore credentials left behind by failed logout removal", () => {
    saveSession(tokens);
    const removal = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new DOMException("Denied", "SecurityError"); });
    clearSession();
    removal.mockRestore();
    expect(getStoredSession()).toBeNull();
    saveSession(tokens);
    expect(getStoredSession()).toMatchObject(tokens);
  });
  it("retains all tokens through reload and clears them", () => {
    const tokens = { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 };
    const session = saveSession(tokens);
    expect(session).toMatchObject(tokens);
    expect(getStoredSession()).toEqual(session);
    clearSession();
    expect(getStoredSession()).toBeNull();
  });

  it("does not accept incomplete responses or corrupted storage", () => {
    expect(() => saveSession({ accessToken: "access" })).toThrow();
    expect(getStoredSession()).toBeNull();
    sessionStorage.setItem("junta_auth_session", "{");
    expect(getStoredSession()).toBeNull();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it.each([
    ["expired", -1],
    ["at the expiration deadline", 0],
  ])("removes a session %s, without attempting refresh", (_label, offset) => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...tokens, expiresAt: Date.now() + offset }));
    expect(getStoredSession()).toBeNull();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it.each([undefined, null, "tomorrow", "9999999999999", -1, 0, false])("removes invalid expiresAt: %s", (expiresAt) => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...tokens, expiresAt }));
    expect(getStoredSession()).toBeNull();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it.each([
    { accessToken: undefined }, { accessToken: " " }, { accessToken: 123 },
    { refreshToken: undefined }, { refreshToken: " " },
    { expiresInSeconds: undefined }, { expiresInSeconds: "900" }, { expiresInSeconds: 0 },
  ])("removes sessions with invalid required fields: %j", (invalidFields) => {
    sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...tokens, expiresAt: Date.now() + 900000, ...invalidFields }));
    expect(getStoredSession()).toBeNull();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });

  it("exposes only abstract session state", () => {
    const session = saveSession(tokens);
    expect(getSessionState()).toEqual({ isAuthenticated: true, expiresAt: session.expiresAt });
    clearSession();
    expect(getSessionState()).toEqual({ isAuthenticated: false, expiresAt: null });
  });
});
