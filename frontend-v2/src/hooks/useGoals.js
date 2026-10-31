import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/services/auth/session";
import { executeGoalCommand, goalPayload, listGoals } from "@/services/goals.api";
import { readAttempt, startAttempt, finishAttempt } from "@/services/uncertain-attempt";
import { invalidateSaved } from "@/services/saved.api";

const generation = () => getSessionSnapshot()?.generation ?? null;
const initial = (owner) => ({ owner, goals: [], status: "loading", error: "", busy: false, pending: null });
export default function useGoals() {
  const owner = useSyncExternalStore(subscribeSession, generation);
  const [state, setState] = useState(() => initial(owner));
  const lease = useRef(null);
  const current = (active) => lease.current === active && generation() === active?.owner && !active.controller.signal.aborted;
  const reload = useCallback(async () => {
    const active = lease.current;
    if (!active || !current(active)) return;
    const sequence = ++active.sequence;
    setState((s) => ({ ...s, goals: [], status: "loading", error: "" }));
    try {
      const goals = await listGoals(active.owner, active.controller.signal);
      if (current(active) && sequence === active.sequence) setState((s) => ({ ...s, goals, status: goals.length ? "success" : "empty" }));
    } catch (error) {
      if (current(active) && sequence === active.sequence) {
        setState((s) => ({ ...s, goals: [], status: "error", error: "Não foi possível carregar suas metas. Tente novamente." }));
        throw error;
      }
    }
  }, []);
  useEffect(() => {
    const restored = readAttempt("goals", owner);
    const active = { owner, controller: new AbortController(), sequence: 0, command: null, busy: false, restored };
    lease.current = active;
    queueMicrotask(() => {
      if (lease.current !== active) return;
      setState({ ...initial(owner), pending: restored ? { key: restored, reloaded: true } : null });
      if (owner) reload().catch(() => {});
      else setState({ ...initial(owner), status: "error", error: "Entre novamente para consultar suas metas." });
    });
    // Session storage expiration does not emit an event by itself.
    const timer = owner ? setInterval(() => {
      if (!current(active)) { active.controller.abort(); setState(initial(null)); }
    }, 1000) : null;
    return () => { clearInterval(timer); active.controller.abort(); if (lease.current === active) lease.current = null; };
  }, [owner, reload]);

  async function run(command) {
    const active = lease.current;
    if (!current(active) || active.owner !== owner || active.busy || active.restored || (active.command && active.command !== command)) return false;
    if (!startAttempt("goals", command.key, active.owner)) {
      setState((s) => ({ ...s, error: "Não foi possível preservar a tentativa com segurança. Nenhuma operação foi enviada. Atualize a página e confira suas metas." }));
      return false;
    }
    active.busy = true;
    active.command = command;
    setState((s) => ({ ...s, busy: true, pending: command, error: "" }));
    try {
      await executeGoalCommand(command, active.owner, active.controller.signal);
      if (!current(active)) return false;
      finishAttempt("goals", command.key, active.owner);
      invalidateSaved(active.owner);
      active.command = null;
      setState((s) => ({ ...s, pending: null }));
      await reload();
      return true;
    } catch (error) {
      if (!current(active)) return false;
      if (!active.command) return true; // Mutation confirmed; list refresh failed.
      const status = error?.response?.status;
      const terminal = status >= 400 && status < 500 && status !== 408 && status !== 429;
      if (terminal) { finishAttempt("goals", command.key, active.owner); active.command = null; }
      setState((s) => ({ ...s, pending: active.command,
        error: terminal ? "O servidor recusou a operação. Confira os dados e atualize suas metas."
          : "Não foi possível confirmar a operação. Retome a mesma tentativa antes de iniciar outra." }));
      return false;
    } finally {
      if (current(active)) { active.busy = false; setState((s) => ({ ...s, busy: false })); }
    }
  }
  return { ...(state.owner === owner ? state : initial(owner)), owner, reload,
    create: (body) => run({ type: "create", key: crypto.randomUUID(), body: goalPayload(body) }),
    remove: (id) => run({ type: "delete", key: crypto.randomUUID(), id }),
    retry: () => lease.current?.command && run(lease.current.command),
    discardUncertain: () => {
      const active = lease.current;
      if (!current(active) || active.owner !== owner || active.busy || !active.restored || !["success", "empty"].includes(state.status)) return;
      finishAttempt("goals", active.restored, active.owner); active.restored = null;
      setState((s) => ({ ...s, pending: null, error: "" }));
    } };
}
