// Static route names only: never send arbitrary paths, query strings or hashes.
const paths = new Set([
  "/", "/atualizacoes", "/planos", "/sobre", "/contato", "/privacidade",
  "/termos", "/feedback", "/login", "/cadastro", "/assistente", "/planejador",
  "/planejador/historico", "/visao-mes", "/dashboard", "/relatorios",
  "/perfil", "/perfil/excluir-conta",
]);

export function isAnalyticsEnabled() {
  return import.meta.env.PROD && location.origin === "https://junta-ai.com";
}

function canonicalPath(pathname) {
  // Accept one optional trailing slash, never prefixes, IDs or repeated slashes.
  return pathname !== "/" && pathname.endsWith("/") && !pathname.endsWith("//")
    ? pathname.slice(0, -1) : pathname;
}

export function beforeSendAnalytics(event) {
  if (!isAnalyticsEnabled() || event?.type !== "pageview") return null;

  try {
    const url = new URL(event.url);
    const pathname = canonicalPath(url.pathname);
    if (url.origin !== location.origin || url.username || url.password
        || !paths.has(pathname)) return null;

    // The SDK also reports the initial referrer; beforeSend only rewrites url.
    // Suppress events when that separate value could expose parameters or IDs.
    if (document.referrer) {
      const referrer = new URL(document.referrer);
      if (referrer.search || referrer.hash || referrer.username || referrer.password
          || (referrer.pathname !== "/"
            && (referrer.origin !== url.origin || !paths.has(canonicalPath(referrer.pathname))))) return null;
    }

    // Do not forward additional properties, even if a future caller supplies them.
    return { type: "pageview", url: `${url.origin}${pathname}` };
  } catch {
    return null;
  }
}
