import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { clearSession, getSessionSnapshot, getSessionState, getStoredSession, saveSession } from "./session";
import { refreshSession, startSessionRenewal } from "./refresh";

const tokens = { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 };
const renewed = { accessToken: "access-2", refreshToken: "refresh-2", expiresInSeconds: 900 };

beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear();
  clearSession();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Session renewal", () => {
  it("renews the tokens keeping the same login identity", async () => {
    saveSession(tokens);
    const before = getSessionSnapshot();
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: renewed });
    await expect(refreshSession()).resolves.toBe(true);
    expect(post).toHaveBeenCalledWith("/auth/refresh", { refreshToken: "refresh" },
      expect.objectContaining({ baseURL: "https://backend.example.test" }));
    expect(getStoredSession()).toMatchObject(renewed);
    expect(getSessionSnapshot().generation).toBe(before.generation);
  });

  it("shares one request between simultaneous renewals", async () => {
    saveSession(tokens);
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: renewed });
    await expect(Promise.all([refreshSession(), refreshSession()])).resolves.toEqual([true, true]);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a session", async () => {
    const post = vi.spyOn(axios, "post");
    await expect(refreshSession()).resolves.toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it("ends the session when the backend refuses the refresh token", async () => {
    saveSession(tokens);
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refused"));
    await expect(refreshSession()).resolves.toBe(false);
    expect(getSessionState().isAuthenticated).toBe(false);
  });

  it("ends the session when the response is malformed", async () => {
    saveSession(tokens);
    vi.spyOn(axios, "post").mockResolvedValue({ data: {} });
    await expect(refreshSession()).resolves.toBe(false);
    expect(getSessionState().isAuthenticated).toBe(false);
  });

  it("ignores a late response after another login was established", async () => {
    saveSession(tokens);
    let resolvePost;
    vi.spyOn(axios, "post").mockReturnValue(new Promise((resolve) => { resolvePost = resolve; }));
    const pending = refreshSession();
    saveSession({ accessToken: "other", refreshToken: "other-refresh", expiresInSeconds: 900 });
    resolvePost({ data: renewed });
    await expect(pending).resolves.toBe(false);
    expect(getStoredSession()).toMatchObject({ accessToken: "other" });
  });

  it("schedules the renewal one minute before the access token expires", async () => {
    vi.useFakeTimers();
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: renewed });
    saveSession(tokens);
    const stop = startSessionRenewal();
    await vi.advanceTimersByTimeAsync(839_000);
    expect(post).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(post).toHaveBeenCalledTimes(1);
    stop();
  });
});