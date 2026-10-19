import { useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { UserContext } from "./user-context";
import { FinanceOwnerContext } from "./finance-owner-context";
import { CanonicalFinanceContext } from "./canonical-finance-context";
import { claimFinanceOwner } from "./finance-owner-lease";
import { createFinanceProviderStore, currentCivilMonth } from "@/services/finance/finance-provider-store";

function CanonicalFinanceOwner({ children, initialPeriod, ownerScope }) {
  const [store] = useState(() => createFinanceProviderStore(initialPeriod ?? currentCivilMonth()));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    const release = claimFinanceOwner(ownerScope, store);
    let detach;
    try { detach = store.mount(); }
    catch (error) { release(); throw error; }
    return () => { try { detach(); } finally { release(); } };
  }, [store, ownerScope]);
  const value = useMemo(() => Object.freeze({ ...snapshot, ...store.actions }), [snapshot, store]);
  return <CanonicalFinanceContext.Provider value={value}>{children}</CanonicalFinanceContext.Provider>;
}

/** Candidate only: AppProviders deliberately continues to mount the legacy provider. */
export function CanonicalFinanceProvider({ children, initialPeriod }) {
  const user = useContext(UserContext);
  const owner = useContext(FinanceOwnerContext);
  if (!user) throw new Error("CanonicalFinanceProvider requires UserProvider.");
  if (owner) throw new Error("Financial providers cannot be nested: choose one financial source.");
  return <FinanceOwnerContext.Provider value="canonical">
    <CanonicalFinanceOwner initialPeriod={initialPeriod} ownerScope={user.endSession}>{children}</CanonicalFinanceOwner>
  </FinanceOwnerContext.Provider>;
}
