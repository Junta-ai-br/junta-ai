import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import useCanonicalFinance from "@/contexts/useCanonicalFinance";
vi.hoisted(() => vi.stubEnv("VITE_API_URL", "https://backend.example.test"));
import AppRoutes from "@/app/routes";
import Assistente from "./Assistente";
import { loadTransactions } from "@/services/finance/store";
import { renderWithFinanceProvider } from "@/test-utils";
import { clearSession, saveSession } from "@/services/auth/session";
import { api } from "@/services/api";
import { subtractMoney } from "@/services/finance/signed-money";
import { currentCivilMonth } from "@/services/finance/finance-provider-store";
const conversation = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", title: "Histórico", updatedAt: "2026-10-18T12:00:00Z" };
const userMessage = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", role: "USER", content: "Mensagem persistida", createdAt: conversation.updatedAt };
const assistantMessage = { ...userMessage, id: "ec17e3c2-b24a-4e17-9ff5-58d370cc9862", role: "ASSISTANT", content: "Resposta recebida da API" };
const response = (config, data) => ({ config, status: 200, headers: {}, data: JSON.stringify(data).replace(/"(amount|totalIncome|totalExpense|balance)":"(-?[0-9.]+)"/g, '"$1":$2') });
const category = { id: "a0d3efc5-222f-4576-99d1-1694c80445cf", name: "Categoria real", type: "BOTH", createdAt: conversation.updatedAt };
const transaction = (fields = {}) => ({ id: "8e38acc5-b6ec-464f-8e09-a743a623154b", categoryId: category.id,
  categoryName: category.name, type: "INCOME", description: "Receita oficial", amount: "1234.56",
  transactionDate: currentCivilMonth().from, createdAt: conversation.updatedAt, ...fields });
const page = (content = [], number = 0, totalPages = content.length ? 1 : 0, totalElements = content.length) => ({
  content, number, size: totalPages > 1 ? 1 : 100, totalElements, totalPages, numberOfElements: content.length,
  first: number === 0, last: number >= totalPages - 1, empty: !content.length,
});
const dashboard = (config, income = "0.00", expense = "0.00", score = null, classification = null) => response(config, {
  ...currentCivilMonth(), totalIncome: income, totalExpense: expense, balance: subtractMoney(income, expense), categoryBreakdown: [],
  healthScore: { methodology: "mvp-monthly-v1", status: score === null ? "INSUFFICIENT_DATA" : "CALCULATED",
    score, classification, ...currentCivilMonth() },
});
const financialResponse = (config) => config.url === "/categories" ? response(config, [category])
  : config.url === "/transactions" ? response(config, page()) : config.url === "/dashboard" ? dashboard(config) : null;
