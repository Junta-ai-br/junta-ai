import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

async function loadApi(url) {
  vi.stubEnv("VITE_API_URL", url);
  vi.resetModules();
  const { api } = await import("@/services/api");
  const { loginWithGoogle } = await import("./auth.api");
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 }, status: 200, statusText: "OK", headers: {}, config };
  };
  return { api, loginWithGoogle, requests };
}

describe("Google authentication API", () => {
  it("posts only idToken to the confirmed endpoint and returns backend data", async () => {
    const { api, loginWithGoogle, requests } = await loadApi("https://api.example.test");
    expect(await loginWithGoogle("google-id-token")).toEqual({ accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 });
    expect(api.defaults.baseURL).toBe("https://api.example.test");
    expect(requests[0].url).toBe("/auth/google");
    expect(requests[0].method).toBe("post");
    expect(JSON.parse(requests[0].data)).toEqual({ idToken: "google-id-token" });
  });

  it("does not send requests without API configuration", async () => {
    const { loginWithGoogle, requests } = await loadApi("");
    await expect(loginWithGoogle("id-token")).rejects.toThrow("not configured");
    expect(requests).toHaveLength(0);
  });

  it("rejects empty credentials and propagates API failures", async () => {
    const { api, loginWithGoogle, requests } = await loadApi("https://api.example.test");
    await expect(loginWithGoogle(" ")).rejects.toThrow("required");
    expect(requests).toHaveLength(0);
    api.defaults.adapter = async () => { throw new Error("Unauthorized"); };
    await expect(loginWithGoogle("id-token")).rejects.toThrow("Unauthorized");
  });
});
