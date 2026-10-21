import { describe, expect, it } from "vitest";
import { getEmailAuthError } from "./auth.errors";

const failure = (status) => ({ response: { status } });

describe("Email OTP rate limit messages", () => {
  it("asks for a new code when the attempts of a code are exhausted", () => {
    expect(getEmailAuthError(failure(429), { verifying: true }).message)
      .toBe("Muitas tentativas com este código. Solicite um novo código.");
  });

  it("asks for a new code when a registration code runs out of attempts", () => {
    expect(getEmailAuthError(failure(429), { verifying: true, registration: true }).message)
      .toBe("Muitas tentativas com este código. Solicite um novo código.");
  });

  it("asks the user to wait when too many codes were requested", () => {
    expect(getEmailAuthError(failure(429)).message)
      .toBe("Muitas tentativas. Aguarde um pouco antes de tentar novamente.");
  });
});