import { resourceRequest } from "./resource-http";

// Exclusão definitiva da conta e de todos os dados (backend: DELETE /users/me, resposta 204).
export function deleteMyAccount({ signal } = {}) {
  return resourceRequest("delete", "/users/me", { signal });
}