const API_URL = import.meta.env.VITE_API_URL || "";

export async function authenticateWithGoogleCode(code) {
  const response = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível concluir o login com Google.");
  }

  return response.json();
}