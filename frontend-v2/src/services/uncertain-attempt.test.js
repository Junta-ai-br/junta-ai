import { beforeEach, expect, it, vi } from "vitest";
import { clearSession, saveSession, renewSession, getSessionSnapshot } from "./auth/session";
import { readAttempt, startAttempt, finishAttempt } from "./uncertain-attempt";
const tokens = { accessToken: "synthetic-access", refreshToken: "synthetic-refresh", expiresInSeconds: 3600 };
beforeEach(() => { clearSession(); saveSession(tokens); });
it("stores only opaque identifiers and keeps the marker during token renewal", () => {
  const owner = getSessionSnapshot().generation, key = crypto.randomUUID();
  expect(startAttempt("goals", key, owner)).toBe(true);
  expect(Object.keys(JSON.parse(sessionStorage.getItem("junta_uncertain_goal"))).sort()).toEqual(["key", "session"]);
  renewSession({ ...tokens, accessToken: "renewed" }, owner);
  expect(readAttempt("goals", owner)).toBe(key);
  expect(startAttempt("goals", crypto.randomUUID(), owner)).toBe(false);
  finishAttempt("goals", key, owner);
  expect(readAttempt("goals", owner)).toBeNull();
});
it("clears prior attempts on a new login or logout and rejects old handlers", () => {
  const owner = getSessionSnapshot().generation, key = crypto.randomUUID();
  startAttempt("chat", key, owner); saveSession(tokens);
  expect(readAttempt("chat", getSessionSnapshot().generation)).toBeNull();
  expect(startAttempt("chat", key, owner)).toBe(false);
  startAttempt("goals", key, getSessionSnapshot().generation); clearSession();
  expect(sessionStorage.getItem("junta_uncertain_goal")).toBeNull();
});
it("does not dispatch through the marker API when storage cannot preserve identity", () => {
  const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
  expect(startAttempt("goals", crypto.randomUUID(), getSessionSnapshot().generation)).toBe(false);
  spy.mockRestore();
});
it("rehydrates the opaque marker after a fresh module bootstrap", async () => {
  const key = crypto.randomUUID();
  startAttempt("goals", key, getSessionSnapshot().generation);
  vi.resetModules();
  const reloadedSession = await import("./auth/session");
  const reloadedAttempts = await import("./uncertain-attempt");
  expect(reloadedAttempts.readAttempt("goals", reloadedSession.getSessionSnapshot().generation)).toBe(key);
});
