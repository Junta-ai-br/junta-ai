import { api, API_URL } from "@/services/api";

export async function loginWithGoogle(idToken) {
  if (!API_URL) throw new Error("API URL is not configured.");
  if (typeof idToken !== "string" || !idToken.trim()) {
    throw new Error("Google ID token is required.");
  }

  const { data } = await api.post("/auth/google", { idToken });
  return data;
}
