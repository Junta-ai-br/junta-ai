import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { clearSession, saveSession } from "./session";
import { revokeRefreshToken } from "./logout";

const tokens = { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 };

beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear();
  clearSession();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Server-side logout", () => {
  it("revokes the refresh token on the server", async () => {
    saveSession(tokens);
    const post = vi.spyOn(axios, "post").mockResolvedValue({ status: 204 });
    await expect(revokeRefreshToken()).resolves.toBe(true);
    expect(post).toHaveBeenCalledWith("/auth/logout", { refreshToken: "refresh" },
      expect.objectContaining({ baseURL: "https://backend.example.test" }));
  });

  it("captures the token before the local session is cleared", async () => {
    saveSession(tokens);
    const post = vi.spyOn(axios, "post").mockResolvedValue({ status: 204 });
    const pending = revokeRefreshToken();
    clearSession();
    await pending;
    expect(post).toHaveBeenCalledWith("/auth/logout", { refreshToken: "refresh" }, expect.anything());
  });

  it("does nothing without a session", async () => {
    const post = vi.spyOn(axios, "post");
    await expect(revokeRefreshToken()).resolves.toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it("never throws when the server is unreachable", async () => {
    saveSession(tokens);
    vi.spyOn(axios, "post").mockRejectedValue(new Error("offline"));
    await expect(revokeRefreshToken()).resolves.toBe(false);
  });
});