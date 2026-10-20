import { getSessionSnapshot, subscribeSession } from "../auth/session";
import { useSyncExternalStore } from "react";

let observed;
let key = 0;
function sessionKey() {
  const generation = getSessionSnapshot()?.generation ?? null;
  if (generation !== observed) { observed = generation; key += 1; }
  return key;
}

function subscribe(listener) {
  let timer;
  const changed = () => {
    clearTimeout(timer);
    const session = getSessionSnapshot();
    if (session) timer = setTimeout(changed, Math.min(2147483647, Math.max(1, session.expiresAt - Date.now())));
    listener();
  };
  const unsubscribe = subscribeSession(changed);
  changed();
  return () => { clearTimeout(timer); unsubscribe(); };
}

// Remount only Planner-owned state when the authenticated session changes.
export function usePlannerSessionKey() {
  return useSyncExternalStore(subscribe, sessionKey);
}

export function requirePlannerSession() {
  const session = getSessionSnapshot();
  if (!session) throw Object.assign(new Error("Sessão expirada. Entre novamente."), { code: "SESSION_EXPIRED" });
  return session.generation;
}

export function assertPlannerSession(generation) {
  if (getSessionSnapshot()?.generation !== generation) {
    throw Object.assign(new Error("Sessão alterada. Entre novamente."), { code: "STALE_SESSION" });
  }
}

export function plannerErrorMessage(error, action = "carregar os dados") {
  if (["SESSION_EXPIRED", "STALE_SESSION", "SESSION_CHANGED"].includes(error?.code) || error?.response?.status === 401) return "Sessão expirada ou alterada. Entre novamente.";
  if (error?.response?.status === 403) return "Você não tem permissão para realizar esta operação.";
  if (error?.response?.status === 400) return "Confira os valores e limites do planejamento.";
  if (error?.code === "PLANNER_INVALID") return "Valores inválidos ou fora dos limites seguros do planejador.";
  return `Não foi possível ${action}. Tente novamente.`;
}
