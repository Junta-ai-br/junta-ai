import { beforeEach, describe, expect, it } from "vitest";
import { clearSession, getSessionState, getStoredSession, saveSession } from "./session";

const tokens = { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 };

beforeEach(() => sessionStorage.clear());

describe("Application session", () => {
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
