import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beforeSendAnalytics, isAnalyticsEnabled } from "./analytics";

const origin = "https://junta-ai.com";
beforeEach(() => {
  vi.stubEnv("PROD", true);
  vi.stubGlobal("location", new URL(origin));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analytics privacy", () => {
  it.each([
    "/", "/atualizacoes", "/planos", "/sobre", "/contato", "/privacidade",
    "/termos", "/feedback", "/login", "/cadastro", "/assistente", "/planejador",
    "/planejador/historico", "/visao-mes", "/dashboard", "/relatorios",
    "/perfil", "/perfil/excluir-conta",
  ])("sends only the static pathname for %s", (path) => {
    const event = { type: "pageview", url: `${origin}${path}?token=synthetic&email=person%40test.invalid&amount=999#private-message`,
      data: { message: "synthetic conversation", balance: 999 }, route: "/users/private-id" };
    expect(beforeSendAnalytics(event)).toEqual({ type: "pageview", url: `${origin}${path}` });
    expect(event.url).toContain("token=synthetic"); // Sanitizing never changes navigation.
  });

  it.each([
    "/assistente/private-id", "/users/person%40test.invalid", "/unknown",
    "/perfil;token=synthetic", "/%61ssistente", "/dashboard//", "/sobre/private-id/", "//",
  ])("drops unreviewed or identifying paths: %s", (path) => {
    expect(beforeSendAnalytics({ type: "pageview", url: `${origin}${path}` })).toBeNull();
  });

  it.each(["not a URL", "javascript:alert(1)", "https://foreign.test/", "https://person:synthetic@junta-ai.com/"])(
    "drops malformed, foreign or credential-bearing URLs: %s", (url) => {
      expect(beforeSendAnalytics({ type: "pageview", url })).toBeNull();
    },
  );

  it("does not accept custom events or missing events", () => {
    expect(beforeSendAnalytics({ type: "event", url: `${origin}/`, name: "private-event" })).toBeNull();
    expect(beforeSendAnalytics(null)).toBeNull();
  });

  it.each([
    `${origin}/login?token=synthetic`, `${origin}/assistente#private-message`,
    `${origin}/users/private-id`, "https://external.test/person/private-id",
    "https://external.test/?email=person%40test.invalid", "not a URL",
  ])("suppresses events with a potentially sensitive referrer: %s", (referrer) => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
    expect(beforeSendAnalytics({ type: "pageview", url: `${origin}/` })).toBeNull();
  });

  it.each(["", "https://external.test/", `${origin}/sobre`])(
    "accepts an empty, origin-only or known same-site referrer: %s", (referrer) => {
      vi.spyOn(document, "referrer", "get").mockReturnValue(referrer);
      expect(beforeSendAnalytics({ type: "pageview", url: `${origin}/planos` }))
        .toEqual({ type: "pageview", url: `${origin}/planos` });
    },
  );

  it.each([
    "/atualizacoes", "/planos", "/sobre", "/contato", "/privacidade", "/termos",
    "/feedback", "/login", "/cadastro", "/assistente", "/planejador",
    "/planejador/historico", "/visao-mes", "/dashboard", "/relatorios",
    "/perfil", "/perfil/excluir-conta",
  ])("canonicalizes only the trailing slash of a known route: %s", (path) => {
    expect(beforeSendAnalytics({ type: "pageview", url: `${origin}${path}/?token=synthetic#synthetic` }))
      .toEqual({ type: "pageview", url: `${origin}${path}` });
  });

  it("accepts a known same-origin referrer with one trailing slash, still rejecting its parameters", () => {
    const referrer = vi.spyOn(document, "referrer", "get").mockReturnValue(`${origin}/sobre/`);
    expect(beforeSendAnalytics({ type: "pageview", url: `${origin}/planos/` }))
      .toEqual({ type: "pageview", url: `${origin}/planos` });
    referrer.mockReturnValue(`${origin}/sobre/?token=synthetic`);
    expect(beforeSendAnalytics({ type: "pageview", url: `${origin}/planos/` })).toBeNull();
  });

  it.each([
    "https://preview.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173",
    "https://www.junta-ai.com", "https://junta-ai.com.evil.test", "http://junta-ai.com",
    "https://junta-ai.com:8443",
  ])("rejects collection outside the exact production origin: %s", (url) => {
    vi.stubGlobal("location", new URL(url));
    expect(isAnalyticsEnabled()).toBe(false);
    expect(beforeSendAnalytics({ type: "pageview", url: `${url}/` })).toBeNull();
  });

  it("rejects development even on the production origin", () => {
    vi.stubEnv("PROD", false);
    expect(isAnalyticsEnabled()).toBe(false);
    expect(beforeSendAnalytics({ type: "pageview", url: `${origin}/` })).toBeNull();
  });
});
