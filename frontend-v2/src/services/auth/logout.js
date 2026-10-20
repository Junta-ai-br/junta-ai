import axios from "axios";
import { getStoredSession } from "./session";

// Melhor esforço: revoga o refresh token no servidor e nunca bloqueia nem falha o logout local.
// O token é lido de forma síncrona, antes de o chamador apagar a sessão.
export function revokeRefreshToken() {
  const session = getStoredSession();
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (!session || !apiUrl) return Promise.resolve(false);
  return axios
    .post("/auth/logout", { refreshToken: session.refreshToken }, { baseURL: apiUrl, timeout: 5000 })
    .then(() => true, () => false);
}