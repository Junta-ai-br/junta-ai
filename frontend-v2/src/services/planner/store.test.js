import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPlannerSimulations, removePlannerSimulation, savePlannerSimulation } from "./store";

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
  it("removes only the requested simulation and returns the remaining snapshots", () => {
    savePlannerSimulation({ id: "a", goal: { name: "Reserva" } });
    savePlannerSimulation({ id: "b" });
    expect(removePlannerSimulation("b")).toEqual([{ id: "a", goal: { name: "Reserva" } }]);
    expect(loadPlannerSimulations()).toEqual([{ id: "a", goal: { name: "Reserva" } }]);
    expect(removePlannerSimulation("missing")).toEqual(loadPlannerSimulations());
  });
  it("rejects non-array storage without overwriting it on save or removal", () => {
    localStorage.setItem("junta_planner_simulations", '{"id":"a"}');
    expect(() => loadPlannerSimulations()).toThrow(/inválido/);
    expect(() => savePlannerSimulation({ id: "b" })).toThrow(/inválido/);
    expect(() => removePlannerSimulation("a")).toThrow(/inválido/);
    expect(localStorage.getItem("junta_planner_simulations")).toBe('{"id":"a"}');
  });
  it("propagates read failures for all store operations", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("read failed"); });
    try {
      expect(() => loadPlannerSimulations()).toThrow("read failed");
      expect(() => savePlannerSimulation({ id: "a" })).toThrow("read failed");
      expect(() => removePlannerSimulation("a")).toThrow("read failed");
    } finally { spy.mockRestore(); }
  });
  it("preserves snapshots when removal cannot be persisted", () => {
    savePlannerSimulation({ id: "a" });
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    try { expect(() => removePlannerSimulation("a")).toThrow("quota"); }
    finally { spy.mockRestore(); }
    expect(loadPlannerSimulations()).toEqual([{ id: "a" }]);
  });
});
