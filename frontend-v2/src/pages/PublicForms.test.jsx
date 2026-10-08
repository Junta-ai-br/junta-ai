import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Contato from "./Contato/Contato";
import FeedbackPage from "./FeedbackPage/FeedbackPage";

const backend = vi.hoisted(() => ({ url: "https://backend.example.test", post: vi.fn() }));
vi.mock("@/services/api", () => ({ get API_URL() { return backend.url; }, api: { post: backend.post } }));

beforeEach(() => {
  backend.url = "https://backend.example.test";
  backend.post.mockReset().mockResolvedValue({ status: 200, data: { status: "sent" } });
});
afterEach(cleanup);

describe.each([
  { Component: Contato, kind: "contact", send: "Enviar mensagem", reset: "Enviar outra mensagem", received: "Mensagem recebida", messageLabel: "Mensagem" },
  { Component: FeedbackPage, kind: "feedback", send: "Compartilhar feedback", reset: "Enviar outro feedback", received: "Feedback recebido", messageLabel: "Conta pra gente." },
])("$kind form", ({ Component, kind, send, reset, received, messageLabel }) => {
  function fill(subject = "sugestao") {
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: " Ana " } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Sobre o que você quer falar?"), { target: { value: subject } });
    fireEvent.change(screen.getByLabelText(messageLabel), { target: { value: " Primeira linha\nSegunda linha " } });
  }
  function submit() { fireEvent.submit(screen.getByRole("button", { name: send }).closest("form")); }

  it("sends normalized payload, confirms success and resets all fields", async () => {
    render(<Component />);
    fill("outro");
    fireEvent.change(screen.getByLabelText("Qual assunto?"), { target: { value: " Meu assunto " } });
    submit();
    await screen.findByText(received);
    expect(backend.post).toHaveBeenCalledWith(`/${kind}`, { name: "Ana", email: "ana@example.com", subject: "outro", subjectOther: "Meu assunto", message: "Primeira linha\nSegunda linha" }, { withCredentials: false, headers: { Authorization: null } });
    fireEvent.click(screen.getByRole("button", { name: reset }));
    for (const label of ["Nome", "E-mail", "Sobre o que você quer falar?", messageLabel]) expect(screen.getByLabelText(label)).toHaveValue("");
    expect(screen.queryByLabelText("Qual assunto?")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: send })).toBeEnabled();
  });

  it("shows accessible loading and blocks synchronous duplicate submissions", async () => {
    let resolve;
    backend.post.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<Component />);
    fill();
    const form = screen.getByRole("button", { name: send }).closest("form");
    act(() => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(backend.post).toHaveBeenCalledTimes(1);
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Enviando…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Enviando");
    expect(screen.getByLabelText("Nome")).toBeDisabled();
    await act(async () => resolve({ status: 200, data: { status: "sent" } }));
    expect(screen.getByText(received)).toBeInTheDocument();
  });

  it.each([
    [400, "Revise os campos"], [429, "Aguarde alguns minutos"], [503, "temporariamente indisponível"],
    ["ERR_NETWORK", "A mensagem pode ter sido enviada"], ["ECONNABORTED", "O tempo de espera terminou"], ["ETIMEDOUT", "O tempo de espera terminou"],
  ])("handles %s, preserves all values and allows manual retry", async (status, message) => {
    const error = typeof status === "number" ? { response: { status, data: { timestamp: "now", status, erro: "Erro", mensagem: "Backend", campos: {} } } } : { code: status };
    backend.post.mockRejectedValueOnce(error);
    render(<Component />);
    fill("outro");
    fireEvent.change(screen.getByLabelText("Qual assunto?"), { target: { value: "Assunto" } });
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText(received)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue(" Ana ");
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com");
    expect(screen.getByLabelText("Sobre o que você quer falar?")).toHaveValue("outro");
    expect(screen.getByLabelText("Qual assunto?")).toHaveValue("Assunto");
    expect(screen.getByLabelText(messageLabel)).toHaveValue(" Primeira linha\nSegunda linha ");
    expect(backend.post).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: send })).toBeEnabled();
    submit();
    await screen.findByText(received);
    expect(backend.post).toHaveBeenCalledTimes(2);
  });

  it.each([[200, {}], [202, { status: "sent" }], [200, { status: "queued" }]])("does not show false success for %s", async (status, data) => {
    backend.post.mockResolvedValue({ status, data });
    render(<Component />);
    fill();
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não conseguimos confirmar");
    expect(screen.queryByText(received)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue(" Ana ");
  });

  it.each([undefined, "", "   "])("does not request without URL %s", async (url) => {
    backend.url = url;
    render(<Component />);
    fill();
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent("temporariamente indisponível");
    expect(backend.post).not.toHaveBeenCalled();
  });

  it("validates blank fields, email, Outro and UTF-16 limits accessibly", async () => {
    render(<Component />);
    fill("outro");
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: " \u2003 " } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "invalid" } });
    fireEvent.change(screen.getByLabelText(messageLabel), { target: { value: "a".repeat(10001) } });
    submit();
    for (const label of ["Nome", "E-mail", "Qual assunto?", messageLabel]) {
      expect(screen.getByLabelText(label)).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText(label)).toHaveAccessibleDescription();
    }
    expect(screen.getByLabelText("Nome")).toHaveFocus();
    expect(backend.post).not.toHaveBeenCalled();
    fill("outro");
    fireEvent.change(screen.getByLabelText("Qual assunto?"), { target: { value: "a".repeat(161) } });
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "😀".repeat(61) } });
    submit();
    expect(screen.getByLabelText("Qual assunto?")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nome")).toHaveAttribute("aria-invalid", "true");
    expect(backend.post).not.toHaveBeenCalled();
    fill("sugestao");
    submit();
    await waitFor(() => expect(backend.post).toHaveBeenCalledTimes(1));
    expect(backend.post.mock.calls[0][1].subjectOther).toBe("");
  });
});
