import { describe, expect, it } from "vitest";

import { isValidEmail } from "./auth.mock";

describe("email validation", () => {
  it.each(["pessoa@exemplo.com", " pessoa@exemplo.com "])("accepts %j", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(["", "pessoa@exemplo", "pessoa", "pessoa @exemplo.com"])("rejects %j", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});
