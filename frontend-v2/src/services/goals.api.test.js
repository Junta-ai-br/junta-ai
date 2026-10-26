import { describe, expect, it } from "vitest";
import { decodeGoals, goalPayload, isGoal } from "./goals.api";

describe("goals exact contract", () => {
  it("preserves cents outside the Number safe range and accepts zero progress", () => {
    const goal = decodeGoals('{"id":"11111111-1111-4111-8111-111111111111","name":"Viagem","targetAmount":999999999999999.99,"currentAmount":0,"deadline":null,"status":"IN_PROGRESS"}', {}, 200);
    expect(goal.targetAmount).toBe("999999999999999.99");
    expect(goal.currentAmount).toBe("0.00");
    expect(isGoal(goal)).toBe(true);
  });
  it("does not round fractional cents or interpret names as money", () => {
    expect(() => decodeGoals('{"currentAmount":0.001}', {}, 200)).toThrow();
    expect(decodeGoals('{"name":"targetAmount: 100","currentAmount":1.20}', {}, 200).name).toBe("targetAmount: 100");
    expect(() => goalPayload({ name: "Viagem", targetAmount: "1000000000000000.00" })).toThrow();
    expect(() => goalPayload({ name: "Viagem", targetAmount: "1.001" })).toThrow();
  });
});
