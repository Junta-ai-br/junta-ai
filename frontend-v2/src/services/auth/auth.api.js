import { api, API_URL } from "@/services/api";

function requireEmailAuthResponse(response, { requesting = false } = {}) {
  const valid = requesting
    ? response.status === 202 && (response.data == null || response.data === "")
    : response.status === 200 && response.data !== null
      && typeof response.data === "object" && !Array.isArray(response.data);
  if (!valid) {
    const error = new Error("Unexpected email authentication response.");
    error.code = "ERR_AUTH_RESPONSE";
    throw error;
  }
  // Session creation validates the token fields before storing anything.
  return response.data;
}

export async function loginWithGoogle(idToken) {
  if (!API_URL) throw new Error("API URL is not configured.");
  if (typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("Google ID token is required.");
  }

  const { data } = await api.post("/auth/google", { idToken });
  return data;
}

export async function requestAccessCode(email) {
  if (!API_URL) throw new Error("API URL is not configured.");
  const response = await api.post("/auth/access-code/request", { email });
  requireEmailAuthResponse(response, { requesting: true });
}

export async function verifyAccessCode(email, code) {
  if (!API_URL) throw new Error("API URL is not configured.");
  const response = await api.post("/auth/access-code/verify", { email, code });
  return requireEmailAuthResponse(response);
}

export async function requestRegistrationCode(email) {
  if (!API_URL) throw new Error("API URL is not configured.");
  const response = await api.post("/auth/register/request-code", { email });
  requireEmailAuthResponse(response, { requesting: true });
}

export async function verifyRegistration(payload) {
  if (!API_URL) throw new Error("API URL is not configured.");
  const response = await api.post("/auth/register/verify", payload);
  return requireEmailAuthResponse(response);
}
