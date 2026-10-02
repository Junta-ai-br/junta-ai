import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import AppProviders from "@/app/providers";

export function renderWithProviders(ui, { route = "/", ...options } = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AppProviders>{children}</AppProviders>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}