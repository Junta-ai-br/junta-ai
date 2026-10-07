import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import { UserProvider } from "@/contexts/UserContext";
import { saveSession } from "@/services/auth/session";

function Login() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Voltar do login</button>;
}

function renderGuard() {
  render(
    <MemoryRouter initialEntries={["/publica", "/privada"]} initialIndex={1}>
      <UserProvider>
        <Routes>
          <Route path="/publica" element={<p>Página pública</p>} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/privada" element={<p>Conteúdo privado</p>} />
          </Route>
        </Routes>
      </UserProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ProtectedRoute", () => {
  it("replaces the private history entry when redirecting to login", () => {
    renderGuard();
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar do login" }));
    expect(screen.getByText("Página pública")).toBeInTheDocument();
  });

  it("redirects when the existing UserProvider expires a mounted session", () => {
    vi.useFakeTimers();
    saveSession({ accessToken: "test-access", refreshToken: "test-refresh", expiresInSeconds: 1 });
    renderGuard();
    expect(screen.getByText("Conteúdo privado")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar do login" })).toBeInTheDocument();
    expect(sessionStorage.getItem("junta_auth_session")).toBeNull();
  });
});
