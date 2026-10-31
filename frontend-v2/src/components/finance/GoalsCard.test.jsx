import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GoalsCard from "./GoalsCard";

const goal = { id: "g", name: "Viagem", targetAmount: "100.00", currentAmount: "25.00", status: "IN_PROGRESS", deadline: null };
const model = (props = {}) => ({ owner: Symbol(), status: "success", goals: [goal], create: vi.fn().mockResolvedValue(true), remove: vi.fn(), reload: vi.fn().mockResolvedValue(), retry: vi.fn(), ...props });
describe("goals card", () => {
  it("shows remaining, percentage and funded deletion protection", () => {
    const data = model(); const view = render(<GoalsCard model={data} />);
    expect(screen.getByText("Faltam R$ 75,00")).toBeInTheDocument();
    expect(screen.getByText("25% concluído")).toBeInTheDocument();
    expect(screen.getByLabelText("Excluir meta Viagem")).toBeDisabled();
    view.rerender(<GoalsCard model={{ ...data, goals: [{ ...goal, currentAmount: "110.00", status: "COMPLETED" }] }} />);
    expect(screen.getByText("Faltam R$ 0,00")).toBeInTheDocument();
    expect(screen.getByText("100% concluído")).toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });
  it("requires explicit confirmation to dismiss a restored uncertain result", () => {
    const data = model({ pending: { reloaded: true }, discardUncertain: vi.fn() });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GoalsCard model={data} />);
    expect(screen.getByText(/Há uma operação anterior com resultado incerto/)).toBeInTheDocument();
    expect(screen.getByLabelText("Criar meta")).toBeDisabled();
    expect(screen.queryByText("Retomar tentativa")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Já conferi; encerrar aviso"));
    expect(data.discardUncertain).not.toHaveBeenCalled();
    confirm.mockReturnValue(true); fireEvent.click(screen.getByText("Já conferi; encerrar aviso"));
    expect(data.discardUncertain).toHaveBeenCalledTimes(1);
  });
  it("shows exact progress and requires confirmation to delete", () => {
    const data = model({ goals: [{ ...goal, currentAmount: "0.00" }] }); const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<GoalsCard model={data} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
    fireEvent.click(screen.getByLabelText("Excluir meta Viagem")); expect(data.remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true); fireEvent.click(screen.getByLabelText("Excluir meta Viagem")); expect(data.remove).toHaveBeenCalledWith("g");
  });
  it("creates from the form and clears inputs on account change", () => {
    const data = model(); const view = render(<GoalsCard model={data} />);
    fireEvent.click(screen.getByLabelText("Criar meta"));
    fireEvent.change(screen.getByLabelText("Nome da meta"), { target: { value: "Reserva" } });
    fireEvent.change(screen.getByLabelText("Valor-alvo (R$)"), { target: { value: "200,50" } });
    fireEvent.click(screen.getByText("Salvar meta"));
    expect(data.create).toHaveBeenCalledWith({ name: "Reserva", targetAmount: "200.50", deadline: "" });
    view.rerender(<GoalsCard model={model({ status: "empty", goals: [] })} />);
    expect(screen.queryByLabelText("Nome da meta")).not.toBeInTheDocument();
    expect(screen.queryByText("Viagem")).not.toBeInTheDocument();
  });
  it("distinguishes empty, loading, error and chat reconciliation", () => {
    const data = model({ status: "loading" }); const view = render(<GoalsCard model={data} />);
    expect(screen.getByText("Carregando metas…")).toBeInTheDocument();
    view.rerender(<GoalsCard model={{ ...data, status: "error", error: "Falha" }} />); expect(screen.getByRole("alert")).toHaveTextContent("Falha");
    view.rerender(<GoalsCard model={{ ...data, status: "empty", goals: [] }} />); expect(screen.getByText(/Você ainda não tem metas/)).toBeInTheDocument();
    view.rerender(<GoalsCard model={data} waiting />); expect(screen.getByText("Aguardando confirmação do chat…")).toBeInTheDocument();
  });
});
