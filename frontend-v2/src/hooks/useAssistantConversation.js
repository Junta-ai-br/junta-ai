import { useCallback, useState } from "react";

import { CATEGORY_META, loadTransactions, saveTransactions } from "@/services/finance/store";

export function createChatTransactionId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function useAssistantConversation({ addTransaction } = {}) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [pendingExpense, setPendingExpense] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const appendAssistantMessage = useCallback((text) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: Date.now() + 1, type: "assistant", text },
    ]);
  }, []);

  const persistChatTransaction = useCallback((transaction, successMessage) => {
    try {
      if (addTransaction) {
        addTransaction(transaction);
      } else {
        saveTransactions([...loadTransactions(), transaction]);
      }
      appendAssistantMessage(successMessage);
    } catch {
      appendAssistantMessage("Não consegui salvar esse lançamento. Tente novamente.");
    } finally {
      setPendingExpense(null);
      setIsTyping(false);
    }
  }, [addTransaction, appendAssistantMessage]);

  const handleSubmit = useCallback((eventOrMessage) => {
    if (typeof eventOrMessage === "object" && eventOrMessage && typeof eventOrMessage.preventDefault === "function") {
      eventOrMessage.preventDefault();
    }

    const message = typeof eventOrMessage === "string"
      ? eventOrMessage.trim()
      : inputValue.trim();

    if (!message || isTyping) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: message,
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);
    setInputValue("");
    setIsTyping(true);

    const entryMatch = message.match(/\bentrada\s*:?\s*([\d]+(?:[.,]\d{1,2})?)/i);
    const exitMatch = message.match(/\b(sa[ií]da|gastei)\s*:?\s*([\d]+(?:[.,]\d{1,2})?)/i);
    const amount = Number((entryMatch?.[1] || exitMatch?.[2] || "0").replace(",", "."));
    const today = new Date().toISOString().split("T")[0];

    if (amount > 0 && entryMatch) {
      persistChatTransaction(
        { id: createChatTransactionId(), date: today, category: "Renda", desc: "Entrada via chat", amount, icon: CATEGORY_META.Renda.icon },
        "Entrada registrada. Seus gráficos já foram atualizados.",
      );
      return;
    }

    if (amount > 0 && exitMatch) {
      setPendingExpense({ amount, date: today, desc: "Saída via chat" });
      appendAssistantMessage("Qual categoria devo usar para essa saída?");
      setIsTyping(false);
      return;
    }

    window.setTimeout(() => {
      appendAssistantMessage("Entendi! 💜 Vou considerar essa informação no seu planejamento financeiro.");
      setIsTyping(false);
    }, 1000);
  }, [appendAssistantMessage, inputValue, isTyping, persistChatTransaction]);

  const registerExpense = useCallback((category) => {
    if (!pendingExpense) {
      return;
    }

    persistChatTransaction(
      {
        id: createChatTransactionId(),
        ...pendingExpense,
        category,
        amount: -pendingExpense.amount,
        icon: CATEGORY_META[category]?.icon || "💰",
      },
      `Saída registrada em ${category}. Seus gráficos já foram atualizados.`,
    );
  }, [pendingExpense, persistChatTransaction]);

  return {
    inputValue,
    setInputValue,
    messages,
    pendingExpense,
    isTyping,
    handleSubmit,
    registerExpense,
  };
}
