import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPlannerSimulations, savePlannerSimulation } from "./store";

describe("planner store", () => {
  beforeEach(() => localStorage.clear());
  it("loads an empty collection and preserves previous snapshots", () => {
    expect(loadPlannerSimulations()).toEqual([]);
    savePlannerSimulation({ id: "a", goal: { name: "Reserva" } });
    savePlannerSimulation({ id: "b" });
    expect(loadPlannerSimulations().map((item) => item.id)).toEqual(["a", "b"]);
  });
  it("does not duplicate an id", () => {
    savePlannerSimulation({ id: "a" });
    savePlannerSimulation({ id: "a" });
    expect(loadPlannerSimulations()).toHaveLength(1);
  });
  it("preserves malformed data instead of overwriting it", () => {
    localStorage.setItem("junta_planner_simulations", "invalid");
    expect(() => savePlannerSimulation({ id: "a" })).toThrow();
    expect(localStorage.getItem("junta_planner_simulations")).toBe("invalid");
  });
  it("propagates storage failures", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    try { expect(() => savePlannerSimulation({ id: "a" })).toThrow("quota"); }
    finally { spy.mockRestore(); }
  });
});
