const STORAGE_KEY = "junta_auth_session";

function isValidSession(session) {
  return typeof session?.accessToken === "string" && !!session.accessToken.trim()
    && typeof session.refreshToken === "string" && !!session.refreshToken.trim()
    && Number.isFinite(session.expiresInSeconds) && session.expiresInSeconds > 0;
}

export function getStoredSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const session = JSON.parse(raw);
    // expiresAt is the access token deadline. Without refresh, expired sessions are unusable.
    if (isValidSession(session) && Number.isFinite(session.expiresAt)
      && session.expiresAt > Date.now()) {
      return session;
    }
  } catch {
    // Invalid JSON or unavailable storage must not prevent the app from starting.
  }
  clearSession();
  return null;
}

export function getSessionState() {
  const session = getStoredSession();
  return { isAuthenticated: !!session, expiresAt: session?.expiresAt ?? null };
}

export function saveSession(tokens) {
  if (!isValidSession(tokens)) throw new Error("Invalid authentication response.");
  const session = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresInSeconds: tokens.expiresInSeconds,
    expiresAt: Date.now() + tokens.expiresInSeconds * 1000,
  };
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
    throw new Error("Invalid authentication expiration.");
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable; the in-memory session can still be cleared.
  }
}
