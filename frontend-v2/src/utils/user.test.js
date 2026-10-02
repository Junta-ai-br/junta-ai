import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_PROFILE, getStoredProfile, saveStoredProfile, clearStoredProfile } from "./user";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("user profile utilities", () => {
  it("returns a default profile when storage is empty or malformed", () => {
    expect(getStoredProfile()).toEqual(DEFAULT_PROFILE);
    localStorage.setItem("junta_user_profile", "{");
    expect(getStoredProfile()).toEqual(DEFAULT_PROFILE);
  });

  it("merges partial profiles and notification preferences with defaults", () => {
    localStorage.setItem("junta_user_profile", JSON.stringify({
      nome: "Ana",
      notifications: { lembretes: true },
    }));

    expect(getStoredProfile()).toEqual({
      ...DEFAULT_PROFILE,
      nome: "Ana",
      notifications: { ...DEFAULT_PROFILE.notifications, lembretes: true },
    });
  });

  it("falls back safely when storage access throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    expect(getStoredProfile()).toEqual(DEFAULT_PROFILE);
  });

  it("saves and clears the profile", () => {
    const profile = { ...DEFAULT_PROFILE, nome: "Ana" };

    expect(saveStoredProfile(profile)).toBe(profile);
    expect(JSON.parse(localStorage.getItem("junta_user_profile"))).toEqual(profile);
    clearStoredProfile();
    expect(localStorage.getItem("junta_user_profile")).toBeNull();
  });
});