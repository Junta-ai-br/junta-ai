import { afterEach, describe, expect, it, vi } from "vitest";
import { validatePublicForm, FORM_LIMITS } from "./public-forms";

const valid = { name: "Ana", email: "ana@example.com", subject: "outro", subjectOther: "Assunto", message: "Linha 1\nLinha 2" };
afterEach(() => vi.unstubAllEnvs());

async function load(url) {
  vi.stubEnv("VITE_API_URL", url);
  vi.resetModules();
  const { api } = await import("./api");
  const service = await import("./public-forms");
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: { status: "sent" }, status: 200, statusText: "OK", headers: {}, config };
  };
  return { api, requests, ...service };
}

describe.each(["contact", "feedback"])("public %s service", (kind) => {
  it("posts the exact public contract without authentication using the existing client", async () => {
    const { api, requests, sendPublicForm } = await load(" https://backend.example.test ");
    api.defaults.headers.common.Authorization = "Bearer existing-session";
    await sendPublicForm(kind, { ...valid, to: "ignored", from: "ignored" });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: "post", url: `/${kind}`, baseURL: "https://backend.example.test", timeout: 15000, withCredentials: false });
    expect(JSON.parse(requests[0].data)).toEqual(valid);
    expect(requests[0].headers.toJSON()).not.toHaveProperty("Authorization");
  });

  it.each([undefined, "", "   "])("makes no request with missing URL %s", async (url) => {
    const { requests, sendPublicForm } = await load(url);
    await expect(sendPublicForm(kind, valid)).rejects.toMatchObject({ code: "API_UNAVAILABLE" });
    expect(requests).toHaveLength(0);
  });

  it("discards stale subjectOther for other subjects", async () => {
    const { requests, sendPublicForm } = await load("https://backend.example.test");
    await sendPublicForm(kind, { ...valid, subject: "sugestao" });
    expect(JSON.parse(requests[0].data).subjectOther).toBe("");
  });

  it.each([[202, { status: "sent" }], [200, {}], [200, { status: "queued" }], [204, ""]])("rejects an unconfirmed %s response", async (status, data) => {
    const { api, sendPublicForm } = await load("https://backend.example.test");
    api.defaults.adapter = async (config) => ({ status, data, headers: {}, config });
    await expect(sendPublicForm(kind, valid)).rejects.toMatchObject({ code: "UNCONFIRMED" });
  });

  it.each([400, 429, 503, "ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"])("propagates %s without retries", async (failure) => {
    const { api, sendPublicForm } = await load("https://backend.example.test");
    const error = typeof failure === "number" ? { response: { status: failure, data: { mensagem: "erro", campos: {} } } } : { code: failure };
    api.defaults.adapter = vi.fn().mockRejectedValue(error);
    await expect(sendPublicForm(kind, valid)).rejects.toEqual(error);
    expect(api.defaults.adapter).toHaveBeenCalledTimes(1);
  });
});

describe("backend-compatible validation", () => {
  it("strips Java whitespace and preserves internal newlines", () => {
    expect(validatePublicForm({ ...valid, name: "\u2003 Ana \u2003", message: " \nLinha 1\n\nLinha 2\n " }, "contact").payload).toEqual({ ...valid, message: "Linha 1\n\nLinha 2" });
    expect(validatePublicForm({ ...valid, name: "\u00a0Ana\u00a0" }, "contact").payload.name).toBe("\u00a0Ana\u00a0");
  });

  it.each(Object.keys(FORM_LIMITS))("rejects blank %s after strip", (key) => {
    expect(validatePublicForm({ ...valid, [key]: " \u2003 " }, "contact").fields).toHaveProperty(key);
  });

  it.each(["name", "subjectOther", "message"])("checks %s limits after normalization", (key) => {
    const limit = FORM_LIMITS[key];
    expect(validatePublicForm({ ...valid, [key]: ` ${"a".repeat(limit)} ` }, "contact").fields).not.toHaveProperty(key);
    expect(validatePublicForm({ ...valid, [key]: "a".repeat(limit + 1) }, "contact").fields).toHaveProperty(key);
  });

  it("counts emoji as two UTF-16 units", () => {
    expect(validatePublicForm({ ...valid, name: "😀".repeat(60) }, "contact").fields).not.toHaveProperty("name");
    expect(validatePublicForm({ ...valid, name: "😀".repeat(61) }, "contact").fields).toHaveProperty("name");
  });

  it("checks email format, email size, subject size and subject membership", () => {
    const boundaryEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;
    for (const email of ["invalid", "a b@example.com", "a@@example.com", "a@!example.com", "a@-example.com", "a..b@example.com", `${"a".repeat(65)}@example.com`, `${boundaryEmail}d`]) {
      expect(validatePublicForm({ ...valid, email }, "contact").fields).toHaveProperty("email");
    }
    expect(boundaryEmail).toHaveLength(254);
    expect(validatePublicForm({ ...valid, email: boundaryEmail }, "contact").fields).not.toHaveProperty("email");
    for (const subject of ["a".repeat(33), "experiencia"]) expect(validatePublicForm({ ...valid, subject }, "contact").fields).toHaveProperty("subject");
    expect(validatePublicForm({ ...valid, subject: "faq" }, "feedback").fields).toHaveProperty("subject");
  });

  it.each(["name", "email", "subject", "subjectOther"])("rejects control characters in %s even at edges", (key) => {
    for (const control of ["\n", "\r", "\u0000", "\u0085", "\u2028", "\u2029"]) {
      expect(validatePublicForm({ ...valid, [key]: valid[key] + control }, "contact").fields).toHaveProperty(key);
    }
  });

  it("ignores subjectOther unless Outro is selected", () => {
    const result = validatePublicForm({ ...valid, subject: "sugestao", subjectOther: "\n".repeat(200) }, "feedback");
    expect(result.fields).toEqual({});
    expect(result.payload.subjectOther).toBe("");
  });
});
