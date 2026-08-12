import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  parseInput,
  generateContextualResponse,
  generateConfirmation,
  createTransaction,
  createGoal,
  createGoalContribution,
  findMatchingGoal,
  computeSavingsSuggestion,
  getBalance,
  getMonthlyTotals,
  currentMonth,
  detectConversationalIntent,
  getContextualAdvice,
  explainFinancialHealthByFocus,
  findRecentTransactionToCorrect,
  SUGGESTED_PICK_CATEGORIES,
  resolveCategoryFromText,
  resolveCategoryStrict
} from "./finance";
import {
  getRecurringSuggestion,
  getRecurringCandidatePrompt,
  detectRecurringValueChange,
  isYes,
  isNo
} from "./recurring";
const INSTALL_ID_KEY = "grana-ai-install-id";
const KEY_PREFIX = "grana-ai";
function getInstallId() {
  try {
    let id = localStorage.getItem(INSTALL_ID_KEY);
    if (!id) {
      id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    return "ephemeral";
  }
}
const INSTALL_ID = typeof window !== "undefined" ? getInstallId() : "ssr";
const STORAGE_KEY = `${KEY_PREFIX}:${INSTALL_ID}:state`;
const CHAT_KEY = `${KEY_PREFIX}:${INSTALL_ID}:chat`;
const DEFAULT_USER = { name: "", onboarded: false };
const EMPTY_STATE = { transactions: [], goals: [], user: DEFAULT_USER };
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE;
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      user: parsed.user && typeof parsed.user === "object" ? parsed.user : DEFAULT_USER,
      shownSavingsSuggestionMonth: parsed.shownSavingsSuggestionMonth,
      recurring: parsed.recurring && typeof parsed.recurring === "object" ? parsed.recurring : {}
    };
  } catch {
    return EMPTY_STATE;
  }
}
function loadChat() {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}
function clearAllGranaStorage() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(`${KEY_PREFIX}:`) || k.startsWith("grana-ai-"))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
  }
}
function welcomeMessage(name) {
  return {
    id: "welcome",
    role: "assistant",
    content: name ? `Oi, ${name}! Me conta o que rolou. Ex: "Gastei 30 no almo\xE7o", "Recebi 2000 de sal\xE1rio" ou "Guardei 100 para minha meta".` : "Oi! Me conta o que voc\xEA gastou, recebeu ou guardou.",
    timestamp: /* @__PURE__ */ new Date()
  };
}
function useFinance() {
  const [state, setState] = useState(loadState);
  const [messages, setMessages] = useState(() => {
    const saved = loadChat();
    return saved.length > 0 ? saved : [welcomeMessage("")];
  });
  const persistState = useCallback((newState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);
  const persistChat = useCallback((newMessages) => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(newMessages));
  }, []);
  const completeOnboarding = useCallback((profile) => {
    const newState = {
      ...state,
      user: { ...profile, onboarded: true }
    };
    setState(newState);
    persistState(newState);
    const welcome = welcomeMessage(profile.name);
    setMessages([welcome]);
    persistChat([welcome]);
  }, [state, persistState, persistChat]);
  const addGoal = useCallback((name, amount) => {
    const goal = createGoal(name, amount);
    const newState = { ...state, goals: [...state.goals, goal] };
    setState(newState);
    persistState(newState);
    toast.success("Meta criada", { description: `${name} \u2014 R$${amount.toFixed(2)}` });
  }, [state, persistState]);
  const deleteGoal = useCallback((id) => {
    const newState = { ...state, goals: state.goals.filter((g) => g.id !== id) };
    setState(newState);
    persistState(newState);
  }, [state, persistState]);
  const contributeToGoal = useCallback((goal, amount, description, currentState) => {
    const tx = createGoalContribution(amount, goal, description);
    const updatedGoals = currentState.goals.map(
      (g) => g.id === goal.id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) } : g
    );
    return { ...currentState, transactions: [...currentState.transactions, tx], goals: updatedGoals };
  }, []);
  const maybeAppendSavingsSuggestion = (curState, curMessages) => {
    const month = currentMonth();
    if (curState.shownSavingsSuggestionMonth === month) return { state: curState, messages: curMessages };
    const suggestion = computeSavingsSuggestion(curState);
    if (!suggestion) return { state: curState, messages: curMessages };
    const msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Voc\xEA ainda tem uma folga este m\xEAs. Quer guardar **R$${suggestion.amount.toFixed(2)}** para sua meta "${suggestion.goal.name}"?`,
      timestamp: /* @__PURE__ */ new Date(),
      suggestion: { kind: "savings", amount: suggestion.amount, goalId: suggestion.goal.id }
    };
    return {
      state: { ...curState, shownSavingsSuggestionMonth: month },
      messages: [...curMessages, msg]
    };
  };
  const maybeAppendRecurringSuggestion = (curState, curMessages) => {
    const hasPending = curMessages.some(
      (m) => m.role === "assistant" && (m.suggestion && !m.suggestion.answered || m.categoryPick && !m.categoryPick.answered || m.correctionPending && !m.correctionPending.answered || m.recurringPick && !m.recurringPick.answered || m.recurringUpdate && !m.recurringUpdate.answered)
    );
    if (hasPending) return { state: curState, messages: curMessages };
    const sug = getRecurringSuggestion(curState);
    if (!sug) return { state: curState, messages: curMessages };
    const month = currentMonth();
    const valueStr = `R$${sug.amount.toFixed(2)}`;
    let content;
    if (sug.type === "income" && sug.category === "Sal\xE1rio") {
      content = `Voc\xEA costuma receber sal\xE1rio pr\xF3ximo desta data. Deseja registrar novamente?

**${sug.merchantLabel}** \u2014 ${valueStr}`;
    } else if (sug.category === "Streaming" || sug.category === "Assinaturas") {
      content = `${sug.merchantLabel} costuma aparecer neste per\xEDodo. Registrar ${valueStr} novamente?`;
    } else if (sug.type === "expense") {
      content = `Percebi um gasto recorrente:

**${sug.merchantLabel}** \u2014 ${valueStr}

Deseja registrar novamente este m\xEAs?`;
    } else {
      content = `${sug.merchantLabel} costuma entrar por aqui. Registrar ${valueStr} novamente?`;
    }
    const msg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      timestamp: /* @__PURE__ */ new Date(),
      recurringPick: {
        signature: sug.signature,
        type: sug.type,
        category: sug.category,
        merchantLabel: sug.merchantLabel,
        amount: sug.amount,
        mode: "register"
      }
    };
    const recurring = { ...curState.recurring ?? {} };
    recurring[sug.signature] = { ...recurring[sug.signature] ?? {}, suggestedMonth: month };
    return {
      state: { ...curState, recurring },
      messages: [...curMessages, msg]
    };
  };
  const respondToSuggestion = useCallback((messageId, accept) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.suggestion || msg.suggestion.answered) return;
    let newState = state;
    let aiText;
    if (accept) {
      const goal = state.goals.find((g) => g.id === msg.suggestion.goalId);
      if (!goal) {
        aiText = "Essa meta n\xE3o existe mais.";
      } else {
        newState = contributeToGoal(goal, msg.suggestion.amount, "Sugest\xE3o autom\xE1tica de poupan\xE7a", state);
        toast.success("Poupan\xE7a adicionada", { description: `R$${msg.suggestion.amount.toFixed(2)} para "${goal.name}".` });
        aiText = `Feito. Mais R$${msg.suggestion.amount.toFixed(2)} na sua meta "${goal.name}".`;
      }
    } else {
      aiText = "Tranquilo, fica pra pr\xF3xima.";
    }
    const updatedMessages = messages.map(
      (m) => m.id === messageId ? { ...m, suggestion: { ...m.suggestion, answered: true } } : m
    );
    updatedMessages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: aiText,
      timestamp: /* @__PURE__ */ new Date()
    });
    setState(newState);
    setMessages(updatedMessages);
    persistState(newState);
    persistChat(updatedMessages);
  }, [messages, state, contributeToGoal, persistState, persistChat]);
  const sendMessage = useCallback((text) => {
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: /* @__PURE__ */ new Date()
    };
    const pendingRec = [...messages].reverse().find(
      (m) => m.role === "assistant" && m.recurringPick && !m.recurringPick.answered
    );
    if (pendingRec && pendingRec.recurringPick) {
      const pick = pendingRec.recurringPick;
      const yes = isYes(text);
      const no = isNo(text);
      if (yes || no) {
        const month = currentMonth();
        let newState2 = state;
        let aiText;
        if (yes) {
          if (pick.mode === "candidate") {
            const recurring = { ...state.recurring ?? {} };
            recurring[pick.signature] = {
              ...recurring[pick.signature] ?? {},
              confirmed: true
            };
            newState2 = { ...state, recurring };
            aiText = `Perfeito. Vou lembrar de ${pick.merchantLabel} como recorrente em ${pick.category}.`;
          } else {
            const tx = createTransaction(
              pick.type === "income" ? { kind: "transaction", type: "income", amount: pick.amount, category: pick.category, description: pick.merchantLabel } : { kind: "transaction", type: "expense", amount: pick.amount, category: pick.category, description: pick.merchantLabel }
            );
            newState2 = { ...state, transactions: [...state.transactions, tx] };
            toast.success("Registrado", { description: `${pick.merchantLabel} \u2014 R$${pick.amount.toFixed(2)}` });
            aiText = `Feito. Registrei ${pick.merchantLabel} de R$${pick.amount.toFixed(2)} em ${pick.category}.`;
          }
        } else {
          const recurring = { ...state.recurring ?? {} };
          recurring[pick.signature] = {
            ...recurring[pick.signature] ?? {},
            ...pick.mode === "candidate" ? { candidatePromptMonth: month } : { dismissed: month }
          };
          newState2 = { ...state, recurring };
          aiText = pick.mode === "candidate" ? "Tudo bem, n\xE3o vou salvar isso como recorrente agora." : "Tranquilo, n\xE3o registro ent\xE3o.";
        }
        const updated = messages.map(
          (m) => m.id === pendingRec.id ? { ...m, recurringPick: { ...m.recurringPick, answered: true } } : m
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: aiText,
          timestamp: /* @__PURE__ */ new Date()
        });
        setState(newState2);
        setMessages(updated);
        persistState(newState2);
        persistChat(updated);
        return;
      }
    }
    const pendingRecUpd = [...messages].reverse().find(
      (m) => m.role === "assistant" && m.recurringUpdate && !m.recurringUpdate.answered
    );
    if (pendingRecUpd && pendingRecUpd.recurringUpdate) {
      const upd = pendingRecUpd.recurringUpdate;
      const yes = isYes(text);
      const no = isNo(text);
      if (yes || no) {
        let newState2 = state;
        let aiText;
        if (yes) {
          const recurring = { ...state.recurring ?? {} };
          recurring[upd.signature] = {
            ...recurring[upd.signature] ?? {},
            baseline: upd.newAmount,
            updatePromptMonth: currentMonth()
          };
          newState2 = { ...state, recurring };
          aiText = `Atualizado. Vou considerar R$${upd.newAmount.toFixed(2)} como novo valor recorrente de ${upd.merchantLabel}.`;
        } else {
          const recurring = { ...state.recurring ?? {} };
          recurring[upd.signature] = { ...recurring[upd.signature] ?? {}, updatePromptMonth: currentMonth() };
          newState2 = { ...state, recurring };
          aiText = "Beleza, mantenho o valor anterior como recorr\xEAncia.";
        }
        const updated = messages.map(
          (m) => m.id === pendingRecUpd.id ? { ...m, recurringUpdate: { ...m.recurringUpdate, answered: true } } : m
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: aiText,
          timestamp: /* @__PURE__ */ new Date()
        });
        setState(newState2);
        setMessages(updated);
        persistState(newState2);
        persistChat(updated);
        return;
      }
    }
    const pendingCorr = [...messages].reverse().find(
      (m) => m.role === "assistant" && m.correctionPending && !m.correctionPending.answered
    );
    if (pendingCorr && pendingCorr.correctionPending) {
      const target = state.transactions.find((t) => t.id === pendingCorr.correctionPending.targetId);
      if (!target) {
        const updated2 = messages.map(
          (m) => m.id === pendingCorr.id ? { ...m, correctionPending: { ...m.correctionPending, answered: true } } : m
        );
        updated2.push(userMsg, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "N\xE3o encontrei mais esse lan\xE7amento. Pode me dizer qual quer corrigir?",
          timestamp: /* @__PURE__ */ new Date()
        });
        setMessages(updated2);
        persistChat(updated2);
        return;
      }
      const resolved = resolveCategoryStrict(text);
      if (resolved) {
        const updatedTx = state.transactions.map(
          (t) => t.id === target.id ? { ...t, category: resolved } : t
        );
        const newState2 = { ...state, transactions: updatedTx };
        toast.success("Corrigido", { description: `${target.description.slice(0, 30)} \u2192 ${resolved}` });
        const updated2 = messages.map(
          (m) => m.id === pendingCorr.id ? { ...m, correctionPending: { ...m.correctionPending, answered: true } } : m
        );
        updated2.push(userMsg, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Feito \u{1F642} Atualizei esse gasto para ${resolved}.`,
          timestamp: /* @__PURE__ */ new Date()
        });
        setState(newState2);
        setMessages(updated2);
        persistState(newState2);
        persistChat(updated2);
        return;
      }
      const reprompt = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Ainda preciso concluir a corre\xE7\xE3o \u{1F642} Em qual categoria deseja mover esse lan\xE7amento?",
        timestamp: /* @__PURE__ */ new Date()
      };
      const updated = [...messages, userMsg, reprompt];
      setMessages(updated);
      persistChat(updated);
      return;
    }
    const pending = [...messages].reverse().find(
      (m) => m.role === "assistant" && m.categoryPick && !m.categoryPick.answered
    );
    if (pending && pending.categoryPick) {
      const resolved = resolveCategoryFromText(text);
      if (resolved) {
        const { amount, description } = pending.categoryPick;
        const tx = createTransaction({
          kind: "transaction",
          type: "expense",
          amount,
          category: resolved,
          description
        });
        const newState2 = { ...state, transactions: [...state.transactions, tx] };
        toast.success("Registrado", { description: `R$${amount.toFixed(2)} em ${resolved}.` });
        const updated2 = messages.map(
          (m) => m.id === pending.id ? { ...m, categoryPick: { ...m.categoryPick, answered: true } } : m
        );
        updated2.push(userMsg, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Registrei R$${amount.toFixed(2)} como despesa em ${resolved}.`,
          timestamp: /* @__PURE__ */ new Date()
        });
        setState(newState2);
        setMessages(updated2);
        persistState(newState2);
        persistChat(updated2);
        return;
      }
      const reprompt = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `N\xE3o reconheci essa categoria. Escolhe uma: ${SUGGESTED_PICK_CATEGORIES.join(", ")}.`,
        timestamp: /* @__PURE__ */ new Date()
      };
      const updated = [...messages, userMsg, reprompt];
      setMessages(updated);
      persistChat(updated);
      return;
    }
    const conversational = detectConversationalIntent(text);
    const conversationalWins = conversational.kind === "advice" || conversational.kind === "greeting" || conversational.kind === "thanks" || conversational.kind === "help_general" || conversational.kind === "financial_health" || conversational.kind === "correction";
    const parsed = conversationalWins ? null : parseInput(text);
    let newState = { ...state };
    let aiResponse = null;
    let pendingCorrectionTargetId = null;
    let createdTx = null;
    if (!parsed) {
      const intent = conversationalWins ? conversational : detectConversationalIntent(text);
      switch (intent.kind) {
        case "advice":
          aiResponse = getContextualAdvice(newState, intent.topic);
          break;
        case "correction": {
          const flipType = intent.newType;
          if (flipType === "goal_contribution") {
            const target2 = findRecentTransactionToCorrect(newState, intent.targetHint, "expense");
            if (!target2) {
              aiResponse = "Ainda n\xE3o encontrei um lan\xE7amento recente pra corrigir.";
            } else {
              const goal = findMatchingGoal(newState.goals, intent.goalHint ?? null);
              if (!goal) {
                aiResponse = 'Voc\xEA ainda n\xE3o tem uma meta. Quer criar uma agora? Diga "Quero economizar 500 para viagem".';
              } else {
                const filteredTx = newState.transactions.filter((t) => t.id !== target2.id);
                const contribution = createGoalContribution(target2.amount, goal, target2.description);
                const updatedGoals = newState.goals.map(
                  (g) => g.id === goal.id ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + target2.amount) } : g
                );
                newState = { ...newState, transactions: [...filteredTx, contribution], goals: updatedGoals };
                toast.success("Corrigido", { description: `Movido para a meta "${goal.name}".` });
                aiResponse = `Feito. Corrigi esse lan\xE7amento para sua meta "${goal.name}".`;
              }
            }
            break;
          }
          const lookFor = flipType ? flipType === "expense" ? "income" : "expense" : "expense";
          const target = findRecentTransactionToCorrect(newState, intent.targetHint, lookFor);
          if (!intent.newCategory && !flipType) {
            if (target) {
              const label = intent.targetHint ? intent.targetHint.charAt(0).toUpperCase() + intent.targetHint.slice(1) : target.description;
              aiResponse = `Claro. Para qual categoria voc\xEA quer mover ${label}?`;
              pendingCorrectionTargetId = target.id;
            } else {
              aiResponse = "Claro. Qual lan\xE7amento voc\xEA quer corrigir e para qual categoria?";
            }
            break;
          }
          if (!target) {
            aiResponse = "Ainda n\xE3o encontrei uma transa\xE7\xE3o recente pra corrigir. Registre uma primeira e depois me avise.";
          } else {
            const oldCat = target.category;
            const oldType = target.type;
            const nextType = flipType ?? target.type;
            const nextCategory = intent.newCategory ?? (nextType === "expense" && oldType !== "expense" ? "Outros" : nextType === "income" && oldType !== "income" ? "Outros Ganhos" : oldCat);
            if (oldType === nextType && oldCat === nextCategory) {
              aiResponse = `Esse lan\xE7amento j\xE1 est\xE1 em ${oldCat}. Nada a alterar.`;
            } else {
              const updatedTx = newState.transactions.map(
                (t) => t.id === target.id ? { ...t, type: nextType, category: nextCategory } : t
              );
              newState = { ...newState, transactions: updatedTx };
              const typeLabel = nextType === "expense" ? "despesa" : "receita";
              toast.success("Transa\xE7\xE3o atualizada", {
                description: `${target.description.slice(0, 30)} \u2192 ${typeLabel} em ${nextCategory}`
              });
              aiResponse = flipType ? `Feito. Atualizei essa transa\xE7\xE3o como ${typeLabel} em ${nextCategory} e recalculei seu saldo.` : `Feito. Atualizei "${target.description}" de ${oldCat} para ${nextCategory}. Seu dashboard j\xE1 foi recalculado.`;
            }
          }
          break;
        }
        case "greeting":
          aiResponse = `Oi${state.user.name ? `, ${state.user.name}` : ""}! Quer registrar algo ou prefere uma dica de finan\xE7as?`;
          break;
        case "thanks":
          aiResponse = "T\xF4 aqui pra isso. \u{1F49C}";
          break;
        case "balance":
          aiResponse = `Seu saldo atual \xE9 R$${getBalance(newState).toFixed(2)}.`;
          break;
        case "expenses_query": {
          const { expenses } = getMonthlyTotals(newState);
          aiResponse = `Voc\xEA gastou R$${expenses.toFixed(2)} este m\xEAs.`;
          break;
        }
        case "goals_query": {
          const totalSaved = newState.goals.reduce((a, g) => a + g.currentAmount, 0);
          aiResponse = newState.goals.length === 0 ? 'Voc\xEA ainda n\xE3o tem metas. Que tal criar uma? Diga algo como "Quero economizar 500 para viagem".' : `Voc\xEA j\xE1 juntou R$${totalSaved.toFixed(2)} entre suas metas. Continua firme!`;
          break;
        }
        case "financial_health":
          aiResponse = explainFinancialHealthByFocus(newState, intent.focus);
          break;
        case "help_general":
          aiResponse = 'Eu te ajudo a controlar suas finan\xE7as no dia a dia. Voc\xEA pode:\n\n- registrar gastos ("gastei 30 no almo\xE7o")\n- registrar receitas ("recebi 2000 de sal\xE1rio")\n- guardar pra metas ("guardei 100 para viagem")\n- corrigir uma categoria ("muda Netflix para streaming")\n- pedir dicas ("como economizar?")';
          break;
        default:
          aiResponse = "N\xE3o entendi totalmente. Voc\xEA quis registrar um gasto, corrigir uma categoria, ou t\xE1 buscando alguma dica de finan\xE7as?";
      }
    } else if (parsed.kind === "create_goal") {
      const goal = createGoal(parsed.goalName, parsed.amount);
      newState = { ...newState, goals: [...newState.goals, goal] };
      toast.success("Meta criada", { description: `${goal.name} \u2014 R$${goal.targetAmount.toFixed(2)}` });
      aiResponse = `Meta criada. Vou te ajudar a chegar l\xE1.`;
    } else if (parsed.kind === "goal_contribution") {
      const matched = findMatchingGoal(newState.goals, parsed.goalHint);
      if (!matched) {
        aiResponse = 'Voc\xEA ainda n\xE3o tem uma meta. Crie uma assim: "Quero economizar 500 para viagem".';
      } else {
        newState = contributeToGoal(matched, parsed.amount, parsed.description, newState);
        toast.success("Poupan\xE7a registrada", {
          description: `Adicionei R$${parsed.amount.toFixed(2)} \xE0 sua meta "${matched.name}".`
        });
        const updated = newState.goals.find((g) => g.id === matched.id);
        const pct = Math.min(100, updated.currentAmount / updated.targetAmount * 100);
        aiResponse = pct >= 100 ? `Meta "${matched.name}" conclu\xEDda! \u{1F389}` : `Voc\xEA j\xE1 tem ${pct.toFixed(0)}% da meta "${matched.name}".`;
      }
    } else if (parsed.kind === "transaction_pending_category") {
      const pickMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Posso registrar \u{1F642} Em qual categoria esse gasto de **R$${parsed.amount.toFixed(2)}** entra?`,
        timestamp: /* @__PURE__ */ new Date(),
        categoryPick: {
          amount: parsed.amount,
          description: parsed.description,
          options: SUGGESTED_PICK_CATEGORIES
        }
      };
      const newMessages2 = [...messages, userMsg, pickMsg];
      setMessages(newMessages2);
      persistChat(newMessages2);
      return;
    } else {
      const tx = createTransaction(parsed);
      newState = { ...newState, transactions: [...newState.transactions, tx] };
      toast.success("Registrado", { description: generateConfirmation(newState, parsed) });
      const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? null;
      aiResponse = generateContextualResponse(newState, parsed, lastAssistant);
      createdTx = tx;
    }
    let newMessages = [...messages, userMsg];
    if (aiResponse) {
      newMessages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse,
        timestamp: /* @__PURE__ */ new Date(),
        ...pendingCorrectionTargetId ? { correctionPending: { targetId: pendingCorrectionTargetId } } : {}
      });
    }
    if (createdTx) {
      const candidate = getRecurringCandidatePrompt(newState, createdTx);
      if (candidate) {
        const month = currentMonth();
        const recurring = { ...newState.recurring ?? {} };
        recurring[candidate.signature] = {
          ...recurring[candidate.signature] ?? {},
          candidatePromptMonth: month
        };
        newState = { ...newState, recurring };
        const valueStr = `R$${candidate.amount.toFixed(2)}`;
        const content = candidate.type === "income" && candidate.category === "Sal\xE1rio" ? `Percebi que sal\xE1rio pode ser recorrente.

Deseja salvar como recorrente?

**${candidate.merchantLabel}** \u2014 ${valueStr}` : candidate.category === "Moradia" && candidate.merchantLabel.toLowerCase() === "internet" ? `Internet parece um gasto recorrente.

Deseja lembrar desse lan\xE7amento nos pr\xF3ximos meses?

**${candidate.merchantLabel}** \u2014 ${valueStr}` : `Percebi que ${candidate.merchantLabel} pode ser recorrente.

Deseja salvar como recorrente?

**${candidate.merchantLabel}** \u2014 ${valueStr}`;
        newMessages = [...newMessages, {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          timestamp: /* @__PURE__ */ new Date(),
          recurringPick: {
            signature: candidate.signature,
            type: candidate.type,
            category: candidate.category,
            merchantLabel: candidate.merchantLabel,
            amount: candidate.amount,
            mode: "candidate"
          }
        }];
        setState(newState);
        setMessages(newMessages);
        persistState(newState);
        persistChat(newMessages);
        return;
      }
    }
    if (createdTx) {
      const change = detectRecurringValueChange(newState, createdTx);
      if (change) {
        const recurring = { ...newState.recurring ?? {} };
        recurring[change.signature] = {
          ...recurring[change.signature] ?? {},
          updatePromptMonth: currentMonth()
        };
        newState = { ...newState, recurring };
        newMessages = [...newMessages, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Percebi uma mudan\xE7a no valor recorrente de ${change.merchantLabel} (antes R$${change.previousAmount.toFixed(2)}, agora R$${change.newAmount.toFixed(2)}). Deseja atualizar a recorr\xEAncia para R$${change.newAmount.toFixed(2)}?`,
          timestamp: /* @__PURE__ */ new Date(),
          recurringUpdate: {
            signature: change.signature,
            merchantLabel: change.merchantLabel,
            newAmount: change.newAmount
          }
        }];
      }
    }
    const afterRec = maybeAppendRecurringSuggestion(newState, newMessages);
    newState = afterRec.state;
    newMessages = afterRec.messages;
    const after = maybeAppendSavingsSuggestion(newState, newMessages);
    newState = after.state;
    newMessages = after.messages;
    setState(newState);
    setMessages(newMessages);
    persistState(newState);
    persistChat(newMessages);
  }, [state, messages, persistState, persistChat, contributeToGoal]);
  const respondToCategoryPick = useCallback((messageId, category) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.categoryPick || msg.categoryPick.answered) return;
    const { amount, description } = msg.categoryPick;
    const tx = createTransaction({
      kind: "transaction",
      type: "expense",
      amount,
      category,
      description
    });
    const newState = { ...state, transactions: [...state.transactions, tx] };
    toast.success("Registrado", { description: `R$${amount.toFixed(2)} em ${category}.` });
    const updated = messages.map(
      (m) => m.id === messageId ? { ...m, categoryPick: { ...m.categoryPick, answered: true } } : m
    );
    updated.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Registrei R$${amount.toFixed(2)} como despesa em ${category}.`,
      timestamp: /* @__PURE__ */ new Date()
    });
    setState(newState);
    setMessages(updated);
    persistState(newState);
    persistChat(updated);
  }, [messages, state, persistState, persistChat]);
  const respondToRecurringPick = useCallback((messageId, accept) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.recurringPick || msg.recurringPick.answered) return;
    const pick = msg.recurringPick;
    const month = currentMonth();
    let newState = state;
    let aiText;
    if (accept) {
      if (pick.mode === "candidate") {
        const recurring = { ...state.recurring ?? {} };
        recurring[pick.signature] = {
          ...recurring[pick.signature] ?? {},
          confirmed: true
        };
        newState = { ...state, recurring };
        aiText = `Perfeito. Vou lembrar de ${pick.merchantLabel} como recorrente em ${pick.category}.`;
      } else {
        const tx = createTransaction(
          pick.type === "income" ? { kind: "transaction", type: "income", amount: pick.amount, category: pick.category, description: pick.merchantLabel } : { kind: "transaction", type: "expense", amount: pick.amount, category: pick.category, description: pick.merchantLabel }
        );
        newState = { ...state, transactions: [...state.transactions, tx] };
        toast.success("Registrado", { description: `${pick.merchantLabel} \u2014 R$${pick.amount.toFixed(2)}` });
        aiText = `Feito. Registrei ${pick.merchantLabel} de R$${pick.amount.toFixed(2)} em ${pick.category}.`;
      }
    } else {
      const recurring = { ...state.recurring ?? {} };
      recurring[pick.signature] = {
        ...recurring[pick.signature] ?? {},
        ...pick.mode === "candidate" ? { candidatePromptMonth: month } : { dismissed: month }
      };
      newState = { ...state, recurring };
      aiText = pick.mode === "candidate" ? "Tudo bem, n\xE3o vou salvar isso como recorrente agora." : "Tranquilo, n\xE3o registro ent\xE3o.";
    }
    const updated = messages.map(
      (m) => m.id === messageId ? { ...m, recurringPick: { ...m.recurringPick, answered: true } } : m
    );
    updated.push({ id: crypto.randomUUID(), role: "assistant", content: aiText, timestamp: /* @__PURE__ */ new Date() });
    setState(newState);
    setMessages(updated);
    persistState(newState);
    persistChat(updated);
  }, [messages, state, persistState, persistChat]);
  const respondToRecurringUpdate = useCallback((messageId, accept) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg?.recurringUpdate || msg.recurringUpdate.answered) return;
    const upd = msg.recurringUpdate;
    const recurring = { ...state.recurring ?? {} };
    if (accept) {
      recurring[upd.signature] = {
        ...recurring[upd.signature] ?? {},
        baseline: upd.newAmount,
        updatePromptMonth: currentMonth()
      };
    } else {
      recurring[upd.signature] = { ...recurring[upd.signature] ?? {}, updatePromptMonth: currentMonth() };
    }
    const newState = { ...state, recurring };
    const aiText = accept ? `Atualizado. Vou considerar R$${upd.newAmount.toFixed(2)} como novo valor recorrente de ${upd.merchantLabel}.` : "Beleza, mantenho o valor anterior como recorr\xEAncia.";
    const updated = messages.map(
      (m) => m.id === messageId ? { ...m, recurringUpdate: { ...m.recurringUpdate, answered: true } } : m
    );
    updated.push({ id: crypto.randomUUID(), role: "assistant", content: aiText, timestamp: /* @__PURE__ */ new Date() });
    setState(newState);
    setMessages(updated);
    persistState(newState);
    persistChat(updated);
  }, [messages, state, persistState, persistChat]);
  const resetAll = useCallback(() => {
    clearAllGranaStorage();
    const fresh = { transactions: [], goals: [], user: DEFAULT_USER };
    setState(fresh);
    setMessages([welcomeMessage("")]);
  }, []);
  return {
    state,
    messages,
    sendMessage,
    completeOnboarding,
    addGoal,
    deleteGoal,
    respondToSuggestion,
    respondToCategoryPick,
    respondToRecurringPick,
    respondToRecurringUpdate,
    resetAll
  };
}
export {
  useFinance
};
