/* ==========================================================================
   User Profile Utilities
   ========================================================================== */

const STORAGE_KEY = "junta_user_profile";

export const DEFAULT_NOTIFICATIONS = {
  atualizacoes: true,
  dicas: true,
  lembretes: false,
  convites: true,
  mensagens: false,
};

export const DEFAULT_PROFILE = {
  nome: "",
  email: "",
  whatsapp: "",
  avatarUrl: "",
  notifications: DEFAULT_NOTIFICATIONS,
};

/* ==========================================================================
   Helpers
   ========================================================================== */

function persistProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/* ==========================================================================
   Public API
   ========================================================================== */

export function getStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return { ...DEFAULT_PROFILE };

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      nome: parsed.nome || parsed.name || "",
      avatarUrl: parsed.avatarUrl || parsed.picture || "",
      notifications: {
        ...DEFAULT_NOTIFICATIONS,
        ...(parsed.notifications || {}),
      },
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveStoredProfile(profile) {
  persistProfile(profile);
  return profile;
}

export function clearStoredProfile() {
  localStorage.removeItem(STORAGE_KEY);
}