const summary = () => within(screen.getByRole("region", { name: "Resumo financeiro" }));
const mount = () => renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });
let requests;
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear(); clearSession(); requests = [];
  saveSession({ accessToken: "test-access", refreshToken: "test-refresh", expiresInSeconds: 900 });
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return financialResponse(config) ?? response(config, config.method === "get" ? [] : config.url === "/conversations" ? conversation
      : { conversationId: conversation.id, userMessage, assistantMessage, actionExecuted: true });
  };
});
afterEach(() => { cleanup(); clearSession(); vi.restoreAllMocks(); });
describe("Assistente real chat", () => {
  it("reloads persisted goal progress after a confirmed conversational withdrawal", async () => {
    const user = userEvent.setup();
    const goal = { id: "11111111-1111-4111-8111-111111111111", name: "Viagem", targetAmount: 200, currentAmount: 100, deadline: null, status: "IN_PROGRESS" };
    api.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/goals") return response(config, [goal]);
      if (config.method === "post" && config.url.endsWith("/messages")) {
        goal.currentAmount = 50;
        return response(config, { conversationId: conversation.id, actionExecuted: true, userMessage,
          assistantMessage: { ...assistantMessage, content: "Registrado: retirada da meta." } });
      }
      return financialResponse(config) ?? response(config, config.url === "/conversations" ? [conversation] : []);
    };
    mount();
    const card = within(await screen.findByRole("region", { name: "Minhas metas" }));
    expect(await card.findByText("R$ 100,00")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "Tirei 50 reais da minha meta de viagem.");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await card.findByText("R$ 50,00")).toBeInTheDocument();
    expect(requests.filter((r) => r.url === "/goals" && r.method === "get").length).toBeGreaterThanOrEqual(2);
    expect(requests.filter((r) => r.method === "post").map((r) => r.url)).toEqual([`/conversations/${conversation.id}/messages`]);
  });
  it("preserves embedded layout and displays backend confirmation without another financial write", async () => {
    const user = userEvent.setup();
    const { container } = renderWithFinanceProvider(<Assistente variant="embedded" className="test-chat" height={280} width={420} />, { route: "/assistente" });
    const chat = container.querySelector(".assistant--embedded");
    expect(chat).toHaveClass("test-chat"); expect(chat.style.getPropertyValue("--assistant-height")).toBe("280px");
    expect(chat.style.getPropertyValue("--assistant-width")).toBe("420px"); expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "Nova conversa" });
    const before = loadTransactions();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "gastei 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText("Resposta recebida da API")).toBeInTheDocument();
    expect(container.querySelector('[data-execution="confirmed"]')).not.toBeNull();
    expect(screen.queryByText(/backend confirmou a execução/)).not.toBeInTheDocument();
    expect(loadTransactions()).toEqual(before);
    expect(requests.filter((request) => request.method === "post").map((request) => request.url)).toEqual(["/conversations", `/conversations/${conversation.id}/messages`]);
  });
  it("loads persisted messages and keeps the existing navigation", async () => {
    api.defaults.adapter = async (config) => financialResponse(config) ?? response(config, config.url === "/conversations" ? [conversation] : [userMessage, assistantMessage]);
    const { container } = renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });
    expect(await screen.findByText("Mensagem persistida")).toBeInTheDocument();
    expect(screen.getByText("Resposta recebida da API")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Navegação principal" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
    expect(container.querySelector('[data-execution="confirmed"]')).toBeNull();
    expect(container.querySelectorAll(".assistant__intro")).toHaveLength(1);
    expect(container.querySelector(".assistant__financial-status")).not.toBeNull();
  });
  it("shows AI unavailability without a simulated reply or category picker", async () => {
    const user = userEvent.setup(); renderWithFinanceProvider(<AppRoutes />, { route: "/assistente" });
    const input = await screen.findByRole("textbox", { name: "Mensagem" });
    await user.type(input, "gastei 25");
    api.defaults.adapter = async (config) => {
      if (financialResponse(config)) return financialResponse(config);
      if (config.url === "/conversations") return response(config, conversation);
      throw new AxiosError("Unavailable", "ERR_BAD_RESPONSE", config, {}, { config, status: 503, data: '{"code":"message_processing_failed"}' });
    };
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    expect(await screen.findByText(/IA não conseguiu processar/)).toBeInTheDocument();
    expect(screen.queryByText(/Seus gráficos já foram atualizados/)).not.toBeInTheDocument();
    expect(screen.queryByText("Qual categoria devo usar para essa saída?")).not.toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(screen.getByText("gastei 25")).toBeInTheDocument();
  });
  it("does not expose local goals or a local Health Score as official", async () => {
    renderWithFinanceProvider(<AppRoutes />, { route: "/assistente", initialFinanceData: {
      transactions: [{ amount: 123456, desc: "Fake local record" }],
      goals: [{ name: "Fake local goal", target: 1000 }],
    } });
    await screen.findByText("Nenhuma movimentação neste mês.");
    expect(screen.queryByText("Fake local goal")).not.toBeInTheDocument();
    expect(screen.queryByText("Fake local record")).not.toBeInTheDocument();
    expect(await screen.findByText("Em avaliação")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Nova meta/ })).not.toBeInTheDocument();
  });
});

