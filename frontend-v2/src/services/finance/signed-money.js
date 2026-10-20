export class SignedMoneyError extends Error {
  constructor(message) {
    super(message);
    this.name = "SignedMoneyError";
    this.code = "ERR_SIGNED_MONEY";
  }
}

// Text only. No whitespace, plus sign, exponent, separators or fractional cents.
export const isSignedMoney = (value) => typeof value === "string"
  && /^-?\d+(?:\.\d{1,2})?$/.exec(value)?.[0] === value;

export function decimalToCents(value) {
  if (!isSignedMoney(value)) throw new SignedMoneyError("Expected signed decimal text with at most two fractional digits.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

export function centsToDecimal(cents) {
  if (typeof cents !== "bigint") throw new SignedMoneyError("Expected BigInt cents.");
  const magnitude = cents < 0n ? -cents : cents;
  return `${cents < 0n ? "-" : ""}${magnitude / 100n}.${String(magnitude % 100n).padStart(2, "0")}`;
}

export const normalizeSignedMoney = (value) => centsToDecimal(decimalToCents(value));
export const addMoney = (left, right) => centsToDecimal(decimalToCents(left) + decimalToCents(right));
export const subtractMoney = (left, right) => centsToDecimal(decimalToCents(left) - decimalToCents(right));

export function compareMoney(left, right) {
  const difference = decimalToCents(left) - decimalToCents(right);
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

export function sumMoney(values) {
  if (!Array.isArray(values)) throw new SignedMoneyError("Expected an array of decimal strings.");
  let total = 0n;
  for (const value of values) total += decimalToCents(value);
  return centsToDecimal(total);
}

/** Decimal string, or BigInt interpreted explicitly as cents. Uses ordinary spaces.
 * magnitude affects display only: it never determines a transaction type.
 */
export function formatMoneyBRL(value, { magnitude = false } = {}) {
  if (typeof magnitude !== "boolean") throw new SignedMoneyError("magnitude must be boolean.");
  const cents = typeof value === "bigint" ? value : decimalToCents(value);
  const [whole, fraction] = centsToDecimal(cents < 0n ? -cents : cents).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cents < 0n && !magnitude ? "-" : ""}R$ ${grouped},${fraction}`;
}
