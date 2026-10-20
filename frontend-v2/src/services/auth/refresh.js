import axios from "axios";
import { clearSession, getAuthenticatedSession, getSessionSnapshot, renewSession, subscribeSession } from "./session";

// Renova um minuto antes de o token de acesso (15 min) vencer.
const RENEW_BEFORE_MS = 60_000;
const MAX_TIMEOUT_MS = 2147483647;
let inflight = null;
let timer;

async function requestNewTokens(session) {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (!apiUrl) return false;
  try {
    const { data } = await axios.post("/auth/refresh", { refreshToken: session.refreshToken },
      { baseURL: apiUrl, timeout: 15000 });
    return renewSession(data, session.generation);
  } catch {
    // O refresh token antigo pode já ter sido trocado; tentar de novo revogaria todas as sessões.
    if (getSessionSnapshot()?.generation === session.generation) clearSession();
    return false;
  }
}

export function refreshSession() {
  const session = getAuthenticatedSession();
  if (!session) return Promise.resolve(false);
  if (inflight?.generation === session.generation) return inflight.promise;
  const promise = requestNewTokens(session).finally(() => {
    if (inflight?.promise === promise) inflight = null;
  });
  inflight = { generation: session.generation, promise };
  return promise;
}

export function startSessionRenewal() {
  const schedule = () => {
    clearTimeout(timer);
    const session = getSessionSnapshot();
    if (!session) return;
    const delay = Math.min(MAX_TIMEOUT_MS, Math.max(0, session.expiresAt - RENEW_BEFORE_MS - Date.now()));
    timer = setTimeout(() => { refreshSession(); }, delay);
  };
  const unsubscribe = subscribeSession(schedule);
  schedule();
  return () => { clearTimeout(timer); unsubscribe(); };
}