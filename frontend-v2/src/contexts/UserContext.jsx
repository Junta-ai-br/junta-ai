import { useMemo, useState } from "react";

import { UserContext } from "@/contexts/user-context";

import {
  DEFAULT_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
} from "@/utils/user";

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(getStoredProfile);

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

  function clearProfile() {
    clearStoredProfile();
    setProfile({ ...DEFAULT_PROFILE });
  }

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      replaceProfile,
      clearProfile,
    }),
    [profile]
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}
