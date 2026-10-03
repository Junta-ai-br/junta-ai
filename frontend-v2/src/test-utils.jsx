import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AppProviders from "@/app/providers";

const FINANCE_STORAGE_KEYS = {
  transactions: "junta_transactions",
  categories: "junta_categories",
  categoryColors: "junta_category_colors",
  dateRange: "junta_date_range",
  goals: "junta_goals",
};

export function renderWithFinanceProvider(ui, { route = "/", initialFinanceData, ...renderOptions } = {}) {
  if (initialFinanceData) {
    Object.entries(FINANCE_STORAGE_KEYS).forEach(([property, key]) => {
      if (Object.hasOwn(initialFinanceData, property)) {
        localStorage.setItem(key, JSON.stringify(initialFinanceData[property]));
      }
    });
  }

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AppProviders>{children}</AppProviders>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
