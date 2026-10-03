import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as financeStore from "@/services/finance/store";
import useAssistantConversation from "@/hooks/useAssistantConversation";

describe("useAssistantConversation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("adds the user message and a mocked assistant response when the message is generic", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useAssistantConversation());

    act(() => {
      result.current.setInputValue("Quero revisar meus gastos");
      result.current.handleSubmit("Quero revisar meus gastos");
    });

    expect(result.current.messages).toEqual([
      expect.objectContaining({ type: "user", text: "Quero revisar meus gastos" }),
    ]);
    expect(result.current.isTyping).toBe(true);

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.messages).toEqual([
      expect.objectContaining({ type: "user", text: "Quero revisar meus gastos" }),
      expect.objectContaining({ type: "assistant", text: expect.stringContaining("Vou considerar essa informação") }),
    ]);
    expect(result.current.isTyping).toBe(false);
  });

  it("persists a new expense transaction and calls the finance service when a category is chosen", () => {
    const saveTransactionsSpy = vi.spyOn(financeStore, "saveTransactions");
    const addTransaction = vi.fn((transaction) => {
      const nextTransactions = [...financeStore.loadTransactions(), transaction];
      financeStore.saveTransactions(nextTransactions);
      return nextTransactions;
    });
    const { result } = renderHook(() => useAssistantConversation({ addTransaction }));

    act(() => {
      result.current.setInputValue("gastei 25");
      result.current.handleSubmit("gastei 25");
    });

    expect(result.current.pendingExpense).toEqual(
      expect.objectContaining({ amount: 25, desc: "Saída via chat" }),
    );
    expect(result.current.messages).toEqual([
      expect.objectContaining({ type: "user", text: "gastei 25" }),
      expect.objectContaining({ type: "assistant", text: "Qual categoria devo usar para essa saída?" }),
    ]);

    act(() => {
      result.current.registerExpense("Alimentação");
    });

    expect(addTransaction).toHaveBeenCalledOnce();
    expect(saveTransactionsSpy).toHaveBeenCalledTimes(1);
    const savedTransactions = saveTransactionsSpy.mock.calls[0][0];

    expect(savedTransactions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "Alimentação",
        desc: "Saída via chat",
        amount: -25,
      }),
    ]));

    expect(result.current.messages).toEqual([
      expect.objectContaining({ type: "user", text: "gastei 25" }),
      expect.objectContaining({ type: "assistant", text: "Qual categoria devo usar para essa saída?" }),
      expect.objectContaining({ type: "assistant", text: "Saída registrada em Alimentação. Seus gráficos já foram atualizados." }),
    ]);
    expect(result.current.pendingExpense).toBeNull();
    expect(result.current.isTyping).toBe(false);
  });
});
