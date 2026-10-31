import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import SavedCard from "./SavedCard";
import { api } from "@/services/api";
import { clearSession, getSessionSnapshot, saveSession } from "@/services/auth/session";
import { invalidateSaved } from "@/services/saved.api";

let value, calls;
const login = (id) => saveSession({ accessToken: id, refreshToken: `R-${id}`, expiresInSeconds: 900 });
const response = (config, saved) => ({ config, status: 200, headers: {}, data: `{"saved":${saved}}` });
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); clearSession(); login("A"); calls = []; value = "200.01";
  api.defaults.adapter = async (config) => { calls.push(config); return response(config, value); };
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); });

it("reads exact persisted saved independently of surrounding monthly filters", async () => {
  const view = render(<SavedCard month="2020-01" />);
  expect(screen.getByText("Carregando…")).toBeInTheDocument();
  await screen.findByText("R$ 200,01");
  view.rerender(<SavedCard month="2026-10" />);
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe("/dashboard");
  value = "1000000000000000.08";
  act(() => invalidateSaved(getSessionSnapshot().generation));
  await screen.findByText("R$ 1.000.000.000.000.000,08");
  value = "0.00";
  act(() => invalidateSaved(getSessionSnapshot().generation));
  await screen.findByText("R$ 0,00");
});

it("hides a previous total on session change and rejects late responses", async () => {
  let resolveOld;
  api.defaults.adapter = (config) => new Promise((resolve) => { resolveOld = () => resolve(response(config, "900.00")); });
  render(<SavedCard />);
  await waitFor(() => expect(resolveOld).toBeTypeOf("function"));
  api.defaults.adapter = async (config) => response(config, "5.00");
  act(() => login("B"));
  await screen.findByText("R$ 5,00");
  await act(async () => resolveOld());
  expect(screen.queryByText("R$ 900,00")).not.toBeInTheDocument();
  act(() => clearSession());
  expect(screen.queryByText("R$ 5,00")).not.toBeInTheDocument();
});

it("does not invent zero on API failure and hides totals while reconciling", async () => {
  api.defaults.adapter = async () => { throw new Error("synthetic"); };
  const view = render(<SavedCard />);
  await screen.findByText("Indisponível");
  expect(screen.getByRole("button", { name: "Atualizar Guardado" })).toBeEnabled();
  view.rerender(<SavedCard waiting />);
  expect(screen.getByText("Carregando…")).toBeInTheDocument();
  expect(screen.queryByText("R$ 0,00")).not.toBeInTheDocument();
});
