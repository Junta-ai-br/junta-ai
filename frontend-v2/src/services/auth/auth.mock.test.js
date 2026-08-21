import { describe, expect, it } from "vitest";

import { authenticateWithMock, isValidEmail } from "./auth.mock";

describe("auth mock", () => {
  it("accepts a valid email and the expected token", () => {
    expect(authenticateWithMock({ email: "pessoa@exemplo.com", token: "123456" })).toEqual({
      success: true,
      message: "Acesso liberado. Seja bem-vindo à Junta.ai.",
    });
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("pessoa@exemplo")).toBe(false);
    expect(authenticateWithMock({ email: "pessoa@exemplo", token: "123456" }).success).toBe(false);
  });

  it("rejects an incorrect token", () => {
    expect(authenticateWithMock({ email: "pessoa@exemplo.com", token: "000000" })).toEqual({
      success: false,
      message: "A chave de acesso está incorreta. Confira o código recebido.",
    });
  });

  it("rejects empty fields", () => {
    expect(authenticateWithMock({ email: "", token: "" }).success).toBe(false);
  });
});