describe("official monthly assistant panel", () => {
  it("loads every page for the current month and retains exact amounts and backend labels", async () => {
    const records = [transaction(), transaction({ id: userMessage.id, type: "EXPENSE", description: "Despesa oficial", amount: "0.01" })];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/transactions") return response(config, page([records[config.params.page]], config.params.page, 2, 2));
      return financialResponse(config) ?? response(config, []);
    };
    mount();
    expect(await screen.findByText("Receita oficial")).toBeInTheDocument();
    expect(screen.getByText("Despesa oficial")).toBeInTheDocument();
    const info = screen.getByText("Receita oficial").closest(".assistant__transaction-info");
    expect(info.querySelector("strong .category-label")).toBeVisible();
    expect(info.querySelector("strong")).toHaveTextContent(category.name);
    expect(summary().getByText("R$ 1.234,56")).toBeInTheDocument();
    expect(summary().getByText("R$ 0,01")).toBeInTheDocument();
    expect(summary().getByText("R$ 1.234,55")).toBeInTheDocument();
    expect(requests.filter((r) => r.url === "/transactions").map((r) => r.params)).toEqual([
      expect.objectContaining({ ...currentCivilMonth(), page: 0 }), expect.objectContaining({ ...currentCivilMonth(), page: 1 }),
    ]);
    expect(screen.getAllByText(category.name).length).toBeGreaterThan(0);
  });

  it("shows loading without zeros and handles an initial API failure without local fallback", async () => {
    let rejectRead;
    api.defaults.adapter = async (config) => {
      if (config.url === "/transactions") return new Promise((_, reject) => { rejectRead = reject; });
      return financialResponse(config) ?? response(config, []);
    };
    mount();
    await waitFor(() => expect(rejectRead).toBeTypeOf("function"));
    expect(screen.getByText("Carregando dados financeiros…")).toBeInTheDocument();
    expect(summary().getAllByText("Indisponível")).toHaveLength(3);
    expect(screen.queryByText("Nenhuma movimentação neste mês.")).not.toBeInTheDocument();
    await act(async () => { rejectRead(new Error("Offline")); });
    expect(await screen.findByText("Não foi possível confirmar os dados financeiros atuais.")).toBeInTheDocument();
    expect(summary().queryByText("R$ 0,00")).not.toBeInTheDocument();
  });

  it("shows only the latest four persisted transactions in date order", async () => {
    const month = currentCivilMonth().from.slice(0, 7);
    const records = Array.from({ length: 6 }, (_, index) => transaction({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      description: `Registro ${index + 1}`, transactionDate: `${month}-0${index + 1}`,
    }));
    api.defaults.adapter = async (config) => config.url === "/transactions" ? response(config, page(records))
      : financialResponse(config) ?? response(config, []);
    mount(); await screen.findByText("Registro 6");
    expect(screen.getAllByText(/^Registro /).map((element) => element.textContent)).toEqual(["Registro 6", "Registro 5", "Registro 4", "Registro 3"]);
    expect(screen.queryByText("Registro 1")).not.toBeInTheDocument();
  });

  it("opens the assistant on the current month even after another finance route selected history", async () => {
    function NavigationProbe() {
      const finance = useCanonicalFinance();
      const location = useLocation();
      const navigate = useNavigate();
      if (location.pathname === "/assistente") return <Assistente />;
      return <button onClick={async () => {
        await finance.load({ from: "2020-01-01", to: "2020-01-31" });
        navigate("/assistente");
      }}>Abrir assistente</button>;
    }
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return financialResponse(config) ?? response(config, []);
    };
    renderWithFinanceProvider(<NavigationProbe />, { route: "/dashboard" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Abrir assistente" }));
    await screen.findByText("Nenhuma movimentação neste mês.");
    expect(requests.filter((r) => r.url === "/transactions").at(-1).params).toMatchObject(currentCivilMonth());
  });

  it("shows real zeros for an empty account without reading demo transactions", async () => {
    localStorage.setItem("junta_transactions", JSON.stringify([{ desc: "Fake", amount: 999 }]));
    mount();
    await screen.findByText("Nenhuma movimentação neste mês.");
    expect(summary().getAllByText("R$ 0,00")).toHaveLength(3);
    expect(await screen.findByText("Em avaliação")).toBeInTheDocument();
    expect(document.querySelector(".financial-health__bar span")).toHaveStyle({ width: "50%" });
    expect(screen.getByText("Ainda não há lançamentos suficientes para uma avaliação confiável. O indicador será atualizado conforme você registrar suas movimentações.")).toBeInTheDocument();
    expect(screen.queryByText("50/100")).not.toBeInTheDocument();
    expect(screen.queryByText(/\+8 pts/)).not.toBeInTheDocument();
    expect(screen.queryByText("Fake")).not.toBeInTheDocument();
  });

  it("hides previous numbers during a confirmed operation until its financial reload completes", async () => {
    let changed = false, finishReload;
    api.defaults.adapter = async (config) => {
      if (config.url === "/transactions") {
        if (changed) return new Promise((resolve) => { finishReload = () => resolve(response(config, page([transaction({ amount: "1259.56" })]))); });
        return response(config, page([transaction()]));
      }
      if (config.url.endsWith("/messages") && config.method === "post") {
        changed = true;
        return response(config, { conversationId: conversation.id, userMessage, assistantMessage, actionExecuted: true });
      }
      return financialResponse(config) ?? response(config, config.url === "/conversations" ? [conversation] : []);
    };
    mount(); await screen.findByText("Receita oficial");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "recebi 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    await waitFor(() => expect(finishReload).toBeTypeOf("function"));
    expect(summary().queryByText("R$ 1.234,56")).not.toBeInTheDocument();
    expect(summary().getAllByText("Indisponível")).toHaveLength(3);
    await act(async () => { finishReload(); });
    expect(await summary().findAllByText("R$ 1.259,56")).toHaveLength(2);
    expect(await screen.findByText("Resposta recebida da API")).toBeInTheDocument();
  });

  it("keeps values unavailable after timeout and reconciles a replay with actionExecuted=false", async () => {
    let posted = 0;
    api.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/transactions") return response(config, page([transaction({ amount: posted ? "1259.56" : "1234.56" })]));
      if (config.url.endsWith("/messages") && config.method === "post") {
        posted++;
        if (posted === 1) throw Object.assign(new Error("Timeout"), { code: "ECONNABORTED" });
        return response(config, { conversationId: conversation.id, userMessage, assistantMessage, actionExecuted: false });
      }
      return financialResponse(config) ?? response(config, config.url === "/conversations" ? [conversation] : []);
    };
    mount(); await screen.findByText("Receita oficial");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "recebi 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    await screen.findByText(/O tempo de espera terminou/);
    expect(summary().getAllByText("Indisponível")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Atualizar histórico" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Retomar envio anterior" })).toBeEnabled());
    expect(summary().getAllByText("Indisponível")).toHaveLength(3);
    const retry = screen.getByRole("button", { name: /Retomar/ });
    await user.click(retry);
    expect(await summary().findAllByText("R$ 1.259,56")).toHaveLength(2);
    const sends = requests.filter((r) => r.method === "post");
    expect(sends).toHaveLength(2);
    expect(sends[1].headers.get("Idempotency-Key")).toBe(sends[0].headers.get("Idempotency-Key"));
    expect(sends[1].data).toBe(sends[0].data);
  });

  it("does not restore old values when the reload fails; manual recovery reads the server", async () => {
    let failed = false;
    api.defaults.adapter = async (config) => {
      if (config.url === "/transactions") {
        if (failed) throw new Error("Offline");
        return response(config, page([transaction()]));
      }
      if (config.method === "post") {
        failed = true;
        return response(config, { conversationId: conversation.id, userMessage, assistantMessage, actionExecuted: true });
      }
      return financialResponse(config) ?? response(config, config.url === "/conversations" ? [conversation] : []);
    };
    mount(); await screen.findByText("Receita oficial");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "recebi 25");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    await screen.findByText("Não foi possível confirmar os dados financeiros atuais.");
    expect(summary().getAllByText("Indisponível")).toHaveLength(3);
    expect(screen.queryByText("Receita oficial")).not.toBeInTheDocument();
    failed = false;
    await user.click(screen.getByRole("button", { name: "Atualizar dados" }));
    expect(await screen.findByText("Receita oficial")).toBeInTheDocument();
  });
});

