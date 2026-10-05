import { useContext } from "react";

import { FinanceContext } from "@/contexts/finance-context";

export default function useFinanceData() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinanceData deve ser utilizado dentro de um FinanceProvider.");
  }

  return context;
}
