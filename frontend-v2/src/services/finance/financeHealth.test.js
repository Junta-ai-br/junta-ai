import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import { api } from "@/services/api";
import { saveSession, clearSession } from "@/services/auth/session";
import { isOfficialHealthScore, loadOfficialHealthScore } from "./financeHealth";

const period = { from: "2026-10-01", to: "2026-10-31" };
const official = { methodology: "mvp-monthly-v1", status: "CALCULATED", score: 65, classification: "No caminho certo", ...period };
beforeEach(() => { clearSession(); saveSession({ accessToken: "test", refreshToken: "R", expiresInSeconds: 900 }); });
afterEach(() => { clearSession(); vi.restoreAllMocks(); });

describe("official Health Score contract (no local formula)", () => {
  it.each([{ score: 101 }, { score: -1 }, { score: true }, { score: "65" }, { methodology: "old" }, { to: "2026-10-20" }, { classification: "unknown" }])("rejects malformed or incompatible indicators %j", (changes) => {
    expect(isOfficialHealthScore({ ...official, ...changes }, period)).toBe(false);
  });
  it("requires a null numeric score and classification for insufficient data", () => {
    expect(isOfficialHealthScore({ ...official, status: "INSUFFICIENT_DATA", score: null, classification: null }, period)).toBe(true);
    expect(isOfficialHealthScore({ ...official, status: "INSUFFICIENT_DATA", score: 50 }, period)).toBe(false);
  });
  it("preserves large exact totals and returns the backend result without recomputing", async () => {
    api.defaults.adapter = async (config) => ({ config, status: 200, headers: {}, data: `{"from":"${period.from}","to":"${period.to}","totalIncome":99999999999999999.99,"totalExpense":0.01,"balance":99999999999999999.98,"healthScore":${JSON.stringify(official)}}` });
    const value = await loadOfficialHealthScore(period, { income: "99999999999999999.99", expenses: "0.01", balance: "99999999999999999.98" });
    expect(value).toEqual(official);
  });
});
