import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let api, calls, handler, store, loadPlannerTransactions;
const id = "76870c4b-f8df-4eab-b3c2-de1738a07a4e";
const createdAt = "2026-10-19T12:00:00Z";
const dto = { id, categoryId: id, categoryName: "Moradia", type: "EXPENSE", description: null,
  amount: 1000.01, transactionDate: "2026-10-19", createdAt };
const response = { id, createdAt, goalName: "Viagem", goalAmount: 12000, deadlineMonths: 12,
  analysisBase: "no_history", monthlyAmount: 1000, estimatedMonths: 12, historyContext: null };
const simulation = { userId: "forbidden", id: "local", createdAt: "local", period: { type: "no_history" },
  goal: { name: " Viagem ", amount: 12000, deadlineMonths: 12 }, simulation: { monthlyAmount: 1000, estimatedMonths: 12 }, historyContext: null };
const period = { from: "2026-08-01", to: "2026-10-19" };
const page = (content, number = 0, totalElements = content.length, size = 100) => ({ content, number, size,
  totalElements, totalPages: Math.ceil(totalElements / size), numberOfElements: content.length,
  first: number === 0, last: number + 1 >= Math.ceil(totalElements / size), empty: !content.length });
const login = {};

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "https://api.example.test");
  // Session and HTTP modules must share the same session generation.
  ({ saveSession: login.save, clearSession: login.clear } = await import("../auth/session"));
  sessionStorage.clear(); localStorage.clear(); login.save({ accessToken: "A", refreshToken: "refresh", expiresInSeconds: 3600 });
  ({ api } = await import("../api"));
  store = await import("./store");
  ({ loadPlannerTransactions } = await import("./transactions"));
  calls = [];
  handler = () => ({ status: 200, data: response });
  api.defaults.adapter = async (config) => {
    calls.push(config);
    const result = await handler(config);
    return { ...result, data: typeof result.data === "string" ? result.data : JSON.stringify(result.data), config, headers: {} };
  };
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Planner HTTP integration", () => {
  it("creates the exact authenticated payload, using server identity and no local storage", async () => {
    localStorage.setItem("junta_planner_simulations", "old data");
    const read = vi.spyOn(Storage.prototype, "getItem");
    const write = vi.spyOn(Storage.prototype, "setItem");
    const result = await store.savePlannerSimulation(simulation);
    expect(result).toMatchObject({ id, createdAt, goal: { name: "Viagem" } });
    expect(calls[0].url).toBe("/planner/simulations");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer A");
    expect(calls[0].requiresAuth).toBe(true);
    expect(JSON.parse(calls[0].data)).toEqual({ ...response, id: undefined, createdAt: undefined });
    expect(read.mock.calls.some(([key]) => key === "junta_planner_simulations")).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
  it("lists adapted records, accepts an empty history and deletes only the requested id", async () => {
    handler = () => ({ status: 200, data: [response] });
    expect(await store.loadPlannerSimulations()).toEqual([store.simulationView(response)]);
    handler = () => ({ status: 200, data: [] });
    expect(await store.loadPlannerSimulations()).toEqual([]);
    handler = () => ({ status: 204, data: "" });
    await store.removePlannerSimulation(id);
    expect(calls.at(-1)).toMatchObject({ method: "delete", url: `/planner/simulations/${id}`, requiresAuth: true });
  });
  it.each([401, 403, 404, 500])("propagates HTTP %s without retry or local fallback", async (status) => {
    handler = (config) => { throw Object.assign(new Error("HTTP"), { response: { status }, config }); };
    await expect(store.savePlannerSimulation(simulation)).rejects.toMatchObject({ response: { status } });
    expect(calls).toHaveLength(1);
    if (status === 401) expect((await import("../auth/session")).getSessionSnapshot()).toBeNull();
    if (status === 403) expect((await import("../auth/session")).getSessionSnapshot()).not.toBeNull();
  });
  it("rejects absent and expired sessions before dispatch", async () => {
    login.clear();
    await expect(store.loadPlannerSimulations()).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    await expect(store.savePlannerSimulation(simulation)).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    await expect(store.removePlannerSimulation(id)).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(calls).toHaveLength(0);
    const now = Date.now();
    login.save({ accessToken: "expired", refreshToken: "refresh", expiresInSeconds: 1 });
    vi.spyOn(Date, "now").mockReturnValue(now + 2000);
    await expect(loadPlannerTransactions(period)).rejects.toMatchObject({ code: "SESSION_EXPIRED" });
    expect(calls).toHaveLength(0);
  });
  it("discards a response belonging to the previous account", async () => {
    handler = () => { login.save({ accessToken: "B", refreshToken: "refresh", expiresInSeconds: 3600 }); return { status: 200, data: [response] }; };
    await expect(store.loadPlannerSimulations()).rejects.toMatchObject({ code: "STALE_SESSION" });
  });
  it("discards a late POST success after logout", async () => {
    handler = () => { login.clear(); return { status: 200, data: response }; };
    await expect(store.savePlannerSimulation(simulation)).rejects.toMatchObject({ code: "STALE_SESSION" });
    expect(calls).toHaveLength(1);
  });
  it("guards writes if the session switches before Axios dispatch", async () => {
    const pending = store.savePlannerSimulation(simulation);
    login.save({ accessToken: "B", refreshToken: "refresh", expiresInSeconds: 3600 });
    await expect(pending).rejects.toMatchObject({ code: "SESSION_CHANGED" });
    expect(calls).toHaveLength(0);
  });
  it.each([{}, [response, response], [{ ...response, goalAmount: 1.001 }], [{ ...response, createdAt: "bad" }]])("rejects malformed or duplicate list responses %j", async (data) => {
    handler = () => ({ status: 200, data });
    await expect(store.loadPlannerSimulations()).rejects.toThrow();
  });
  it("does not confirm a delete with an invalid response", async () => {
    handler = () => ({ status: 200, data: {} });
    await expect(store.removePlannerSimulation(id)).rejects.toThrow();
    await expect(store.removePlannerSimulation("bad")).rejects.toThrow();
  });
  it("propagates network and timeout failures without retry", async () => {
    handler = () => { throw Object.assign(new Error("timeout"), { code: "ECONNABORTED" }); };
    await expect(store.savePlannerSimulation(simulation)).rejects.toMatchObject({ code: "ECONNABORTED" });
    expect(calls).toHaveLength(1);
  });
  it("loads every page using explicit bounds and adapts sign, category and date", async () => {
    handler = (config) => ({ status: 200, data: config.params.page === 0 ? page([dto], 0, 2, 1) :
      page([{ ...dto, id: "86870c4b-f8df-4eab-b3c2-de1738a07a4e", type: "INCOME" }], 1, 2, 1) });
    const result = await loadPlannerTransactions(period);
    expect(result.map((item) => item.amount)).toEqual([-1000.01, 1000.01]);
    expect(result[0]).toMatchObject({ date: "2026-10-19", category: "Moradia" });
    expect(calls).toHaveLength(2);
    expect(calls[0].params).toEqual({ ...period, page: 0, size: 100, sort: "transactionDate,id,asc" });
    expect(calls[1].params).toEqual({ ...period, page: 1, size: 1, sort: "transactionDate,id,asc" });
    expect(calls.every((call) => call.requiresAuth && call.headers.get("Authorization") === "Bearer A")).toBe(true);
  });
  it("returns a real empty history", async () => {
    handler = () => ({ status: 200, data: page([]) });
    expect(await loadPlannerTransactions(period)).toEqual([]);
  });
  it.each([
    page([dto], 0, 2, 2), page([{ ...dto, transactionDate: "2025-01-01" }]),
    page([{ ...dto, amount: 10000000000 }]), { content: [] },
  ])("rejects incomplete coverage or unsafe transaction values %j", async (data) => {
    handler = () => ({ status: 200, data });
    await expect(loadPlannerTransactions(period)).rejects.toThrow();
  });
  it("does not publish the first page when a subsequent page fails", async () => {
    handler = (config) => {
      if (config.params.page === 1) throw new Error("network");
      return { status: 200, data: page([dto], 0, 2, 1) };
    };
    await expect(loadPlannerTransactions(period)).rejects.toThrow("network");
  });
  it("stops transaction pagination after account replacement", async () => {
    handler = () => { login.save({ accessToken: "B", refreshToken: "refresh", expiresInSeconds: 3600 }); return { status: 200, data: page([dto], 0, 2, 1) }; };
    await expect(loadPlannerTransactions(period)).rejects.toMatchObject({ code: "STALE_SESSION" });
    expect(calls).toHaveLength(1);
  });
});
