import { describe, expect, it } from "vitest";
import { addMoney, centsToDecimal, compareMoney, decimalToCents, formatMoneyBRL, isSignedMoney,
  normalizeSignedMoney, SignedMoneyError, subtractMoney, sumMoney } from "./signed-money";

describe("signed decimal money", () => {
  it.each([
    ["0.01", 1n, "0.01"], ["-0.01", -1n, "-0.01"], ["0.00", 0n, "0.00"], ["-0.00", 0n, "0.00"],
    ["00012.3", 1230n, "12.30"], ["-00012", -1200n, "-12.00"],
    ["99999999999999999.99", 9999999999999999999n, "99999999999999999.99"],
    ["-99999999999999999.99", -9999999999999999999n, "-99999999999999999.99"],
    ["199999999999999999.98", 19999999999999999998n, "199999999999999999.98"],
  ])("round-trips %s without floating point", (text, cents, canonical) => {
    expect(isSignedMoney(text)).toBe(true);
    expect(decimalToCents(text)).toBe(cents);
    expect(centsToDecimal(cents)).toBe(canonical);
    expect(normalizeSignedMoney(text)).toBe(canonical);
  });

  it.each(["0.001", "1.000", "-1.001", "1e2", "1E-2", "NaN", "Infinity", "-Infinity", "", "+1.00",
    " 1.00", "1.00 ", "1.00\n", "1.00\r\n", "\u00a01.00", "1,00", "1_000.00", "1.", ".01", "--1", "0x10", 1, 0, -0.01, NaN, Infinity, null, undefined, 1n, {}, []])(
    "rejects invalid decimal input case %#", (value) => {
      expect(isSignedMoney(value)).toBe(false);
      expect(() => decimalToCents(value)).toThrow(SignedMoneyError);
    },
  );

  it("adds cents and preserves negative differences exactly", () => {
    expect(addMoney("0.10", "0.20")).toBe("0.30");
    expect(subtractMoney("100.00", "120.00")).toBe("-20.00");
    expect(sumMoney(["100.00", "-120.00", "-0.01"])).toBe("-20.01");
    expect(sumMoney([])).toBe("0.00");
    expect(sumMoney(["1.00", "-1.00"])).toBe("0.00");
    expect(addMoney("99999999999999999.99", "99999999999999999.99")).toBe("199999999999999999.98");
  });

  it.each([["-1.00", "0.00", -1], ["0.01", "-0.01", 1], ["-0.00", "0.00", 0],
    ["99999999999999999.98", "99999999999999999.99", -1]])("compares %s and %s", (left, right, expected) => {
    expect(compareMoney(left, right)).toBe(expected);
  });

  it("uses BigInt cents exclusively and never patches BigInt JSON serialization", () => {
    expect(() => centsToDecimal(1)).toThrow(SignedMoneyError);
    expect(() => centsToDecimal("1")).toThrow(SignedMoneyError);
    expect(() => sumMoney(null)).toThrow(SignedMoneyError);
    expect(() => sumMoney(new Array(1))).toThrow(SignedMoneyError);
    expect(() => sumMoney(["0.01", NaN])).toThrow(SignedMoneyError);
    expect(Object.hasOwn(BigInt.prototype, "toJSON")).toBe(false);
  });
});

describe("exact pt-BR formatting", () => {
  it.each([
    ["0.01", "R$ 0,01"], ["-0.01", "-R$ 0,01"], ["0.00", "R$ 0,00"], ["-0.00", "R$ 0,00"],
    ["-20.00", "-R$ 20,00"], ["1234.5", "R$ 1.234,50"],
    ["99999999999999999.99", "R$ 99.999.999.999.999.999,99"],
    ["-199999999999999999.98", "-R$ 199.999.999.999.999.999,98"],
    [-1n, "-R$ 0,01"],
  ])("formats %s exactly", (value, expected) => expect(formatMoneyBRL(value)).toBe(expected));

  it("formats magnitude only when explicitly requested, without changing the value", () => {
    const amount = "-99999999999999999.99";
    expect(formatMoneyBRL(amount, { magnitude: true })).toBe("R$ 99.999.999.999.999.999,99");
    expect(formatMoneyBRL(amount)).toBe("-R$ 99.999.999.999.999.999,99");
    expect(() => formatMoneyBRL(amount, { magnitude: "true" })).toThrow(SignedMoneyError);
    expect(() => formatMoneyBRL(123.45)).toThrow(SignedMoneyError);
  });
});
