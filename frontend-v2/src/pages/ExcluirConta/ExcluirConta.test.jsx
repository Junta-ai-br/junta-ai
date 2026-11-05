import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ExcluirConta, { CONFIRMATION_PHRASE } from "./ExcluirConta";

const clearProfile = vi.fn();
const deleteMyAccount = vi.fn();

vi.mock("@/services/account.api", () => ({
  deleteMyAccount: (...args) => deleteMyAccount(...args),
}));
vi.mock("@/contexts/useUser", () => ({
  useUser: () => ({ clearProfile }),
}));
vi.mock("@/components/navigation/Header", () => ({ default: () => null }));
vi.mock("@/components/navigation/Footer", () => ({ default: () => null }));

function renderPage() {
  return render(
    <MemoryRouter>
      <ExcluirConta />
    </MemoryRouter>,
  );
}

const button = () => screen.getByRole("button", { name: /sim, excluir minha conta/i });
const field = () => screen.getByLabelText(/para confirmar, digite/i);

describe("ExcluirConta", () => {
  beforeEach(() => {
    clearProfile.mockReset();
    deleteMyAccount.mockReset();
  });

  it("mantém o botão desabilitado até digitar a frase exata", () => {
    renderPage();
    expect(button()).toBeDisabled();

    fireEvent.change(field(), { target: { value: "Desejo excluir minha conta" } });
    expect(button()).toBeDisabled();

    fireEvent.change(field(), { target: { value: CONFIRMATION_PHRASE } });
    expect(button()).toBeEnabled();
  });

  it("exclui no servidor e só então limpa a sessão", async () => {
    deleteMyAccount.mockResolvedValue(undefined);
    renderPage();

    fireEvent.change(field(), { target: { value: CONFIRMATION_PHRASE } });
    fireEvent.click(button());

    expect(await screen.findByText("Sua conta foi excluída")).toBeInTheDocument();
    expect(deleteMyAccount).toHaveBeenCalledTimes(1);
    expect(clearProfile).toHaveBeenCalledTimes(1);
  });

  it("em caso de erro mantém a conta e mostra mensagem, sem limpar a sessão", async () => {
    deleteMyAccount.mockRejectedValue({ response: { status: 500 } });
    renderPage();

    fireEvent.change(field(), { target: { value: CONFIRMATION_PHRASE } });
    fireEvent.click(button());

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/não foi possível excluir/i),
    );
    expect(clearProfile).not.toHaveBeenCalled();
    expect(screen.queryByText("Sua conta foi excluída")).not.toBeInTheDocument();
  });

  it("avisa quando a sessão expirou", async () => {
    deleteMyAccount.mockRejectedValue({ response: { status: 401 } });
    renderPage();

    fireEvent.change(field(), { target: { value: CONFIRMATION_PHRASE } });
    fireEvent.click(button());

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/sessão expirou/i),
    );
    expect(clearProfile).not.toHaveBeenCalled();
  });
});