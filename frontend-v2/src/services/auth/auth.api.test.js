import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailAuthError } from "./auth.errors";

afterEach(() => vi.unstubAllEnvs());

async function loadApi(url) {
  vi.stubEnv("VITE_API_URL", url);
  vi.resetModules();
  const { api } = await import("@/services/api");
  const { loginWithGoogle, requestAccessCode, verifyAccessCode, requestRegistrationCode, verifyRegistration } = await import("./auth.api");
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: { accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 }, status: 200, statusText: "OK", headers: {}, config };
  };
  return { api, loginWithGoogle, requestAccessCode, verifyAccessCode, requestRegistrationCode, verifyRegistration, requests };
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

describe("email registration API", () => {
  it("requests registration with email only and accepts an empty 202 response", async () => {
    const { api, requestRegistrationCode, requests } = await loadApi("https://api.example.test");
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return { data: "", status: 202, statusText: "Accepted", headers: {}, config };
    };
    await expect(requestRegistrationCode("ana@example.com")).resolves.toBeUndefined();
    expect(requests[0]).toMatchObject({ method: "post", url: "/auth/register/request-code" });
    expect(JSON.parse(requests[0].data)).toEqual({ email: "ana@example.com" });
  });

  it.each([true, false])("sends the confirmed verification contract (onboarding=%s)", async (onboarding) => {
    const { verifyRegistration, requests } = await loadApi("https://api.example.test");
    const payload = { name: "Ana", email: "ana@example.com", whatsapp: "11999999999", code: "012345",
      ...(onboarding ? { question1: "Reserve", question2: "Spreadsheet", question3: "Save" } : {}) };
    await expect(verifyRegistration(payload)).resolves.toEqual({ accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900 });
    expect(requests[0]).toMatchObject({ method: "post", url: "/auth/register/verify" });
    expect(JSON.parse(requests[0].data)).toEqual(payload);
  });

  it("requires API configuration and propagates failures", async () => {
    const missing = await loadApi("");
    await expect(missing.requestRegistrationCode("ana@example.com")).rejects.toThrow("not configured");
    await expect(missing.verifyRegistration({})).rejects.toThrow("not configured");
    expect(missing.requests).toHaveLength(0);
    const configured = await loadApi("https://api.example.test");
    configured.api.defaults.adapter = async () => { throw new Error("Backend failure"); };
    await expect(configured.requestRegistrationCode("ana@example.com")).rejects.toThrow("Backend failure");
    await expect(configured.verifyRegistration({})).rejects.toThrow("Backend failure");
  });
});

describe("email access code API", () => {
  it("requests a code with only email and accepts an empty 202 response", async () => {
    const { api, requestAccessCode, requests } = await loadApi("https://api.example.test");
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return { data: "", status: 202, statusText: "Accepted", headers: {}, config };
    };
    await expect(requestAccessCode("ana@example.com")).resolves.toBeUndefined();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: "post", url: "/auth/access-code/request" });
    expect(JSON.parse(requests[0].data)).toEqual({ email: "ana@example.com" });
  });

  it("verifies email and code and returns backend tokens", async () => {
    const { verifyAccessCode, requests } = await loadApi("https://api.example.test");
    await expect(verifyAccessCode("ana@example.com", "654321")).resolves.toEqual({
      accessToken: "access", refreshToken: "refresh", expiresInSeconds: 900,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: "post", url: "/auth/access-code/verify" });
    expect(JSON.parse(requests[0].data)).toEqual({ email: "ana@example.com", code: "654321" });
  });

  it("does not send OTP requests without API configuration", async () => {
    const { requestAccessCode, verifyAccessCode, requests } = await loadApi("");
    await expect(requestAccessCode("ana@example.com")).rejects.toThrow("not configured");
    await expect(verifyAccessCode("ana@example.com", "654321")).rejects.toThrow("not configured");
    expect(requests).toHaveLength(0);
  });

  it("propagates request and verification failures", async () => {
    const { api, requestAccessCode, verifyAccessCode } = await loadApi("https://api.example.test");
    api.defaults.adapter = async () => { throw new Error("Backend failure"); };
    await expect(requestAccessCode("ana@example.com")).rejects.toThrow("Backend failure");
    await expect(verifyAccessCode("ana@example.com", "654321")).rejects.toThrow("Backend failure");
  });
});

describe("unexpected email authentication responses", () => {
  it.each([
    [200, "<html>Fallback page</html>"], [200, ""], [204, ""],
    [202, { message: "Unexpected body" }], [202, "<html>Fallback page</html>"],
  ])("rejects request responses with status %s and unexpected body %#", async (status, data) => {
    const auth = await loadApi("https://api.example.test");
    auth.api.defaults.adapter = async (config) => ({ status, data, headers: {}, config });
    for (const request of [auth.requestAccessCode, auth.requestRegistrationCode]) {
      await expect(request("ana@example.com")).rejects.toMatchObject({ code: "ERR_AUTH_RESPONSE" });
    }
  });

  it.each([[200, null], [200, "<html>Fallback page</html>"], [200, []], [202, {}], [204, ""]])(
    "rejects verification responses with status %s and unexpected body %#", async (status, data) => {
      const auth = await loadApi("https://api.example.test");
      auth.api.defaults.adapter = async (config) => ({ status, data, headers: {}, config });
      await expect(auth.verifyAccessCode("ana@example.com", "012345")).rejects.toMatchObject({ code: "ERR_AUTH_RESPONSE" });
      await expect(auth.verifyRegistration({})).rejects.toMatchObject({ code: "ERR_AUTH_RESPONSE" });
    },
  );
});

describe("endpoint-specific email error messages", () => {
  const flows = [
    { registration: true }, { registration: true, verifying: true },
    {}, { verifying: true },
  ];
  it.each(flows)("classifies errors without exposing server details for %j", (options) => {
    const errorFor = (status) => getEmailAuthError({ response: { status, data: { mensagem: "Internal synthetic detail" } } }, options);
    expect(errorFor(400).message).toContain(options.registration ? "Confira os dados" : options.verifying ? "Confira o e-mail e o código" : "Confira o endereço");
    expect(errorFor(401).message).toContain(options.verifying ? "Código inválido ou expirado" : "Não foi possível enviar");
    expect(errorFor(404).accountMissing).toBe(options.verifying && !options.registration ? true : undefined);
    expect(errorFor(409).message).toContain(options.registration ? "já está cadastrado" : "Não foi possível");
    expect(errorFor(429).message).toContain("Muitas tentativas");
    expect(errorFor(503).message).toContain(options.verifying ? "serviço está indisponível" : "envio de e-mail está indisponível");
    for (const status of [500, 502, 504]) {
      expect(errorFor(status).message).toContain("serviço está indisponível");
      expect(errorFor(status).message).not.toMatch(/Código inválido|Internal synthetic/);
    }
    for (const failure of [{ code: "ERR_NETWORK" }, { code: "ECONNABORTED" }, { code: "ETIMEDOUT" }, { request: {} }]) {
      expect(getEmailAuthError(failure, options).message).toContain("Verifique sua conexão");
    }
    for (const failure of [{ code: "ERR_AUTH_RESPONSE" }, new Error("Internal synthetic detail"), undefined]) {
      expect(getEmailAuthError(failure, options).message).toContain(options.verifying ? "Não foi possível confirmar" : "Não foi possível enviar");
    }
  });
});
