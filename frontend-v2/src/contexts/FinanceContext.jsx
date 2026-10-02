import { useCallback, useEffect, useMemo, useState } from "react";

import { FinanceContext } from "@/contexts/finance-context";

import {
  loadCategories,
  loadCategoryColors,
  loadGoals,
  loadTransactions,
  saveCategories as persistCategories,
  saveCategoryColors as persistCategoryColors,
  saveGoals as persistGoals,
  saveTransactions as persistTransactions,
  summarizeTransactions,
} from "@/services/finance/store";

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState(loadTransactions);
  const [categories, setCategories] = useState(loadCategories);
  const [categoryColors, setCategoryColors] = useState(loadCategoryColors);
  const [goals, setGoals] = useState(loadGoals);

  useEffect(() => {
    const syncTransactions = () => setTransactions(loadTransactions());
    const syncCategories = () => {
      setCategories(loadCategories());
      setCategoryColors(loadCategoryColors());
    };
    const syncGoals = () => setGoals(loadGoals());
    const syncFromStorage = (event) => {
      if (!event.key || event.key === "junta_transactions") syncTransactions();
      if (!event.key || ["junta_categories", "junta_category_colors"].includes(event.key)) syncCategories();
      if (!event.key || event.key === "junta_goals") syncGoals();
    };

    window.addEventListener("junta:transactions-changed", syncTransactions);
    window.addEventListener("junta:categories-changed", syncCategories);
    window.addEventListener("junta:goals-changed", syncGoals);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener("junta:transactions-changed", syncTransactions);
      window.removeEventListener("junta:categories-changed", syncCategories);
      window.removeEventListener("junta:goals-changed", syncGoals);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const addTransaction = useCallback((transaction) => {
    const nextTransactions = [...loadTransactions(), transaction];
    persistTransactions(nextTransactions);
    return nextTransactions;
  }, []);

  const replaceTransactions = useCallback((nextTransactions) => {
    persistTransactions(nextTransactions);
  }, []);

  const updateCategories = useCallback((nextCategories) => {
    persistCategories(nextCategories);
  }, []);

  const updateCategoryColors = useCallback((nextColors) => {
    persistCategoryColors(nextColors);
  }, []);

  const updateGoals = useCallback((nextGoals) => {
    persistGoals(nextGoals);
  }, []);

  const summary = useMemo(() => summarizeTransactions(transactions), [transactions]);

  const value = useMemo(() => ({
    transactions,
    categories,
    categoryColors,
    goals,
    summary,
    addTransaction,
    replaceTransactions,
    updateCategories,
    updateCategoryColors,
    updateGoals,
  }), [
    transactions,
    categories,
    categoryColors,
    goals,
    summary,
    addTransaction,
    replaceTransactions,
    updateCategories,
    updateCategoryColors,
    updateGoals,
  ]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
