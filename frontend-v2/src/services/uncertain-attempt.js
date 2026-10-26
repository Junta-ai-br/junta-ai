import { getSessionSnapshot, subscribeSession } from "./auth/session";

// Fixed slots, opaque identities only. No tokens, financial payload or messages.
const SESSION = "junta_attempt_session";
const slots = { goals: "junta_uncertain_goal", chat: "junta_uncertain_chat" };
const uuid = (value) => typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
let owner = getSessionSnapshot()?.generation ?? null;
let session;
try { session = owner && sessionStorage.getItem(SESSION); } catch { /* Fail closed on write. */ }
if (!uuid(session)) session = crypto.randomUUID();

function syncOwner() {
  const next = getSessionSnapshot()?.generation ?? null;
  if (next !== owner || !next) {
    owner = next; session = crypto.randomUUID();
    try {
      Object.values(slots).forEach((key) => sessionStorage.removeItem(key));
      sessionStorage.removeItem(SESSION);
    } catch { /* A different session nonce also invalidates remaining markers. */ }
  }
  return next;
}
// Loaded at app startup, so login/logout clears markers even outside Assistente.
subscribeSession(syncOwner);
syncOwner();

export function readAttempt(scope, expectedOwner) {
  if (!syncOwner() || owner !== expectedOwner) return null;
  try {
    const marker = JSON.parse(sessionStorage.getItem(slots[scope]) || "null");
    return marker?.session === session && uuid(marker.key) ? marker.key : null;
  } catch { return null; }
}
export function startAttempt(scope, key, expectedOwner) {
  if (!syncOwner() || owner !== expectedOwner || !uuid(key)) return false;
  const existing = readAttempt(scope, expectedOwner);
  if (existing && existing !== key) return false;
  try {
    sessionStorage.setItem(SESSION, session);
    sessionStorage.setItem(slots[scope], JSON.stringify({ session, key }));
    return true;
  } catch { return false; }
}
export function finishAttempt(scope, key, expectedOwner) {
  if (readAttempt(scope, expectedOwner) !== key) return;
  try { sessionStorage.removeItem(slots[scope]); } catch { /* Keep the warning on reload. */ }
}
