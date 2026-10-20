import axios from "axios";
import { clearSession, getAuthenticatedSession } from "./auth/session";

export const API_URL = import.meta.env.VITE_API_URL?.trim();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Protected calls opt in. Public OTP, Google and contact requests stay anonymous.
api.interceptors.request.use((config) => {
  if (!config.requiresAuth) return config;
  if (!API_URL) throw Object.assign(new Error("API URL is not configured."), { code: "API_UNAVAILABLE" });
  const session = getAuthenticatedSession();
  if (!session) throw Object.assign(new Error("Sessão expirada. Entre novamente."), { code: "SESSION_EXPIRED" });
  config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  config.sessionGeneration = session.generation;
  return config;
});

api.interceptors.response.use(undefined, (error) => {
  if (error.config?.requiresAuth && error.response?.status === 401) {
    // An old request must not invalidate a newer login.
    const session = getAuthenticatedSession();
    if (session && error.config.sessionGeneration === session.generation) clearSession();
  }
  // Preserve status, mensagem and campos, including empty security-filter errors.
  // 403 is permission denied, not proof that the session expired. Never retry writes.
  return Promise.reject(error);
});
