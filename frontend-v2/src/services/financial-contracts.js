export class FinancialContractError extends Error {
  constructor(message, code = "ERR_API_RESPONSE") {
    super(message);
    this.name = "FinancialContractError";
    this.code = code;
  }
}

export const TRANSACTION_TYPES = Object.freeze(["INCOME", "EXPENSE"]);
export const CATEGORY_TYPES = Object.freeze(["INCOME", "EXPENSE", "BOTH"]);
export const isUuid = (value) => typeof value === "string"
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

// Instant.toString(): UTC with optional fractional seconds (up to nanoseconds).
export function isTimestamp(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?Z$/.test(value)) return false;
  return isDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
}

/** Exact decimal text, positive, at most NUMERIC(19,2); never rounds.
 * Number is supported only within a conservative range where cents round-trip.
 * The caller must supply text for larger values and must not pre-round inputs.
 */
export function normalizeMoney(value, { numericInput = true } = {}) {
  if (typeof value === "number") {
    if (!numericInput || !Number.isFinite(value) || value > 9999999999.99) {
      throw new FinancialContractError("Use decimal text to preserve monetary precision.", "ERR_MONEY_PRECISION");
    }
    value = String(value);
  }
  const match = typeof value === "string" && value.length <= 128
    && /^(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d{1,3}))?$/.exec(value);
  if (!match) throw new FinancialContractError("Invalid monetary decimal.", "ERR_MONEY_PRECISION");
  const exponent = Number(match[3] || 0); // Only the bounded exponent, never the monetary coefficient.
  if (Math.abs(exponent) > 40) throw new FinancialContractError("Monetary decimal out of range.", "ERR_MONEY_PRECISION");
  const digits = match[1] + (match[2] || "");
  const point = match[1].length + exponent;
  const whole = (point <= 0 ? "0" : digits.slice(0, point).padEnd(point, "0")).replace(/^0+(?=\d)/, "");
  const fraction = (point < 0 ? "0".repeat(-point) + digits : digits.slice(point)).replace(/0+$/, "");
  if (whole.length > 17 || fraction.length > 2 || (whole === "0" && !fraction)) {
    throw new FinancialContractError("Amount must be positive and fit NUMERIC(19,2) without rounding.", "ERR_MONEY_PRECISION");
  }
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

export function isTransaction(value) {
  if (!isObject(value) || !isUuid(value.id) || !isUuid(value.categoryId)
    || typeof value.categoryName !== "string" || !TRANSACTION_TYPES.includes(value.type)
    || !(value.description === null || typeof value.description === "string")
    || !isDate(value.transactionDate) || !isTimestamp(value.createdAt)
    || typeof value.amount !== "string") return false;
  return normalizeMoney(value.amount, { numericInput: false }) === value.amount;
}

// Hibernate Validator 8.0.1.Final uses Java String.trim() for @NotBlank:
// only UTF-16 units <= U+0020 are blank. @Size measures the original UTF-16 length.
// This predicate never changes the name itself.
export function isCategoryName(name) {
  if (typeof name !== "string" || name.length < 2 || name.length > 120) return false;
  for (let index = 0; index < name.length; index += 1) {
    if (name.charCodeAt(index) > 0x20) return true;
  }
  return false;
}

export const isCategory = (value) => isObject(value) && isUuid(value.id)
  && isCategoryName(value.name)
  && CATEGORY_TYPES.includes(value.type) && isTimestamp(value.createdAt);

export function isTransactionPage(value) {
  if (!isObject(value) || !Array.isArray(value.content) || !value.content.every(isTransaction)) return false;
  const { number, size, totalElements, totalPages, numberOfElements, first, last, empty } = value;
  return [number, size, totalElements, totalPages, numberOfElements].every(Number.isSafeInteger)
    && number >= 0 && size > 0 && totalElements >= 0 && totalPages >= 0
    && numberOfElements === value.content.length && numberOfElements <= size
    && totalElements >= numberOfElements && totalPages === Math.ceil(totalElements / size)
    && (numberOfElements === 0 || (Number.isSafeInteger(number * size)
      && number * size + numberOfElements <= totalElements))
    && first === (number === 0) && last === (number + 1 >= totalPages)
    && empty === (numberOfElements === 0);
}

/** Inspect numeric amount lexemes before JSON.parse can discard cents.
 * Match complete JSON strings so text inside descriptions is never interpreted as a field.
 * JSON.parse still validates the complete document. No backend wire type is changed.
 */
export function decodeTransactions(raw, _headers, status) {
  if (status !== 200) return raw; // Let Axios preserve the real HTTP error body.
  if (typeof raw !== "string") throw new FinancialContractError("Expected raw transaction JSON.");
  // Check syntax before replacing tokens (e.g. do not repair illegal leading zeros).
  // Discard this result: amounts are taken exclusively from the original text below.
  try { JSON.parse(raw); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new FinancialContractError("Invalid transaction JSON.");
  }
  let expectingAmount = false;
  const replaced = raw.replace(/"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g, (token, offset) => {
    if (expectingAmount) {
      expectingAmount = false;
      if (!/^-?\d/.test(token)) throw new FinancialContractError("Expected numeric JSON amount.");
      return JSON.stringify(normalizeMoney(token, { numericInput: false }));
    }
    if (token.startsWith('"') && /^\s*:/.test(raw.slice(offset + token.length))) {
      try { expectingAmount = JSON.parse(token) === "amount"; }
      catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        throw new FinancialContractError("Invalid JSON string.");
      }
    }
    return token;
  });
  try { return JSON.parse(replaced); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new FinancialContractError("Invalid transaction JSON.");
  }
}

export function encodeTransaction(data, headers) {
  headers.set("Content-Type", "application/json");
  const { amount, ...fields } = data;
  // amount has already been validated; emit an exact JSON number, not a JSON string.
  return `${JSON.stringify(fields).slice(0, -1)},"amount":${normalizeMoney(amount)}}`;
}
