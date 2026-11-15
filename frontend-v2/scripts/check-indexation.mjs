import assert from "node:assert/strict";

const base = new URL(process.argv[2]);
assert(["http:", "https:"].includes(base.protocol) && !base.username && !base.password,
  "Use an HTTP(S) deployment URL without credentials");
const indexable = ["/", "/sobre", "/planos", "/atualizacoes", "/contato", "/privacidade", "/termos"];
const restricted = ["/feedback", "/login", "/cadastro", "/assistente", "/dashboard", "/visao-mes",
  "/relatorios", "/planejador", "/planejador/historico", "/perfil", "/perfil/excluir-conta"];
let failures = 0;
let checked = 0;
for (const [paths, expected] of [[indexable, false], [restricted, true]]) {
  for (const path of paths) {
    const variants = [path, `${path}?seo_check=synthetic`];
    if (path !== "/") variants.push(`${path}/`);
    for (const variant of variants) {
      for (const method of ["GET", "HEAD"]) {
        try {
          const response = await fetch(new URL(variant, base), {
            method, redirect: "manual", signal: AbortSignal.timeout(15000),
          });
          const robots = response.headers.get("x-robots-tag") || "";
          const noindex = /\b(?:noindex|none)\b/i.test(robots);
          await response.body?.cancel();
          assert.equal(response.status, 200, `Unexpected HTTP ${response.status}`);
          assert.equal(noindex, expected, `X-Robots-Tag: ${robots || "(absent)"}`);
          console.log(`PASS ${method} ${variant}`);
        } catch (error) {
          failures++;
          console.error(`FAIL ${method} ${variant}: ${error.message}`);
        }
        checked++;
      }
    }
  }
}
console.log(`${checked} checks; ${failures} failures`);
process.exitCode = failures ? 1 : 0;
