import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, saveSession } from "@/services/auth/session";
import useGoals from "./useGoals";
import * as api from "@/services/goals.api";
vi.mock("@/services/goals.api", () => ({ listGoals: vi.fn(), executeGoalCommand: vi.fn(), goalPayload: (body) => body }));
const login = () => saveSession({ accessToken: "synthetic", refreshToken: "synthetic", expiresInSeconds: 3600 });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
beforeEach(() => { vi.clearAllMocks(); clearSession(); login(); api.listGoals.mockResolvedValue([]); });
describe("goal ownership and retries", () => {
  it("does not send a retained account A handler under account B", async () => {
    const { result } = renderHook(useGoals);
    await waitFor(() => expect(result.current.status).toBe("empty"));
    const oldCreate = result.current.create;
    act(() => login());
    await waitFor(() => expect(result.current.status).toBe("empty"));
    await act(async () => oldCreate({ name: "Account A", targetAmount: "100.00" }));
    expect(api.executeGoalCommand).not.toHaveBeenCalled();
  });
  it("discards a previous account response", async () => {
    const old = deferred(); api.listGoals.mockReturnValueOnce(old.promise);
    const { result } = renderHook(useGoals);
    await waitFor(() => expect(api.listGoals).toHaveBeenCalledTimes(1));
    act(() => login());
    await waitFor(() => expect(result.current.status).toBe("empty"));
    await act(async () => old.resolve([{ name: "Other account" }]));
    expect(result.current.goals).toEqual([]);
  });
  it("retries an unknown mutation with the exact command identity and reconciles", async () => {
    api.executeGoalCommand.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({});
    const { result } = renderHook(useGoals);
    await waitFor(() => expect(result.current.status).toBe("empty"));
    await act(async () => result.current.create({ name: "Viagem", targetAmount: "100.00" }));
    expect(result.current.pending).not.toBeNull();
    const first = api.executeGoalCommand.mock.calls[0][0];
    await act(async () => result.current.retry());
    expect(api.executeGoalCommand.mock.calls[1][0]).toBe(first);
    expect(result.current.pending).toBeNull();
    expect(api.listGoals).toHaveBeenCalledTimes(2);
  });
  it("does not publish a mutation response after account change", async () => {
    const old = deferred(); api.executeGoalCommand.mockReturnValueOnce(old.promise);
    const { result } = renderHook(useGoals); await waitFor(() => expect(result.current.status).toBe("empty"));
    let operation; act(() => { operation = result.current.remove("id"); });
    act(() => login()); await waitFor(() => expect(result.current.status).toBe("empty"));
    await act(async () => { old.resolve({}); await operation; });
    expect(result.current.pending).toBeNull(); expect(result.current.goals).toEqual([]);
  });
});
