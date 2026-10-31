import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSessionSnapshot, subscribeSession } from "@/services/auth/session";
import { loadSaved, subscribeSaved } from "@/services/saved.api";

const generation = () => getSessionSnapshot()?.generation ?? null;
export default function useSaved() {
  const owner = useSyncExternalStore(subscribeSession, generation);
  const [read, setRead] = useState(null);
  const active = useRef(null);
  const reload = useCallback(async () => {
    const lease = active.current;
    if (!lease || !lease.owner || generation() !== lease.owner) return;
    const sequence = ++lease.sequence;
    const current = () => active.current === lease && generation() === lease.owner && sequence === lease.sequence;
    setRead({ owner: lease.owner, status: "loading" });
    try {
      const value = await loadSaved(lease.owner, lease.controller.signal);
      if (current()) setRead({ owner: lease.owner, status: "ready", value });
    } catch {
      if (current()) setRead({ owner: lease.owner, status: "error" });
    }
  }, []);
  useEffect(() => {
    const lease = { owner, sequence: 0, controller: new AbortController() };
    active.current = lease;
    reload();
    const off = subscribeSaved((changedOwner) => { if (changedOwner === owner) reload(); });
    return () => { off(); lease.controller.abort(); if (active.current === lease) active.current = null; };
  }, [owner, reload]);
  return { ...(owner && read?.owner === owner ? read : { status: owner ? "loading" : "error" }), reload };
}
