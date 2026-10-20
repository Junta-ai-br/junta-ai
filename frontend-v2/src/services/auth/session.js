const STORAGE_KEY = "junta_auth_session";
const listeners = new Set();
let notifying = false;
let generation = Symbol();
let observedStorage = null;
let storageInvalidated = false;

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifySession() {
  // Nested mutations are visible to subsequent readers, without recursive delivery.
  if (notifying) return;
  notifying = true;
  try {
    listeners.forEach((listener) => listener());
  } finally {
    notifying = false;
  }
}

function isValidSession(session) {
  return typeof session?.accessToken === "string" && !!session.accessToken.trim()
    && typeof session.refreshToken === "string" && !!session.refreshToken.trim()
    && Number.isFinite(session.expiresInSeconds) && session.expiresInSeconds > 0;
}

export function getStoredSession() {
  let raw;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Only the storage operation is guarded. Reading never publishes notifications.
    return null;
  }
  // A failed logout removal must not resurrect credentials when storage recovers.
  if (storageInvalidated) return null;
  if (raw !== observedStorage) {
    observedStorage = raw;
    generation = Symbol();
  }
  if (raw === null) return null;
  let session;
  try {
    session = JSON.parse(raw);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
  }
  if (isValidSession(session) && Number.isFinite(session.expiresAt)
    && session.expiresAt > Date.now()) return session;
  removeStoredSession();
  return null;
}

// The identity stays local to this module lifetime and never goes on the wire.
export function getAuthenticatedSession() {
  const session = getStoredSession();
  return session ? { ...session, generation } : null;
}

// Consumers can bind work to this session without receiving either token.
export function getSessionSnapshot() {
  const session = getStoredSession();
  return session ? Object.freeze({ generation, expiresAt: session.expiresAt }) : null;
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
  const raw = JSON.stringify(session);
  sessionStorage.setItem(STORAGE_KEY, raw);
  observedStorage = raw;
  storageInvalidated = false;
  // Every establishment is new, even with identical tokens and expiration.
  generation = Symbol();
  notifySession();
  return session;
}

// Mesmo login, tokens novos: a generation é mantida para que nada trate isto como outra conta.
export function renewSession(tokens, expectedGeneration) {
  if (!isValidSession(tokens)) throw new Error("Invalid authentication response.");
  if (!getStoredSession() || generation !== expectedGeneration) return false;
  const session = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresInSeconds: tokens.expiresInSeconds,
    expiresAt: Date.now() + tokens.expiresInSeconds * 1000,
  };
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
    throw new Error("Invalid authentication expiration.");
  }
  const raw = JSON.stringify(session);
  sessionStorage.setItem(STORAGE_KEY, raw);
  observedStorage = raw;
  notifySession();
  return true;
}

function removeStoredSession() {
  observedStorage = null;
  generation = Symbol();
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    storageInvalidated = false;
  } catch {
    storageInvalidated = true;
    // If removal alone fails, erase credentials in place so reload cannot revive them.
    try {
      sessionStorage.setItem(STORAGE_KEY, "null");
    } catch {
      // If all writes are denied, only this module's in-memory invalidation is possible.
    }
  }
}

export function clearSession() {
  removeStoredSession();
  notifySession();
}
