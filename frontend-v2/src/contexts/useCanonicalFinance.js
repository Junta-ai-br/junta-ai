import { useContext } from "react";
import { CanonicalFinanceContext } from "./canonical-finance-context";

export default function useCanonicalFinance() {
  const context = useContext(CanonicalFinanceContext);
  if (!context) throw new Error("useCanonicalFinance requires CanonicalFinanceProvider.");
  return context;
}
