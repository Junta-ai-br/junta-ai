import { createContext } from "react";

// A subtree has exactly one financial source, including during the migration.
export const FinanceOwnerContext = createContext(null);
