import { describe, expect, it } from "vitest";
import { localCivilToday } from "./civil-date";
import { currentCivilMonth } from "./finance-provider-store";
import { getCurrentMonthRange } from "./store";

describe("mês atual no dia civil local", () => {
  const lateLastDay = new Date(2026, 9, 31, 22, 0); // 31/10/2026 22:00 locais
  const firstMinute = new Date(2026, 0, 1, 0, 30); // 01/01/2026 00:30 locais

  it("usa o dia local, não o dia UTC", () => {
    expect(localCivilToday(lateLastDay).toISOString().slice(0, 10)).toBe("2026-10-31");
    expect(localCivilToday(firstMinute).toISOString().slice(0, 10)).toBe("2026-01-01");
  });

  it("mantém o mês local no último dia do mês à noite", () => {
    expect(currentCivilMonth(localCivilToday(lateLastDay))).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
    expect(getCurrentMonthRange(localCivilToday(lateLastDay))).toEqual({ start: "2026-10-01", end: "2026-10-31" });
  });

  it("mantém o mês local no primeiro minuto do ano", () => {
    expect(currentCivilMonth(localCivilToday(firstMinute))).toMatchObject({ from: "2026-01-01", to: "2026-01-31" });
  });
});