// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const routes = readFileSync(new URL("../app/routes.jsx", import.meta.url), "utf8");
const restricted = [
  "/feedback", "/login", "/cadastro", "/assistente", "/dashboard", "/visao-mes",
  "/relatorios", "/planejador", "/planejador/historico", "/perfil", "/perfil/excluir-conta",
];
const indexable = ["/", "/sobre", "/planos", "/atualizacoes", "/contato", "/privacidade", "/termos"];
const robotRules = config.headers.filter(({ headers }) => headers.some(({ key }) => key.toLowerCase() === "x-robots-tag"));

// This tests the deliberately plain regex whitelist, not a Vercel HTTP emulator.
// The real Vercel compiler and deployment are verified separately (SEO-INDEXATION.md).
function robotHeaders(path) {
  const { pathname } = new URL(path, "https://junta-ai.com");
  return robotRules.filter(({ source }) => new RegExp(`^${source}$`).test(pathname))
    .flatMap(({ headers }) => headers.filter(({ key }) => key.toLowerCase() === "x-robots-tag").map(({ value }) => value));
}

describe("HTTP indexation policy", () => {
  it("keeps the approved route inventory explicit and complete", () => {
    expect([...routes.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1]).sort())
      .toEqual([...restricted, ...indexable].sort());
    expect(robotRules).toEqual([{
      source: `/(${restricted.map((path) => path.slice(1)).join("|")})(/?)`,
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    }]);
  });

  it.each(restricted)("marks direct, refreshed and query-bearing %s URLs noindex", (path) => {
    for (const suffix of ["", "/", "?source=synthetic", "/?source=synthetic"]) {
      expect(robotHeaders(path + suffix)).toEqual(["noindex"]);
    }
  });

  it.each(indexable)("does not restrict public %s URLs or their trailing slash variants", (path) => {
    for (const suffix of ["", "?source=synthetic"]) {
      expect(robotHeaders(path + suffix)).toEqual([]);
      if (path !== "/") expect(robotHeaders(path + "/" + suffix)).toEqual([]);
    }
  });

  it.each(["/index.html", "/assets/main.js", "/favicon.svg", "/_vercel/insights/script.js", "/_vercel/insights/view", "/login-help", "/sobre/login", "/perfil-publico", "/planejador-exemplo", "/unknown"])(
    "does not apply a global or prefix-based noindex to %s", (path) => {
      expect(robotHeaders(path)).toEqual([]);
    },
  );

  it("preserves the SPA rewrite and avoids a global robots directive", () => {
    expect(config.rewrites).toEqual([{ source: "/(.*)", destination: "/index.html" }]);
    expect(html).not.toMatch(/<meta\b[^>]*name=["'](?:robots|googlebot)["']/i);
    expect(config.headers.filter(({ source }) => source === "/(.*)")).toHaveLength(1);
    const securityHeaders = config.headers.find(({ source }) => source === "/(.*)").headers;
    expect(securityHeaders.map(({ key }) => key)).toEqual([
      "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy", "Content-Security-Policy-Report-Only",
    ]);
  });
});
