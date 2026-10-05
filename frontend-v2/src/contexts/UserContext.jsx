import { useCallback, useEffect, useMemo, useState } from "react";

import { UserContext } from "@/contexts/user-context";
import { getSessionState, saveSession, clearSession } from "@/services/auth/session";

import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
} from "@/utils/user";

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(getStoredProfile);
  const [sessionState, setSessionState] = useState(getSessionState);

  useEffect(() => {
    if (sessionState.expiresAt === null) return undefined;
    let timer;
    function checkExpiration() {
      const remaining = sessionState.expiresAt - Date.now();
      if (remaining <= 0) {
        setSessionState(getSessionState());
      } else {
        timer = window.setTimeout(checkExpiration, Math.min(remaining, 2147483647));
      }
    }
    checkExpiration();
    return () => window.clearTimeout(timer);
  }, [sessionState.expiresAt]);

  function establishSession(tokens) {
    saveSession(tokens);
    setSessionState(getSessionState());
  }

  const endSession = useCallback(() => {
    clearSession();
    setSessionState({ isAuthenticated: false, expiresAt: null });
  }, []);

  function updateProfile(partial) {
    setProfile((current) => {
      const next = {
        ...current,
        ...partial,
        notifications: {
          ...current.notifications,
          ...(partial.notifications || {}),
        },
      };

      saveStoredProfile(next);

      return next;
    });
  }

  function replaceProfile(nextProfile) {
    setProfile(nextProfile);
    saveStoredProfile(nextProfile);
  }

  const clearProfile = useCallback(() => {
    endSession();
    clearStoredProfile();
    setProfile({ ...DEFAULT_PROFILE });
  }, [endSession]);

  const value = useMemo(
    () => ({
      profile,
      ...sessionState,
      establishSession,
      endSession,
      updateProfile,
      replaceProfile,
      clearProfile,
    }),
    [profile, sessionState, endSession, clearProfile]
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}
