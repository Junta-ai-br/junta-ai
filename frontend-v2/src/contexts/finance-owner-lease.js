// Ownership only, not an auth or financial data cache. UserProvider.endSession
// is stable for that provider's lifetime and separates independent React owners.
const owners = new WeakMap();

export function claimFinanceOwner(scope, owner) {
  if (owners.has(scope)) throw new Error("Only one financial provider may own this UserProvider.");
  owners.set(scope, owner);
  return () => { if (owners.get(scope) === owner) owners.delete(scope); };
}