describe("canonical Health Score in the assistant", () => {
  it.each([false, true])("updates the official indicator after chat persistence (uncertain replay=%s)", async (uncertain) => {
    let changed = false, attempts = 0;
    api.defaults.adapter = async (config) => {
      requests.push(config);
      if (config.url === "/transactions") return response(config, page([
        transaction({ amount: "1000.00" }), transaction({ id: userMessage.id, type: "EXPENSE", amount: changed ? "900.00" : "100.00", description: "Categoria personalizada" }),
      ]));
      if (config.url === "/dashboard") return dashboard(config, "1000.00", changed ? "900.00" : "100.00", changed ? 43 : 93,
        changed ? "Hora de ajustar" : "Excelente! Tudo tranquilo por aqui!");
      if (config.method === "post") {
        changed = true; attempts++;
        if (uncertain && attempts === 1) throw Object.assign(new Error("Timeout"), { code: "ECONNABORTED" });
        return response(config, { conversationId: conversation.id, userMessage, assistantMessage, actionExecuted: !uncertain });
      }
      return financialResponse(config) ?? response(config, config.url === "/conversations" ? [conversation] : []);
    };
    mount();
    expect(await screen.findByRole("progressbar", { name: "Health Score" })).toHaveAttribute("aria-valuenow", "93");
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Mensagem" }), "paguei 800");
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    if (uncertain) {
      await screen.findByText(/O tempo de espera terminou/);
      expect(screen.queryByRole("progressbar", { name: "Health Score" })).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Retomar envio anterior" }));
    }
    await waitFor(() => expect(screen.getByRole("progressbar", { name: "Health Score" })).toHaveAttribute("aria-valuenow", "43"));
    expect(screen.getByText("Hora de ajustar")).toBeInTheDocument();
    expect(summary().getByText("R$ 100,00")).toBeInTheDocument();
    expect(screen.queryByText(/\+8 pts/)).not.toBeInTheDocument();
  });

  it("presents a real zero score as the lowest band, distinct from insufficient data", async () => {
    api.defaults.adapter = async (config) => {
      if (config.url === "/transactions") return response(config, page([
        transaction({ amount: "100.00" }), transaction({ id: userMessage.id, type: "EXPENSE", amount: "200.00" }),
      ]));
      if (config.url === "/dashboard") return dashboard(config, "100.00", "200.00", 0, "Vamos cuidar disso");
      return financialResponse(config) ?? response(config, []);
    };
    mount();
    expect(await screen.findByRole("progressbar", { name: "Health Score" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("Vamos cuidar disso")).toBeInTheDocument();
    expect(document.querySelector(".financial-health").style.getPropertyValue("--health-color")).toBe("var(--red-400)");
    expect(screen.queryByText("Em avaliação")).not.toBeInTheDocument();
    expect(summary().getByText("-R$ 100,00")).toBeInTheDocument();
  });

  it("hides the score when official totals diverge from the complete transaction read and can recover", async () => {
    let mismatch = true;
    api.defaults.adapter = async (config) => {
      if (config.url === "/transactions") return response(config, page([
        transaction({ amount: "1000.00" }), transaction({ id: userMessage.id, type: "EXPENSE", amount: "500.00" }),
      ]));
      if (config.url === "/dashboard") return dashboard(config, "1000.00", mismatch ? "100.00" : "500.00", mismatch ? 93 : 65,
        mismatch ? "Excelente! Tudo tranquilo por aqui!" : "No caminho certo");
      return financialResponse(config) ?? response(config, []);
    };
    mount();
    await screen.findByRole("button", { name: "Atualizar indicador" });
    expect(screen.queryByRole("progressbar", { name: "Health Score" })).not.toBeInTheDocument();
    mismatch = false;
    await userEvent.setup().click(screen.getByRole("button", { name: "Atualizar indicador" }));
    expect(await screen.findByRole("progressbar", { name: "Health Score" })).toHaveAttribute("aria-valuenow", "65");
    expect(screen.getByText("No caminho certo")).toBeInTheDocument();
  });
});
