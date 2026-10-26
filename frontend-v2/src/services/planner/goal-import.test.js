import { beforeEach, expect, it, vi } from "vitest";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import { api } from "../api";
import { clearSession, saveSession, getSessionSnapshot } from "../auth/session";
import { importPlannerGoal } from "./goal-import";
const id="11111111-1111-4111-8111-111111111111";
beforeEach(() => { clearSession(); saveSession({ accessToken: "synthetic", refreshToken: "synthetic", expiresInSeconds: 3600 }); });
it("uses authenticated HTTP with an idempotency key and only confirmed import fields", async () => {
  let sent;
  api.defaults.adapter = async (config) => {
    sent=config;
    return { config, status:200, headers:{}, data:`{"id":"${id}","name":"Viagem","targetAmount":500.25,"currentAmount":0,"deadline":null,"status":"IN_PROGRESS"}` };
  };
  const key=crypto.randomUUID();
  const result=await importPlannerGoal(id,{deadline:null,confirmReimport:false},key);
  expect(sent.url).toBe(`/planner/simulations/${id}/goal`);
  expect(sent.headers.get("Authorization")).toBe("Bearer synthetic");
  expect(sent.headers.get("Idempotency-Key")).toBe(key);
  expect(JSON.parse(sent.data)).toEqual({deadline:null,confirmReimport:false});
  expect(result.currentAmount).toBe("0.00"); expect(result.targetAmount).toBe("500.25");
});
it("rejects a response from a previous authenticated session", async () => {
  const owner=getSessionSnapshot().generation;
  saveSession({accessToken:"other",refreshToken:"other",expiresInSeconds:3600});
  await expect(importPlannerGoal(id,{deadline:null,confirmReimport:false},crypto.randomUUID(),{sessionGeneration:owner})).rejects.toMatchObject({code:"STALE_SESSION"});
});
