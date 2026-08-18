import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  FinanceState,
  UserProfile,
  Goal,
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
  getAdviceResponse,
  getContextualAdvice,
  explainFinancialHealth,
  explainFinancialHealthByFocus,
  findRecentExpenseToCorrect,
  findRecentTransactionToCorrect,
  SUGGESTED_PICK_CATEGORIES,
  resolveCategoryFromText,
  resolveCategoryStrict,
} from './finance';
import {
  getRecurringSuggestion,
  getRecurringCandidatePrompt,
  detectRecurringValueChange,
  isYes,
  isNo,
} from './recurring';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Optional pending suggestion attached to the message (savings suggestion)
  suggestion?: {
    kind: 'savings';
    amount: number;
    goalId: string;
    answered?: boolean;
  };
  // Optional pending category pick (low-confidence expense)
  categoryPick?: {
    amount: number;
    description: string;
    options: string[];
    answered?: boolean;
  };
  // Optional pending correction (assistant asked which category to move to)
  correctionPending?: {
    targetId: string;
    answered?: boolean;
  };
  // Optional recurring-transaction suggestion ("register again?").
  recurringPick?: {
    signature: string;
    type: 'expense' | 'income';
    category: string;
    merchantLabel: string;
    amount: number;
    mode?: 'candidate' | 'register';
    answered?: boolean;
  };
  // Optional recurring baseline update prompt ("update recurring value?").
  recurringUpdate?: {
    signature: string;
    merchantLabel: string;
    newAmount: number;
    answered?: boolean;
  };
}


// Per-install (per-browser) namespace ensures session isolation.
// Each browser/device/incognito session gets its own UUID and its own
// storage keys, so user data is never shared across visitors.
const INSTALL_ID_KEY = 'grana-ai-install-id';
const KEY_PREFIX = 'grana-ai';

function getInstallId(): string {
  try {
    let id = localStorage.getItem(INSTALL_ID_KEY);
    if (!id) {
      id = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(INSTALL_ID_KEY, id);
    }
    return id;
  } catch {
    return 'ephemeral';
  }
}

const INSTALL_ID = typeof window !== 'undefined' ? getInstallId() : 'ssr';
const STORAGE_KEY = `${KEY_PREFIX}:${INSTALL_ID}:state`;
const CHAT_KEY = `${KEY_PREFIX}:${INSTALL_ID}:chat`;

const DEFAULT_USER: UserProfile = { name: '', onboarded: false };
const EMPTY_STATE: FinanceState = { transactions: [], goals: [], user: DEFAULT_USER };

function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_STATE;
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      user: parsed.user && typeof parsed.user === 'object' ? parsed.user : DEFAULT_USER,
      shownSavingsSuggestionMonth: parsed.shownSavingsSuggestionMonth,
      recurring: parsed.recurring && typeof parsed.recurring === 'object' ? parsed.recurring : {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

function loadChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function clearAllGranaStorage() {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(`${KEY_PREFIX}:`) || k.startsWith('grana-ai-'))) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function welcomeMessage(name: string): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: name
      ? `Oi, ${name}! Me conta o que rolou. Ex: "Gastei 30 no almoço", "Recebi 2000 de salário" ou "Guardei 100 para minha meta".`
      : 'Oi! Me conta o que você gastou, recebeu ou guardou.',
    timestamp: new Date(),
  };
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(loadState);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChat();
    return saved.length > 0 ? saved : [welcomeMessage('')];
  });

  const persistState = useCallback((newState: FinanceState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const persistChat = useCallback((newMessages: ChatMessage[]) => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(newMessages));
  }, []);

  const completeOnboarding = useCallback((profile: Omit<UserProfile, 'onboarded'>) => {
    const newState: FinanceState = {
      ...state,
      user: { ...profile, onboarded: true },
    };
    setState(newState);
    persistState(newState);
    const welcome = welcomeMessage(profile.name);
    setMessages([welcome]);
    persistChat([welcome]);
  }, [state, persistState, persistChat]);

  const addGoal = useCallback((name: string, amount: number) => {
    const goal = createGoal(name, amount);
    const newState = { ...state, goals: [...state.goals, goal] };
    setState(newState);
    persistState(newState);
    toast.success('Meta criada', { description: `${name} — R$${amount.toFixed(2)}` });
  }, [state, persistState]);

  const deleteGoal = useCallback((id: string) => {
    const newState = { ...state, goals: state.goals.filter(g => g.id !== id) };
    setState(newState);
    persistState(newState);
  }, [state, persistState]);

  // Apply contribution to a goal (used both via chat and via savings suggestion)
  const contributeToGoal = useCallback((goal: Goal, amount: number, description: string, currentState: FinanceState): FinanceState => {
    const tx = createGoalContribution(amount, goal, description);
    const updatedGoals = currentState.goals.map(g =>
      g.id === goal.id
        ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) }
        : g
    );
    return { ...currentState, transactions: [...currentState.transactions, tx], goals: updatedGoals };
  }, []);

  // Maybe append a savings suggestion to chat (only once per month)
  const maybeAppendSavingsSuggestion = (curState: FinanceState, curMessages: ChatMessage[]): { state: FinanceState; messages: ChatMessage[] } => {
    const month = currentMonth();
    if (curState.shownSavingsSuggestionMonth === month) return { state: curState, messages: curMessages };
    const suggestion = computeSavingsSuggestion(curState);
    if (!suggestion) return { state: curState, messages: curMessages };

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Você ainda tem uma folga este mês. Quer guardar **R$${suggestion.amount.toFixed(2)}** para sua meta "${suggestion.goal.name}"?`,
      timestamp: new Date(),
      suggestion: { kind: 'savings', amount: suggestion.amount, goalId: suggestion.goal.id },
    };
    return {
      state: { ...curState, shownSavingsSuggestionMonth: month },
      messages: [...curMessages, msg],
    };
  };

  // Append at most ONE recurring transaction suggestion per turn. Skips
  // when any other pending prompt is still unanswered to avoid stacking.
  const maybeAppendRecurringSuggestion = (
    curState: FinanceState,
    curMessages: ChatMessage[],
  ): { state: FinanceState; messages: ChatMessage[] } => {
    const hasPending = curMessages.some(
      m =>
        m.role === 'assistant' &&
        ((m.suggestion && !m.suggestion.answered) ||
          (m.categoryPick && !m.categoryPick.answered) ||
          (m.correctionPending && !m.correctionPending.answered) ||
          (m.recurringPick && !m.recurringPick.answered) ||
          (m.recurringUpdate && !m.recurringUpdate.answered)),
    );
    if (hasPending) return { state: curState, messages: curMessages };

    const sug = getRecurringSuggestion(curState);
    if (!sug) return { state: curState, messages: curMessages };

    const month = currentMonth();
    const valueStr = `R$${sug.amount.toFixed(2)}`;
    let content: string;
    if (sug.type === 'income' && sug.category === 'Salário') {
      content = `Você costuma receber salário próximo desta data. Deseja registrar novamente?\n\n**${sug.merchantLabel}** — ${valueStr}`;
    } else if (sug.category === 'Streaming' || sug.category === 'Assinaturas') {
      content = `${sug.merchantLabel} costuma aparecer neste período. Registrar ${valueStr} novamente?`;
    } else if (sug.type === 'expense') {
      content = `Percebi um gasto recorrente:\n\n**${sug.merchantLabel}** — ${valueStr}\n\nDeseja registrar novamente este mês?`;
    } else {
      content = `${sug.merchantLabel} costuma entrar por aqui. Registrar ${valueStr} novamente?`;
    }

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      recurringPick: {
        signature: sug.signature,
        type: sug.type,
        category: sug.category,
        merchantLabel: sug.merchantLabel,
        amount: sug.amount,
          mode: 'register',
      },
    };
    const recurring = { ...(curState.recurring ?? {}) };
    recurring[sug.signature] = { ...(recurring[sug.signature] ?? {}), suggestedMonth: month };
    return {
      state: { ...curState, recurring },
      messages: [...curMessages, msg],
    };
  };


  const respondToSuggestion = useCallback((messageId: string, accept: boolean) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.suggestion || msg.suggestion.answered) return;

    let newState = state;
    let aiText: string;

    if (accept) {
      const goal = state.goals.find(g => g.id === msg.suggestion!.goalId);
      if (!goal) {
        aiText = 'Essa meta não existe mais.';
      } else {
        newState = contributeToGoal(goal, msg.suggestion.amount, 'Sugestão automática de poupança', state);
        toast.success('Poupança adicionada', { description: `R$${msg.suggestion.amount.toFixed(2)} para "${goal.name}".` });
        aiText = `Feito. Mais R$${msg.suggestion.amount.toFixed(2)} na sua meta "${goal.name}".`;
      }
    } else {
      aiText = 'Tranquilo, fica pra próxima.';
    }

    const updatedMessages = messages.map(m =>
      m.id === messageId ? { ...m, suggestion: { ...m.suggestion!, answered: true } } : m
    );
    updatedMessages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiText,
      timestamp: new Date(),
    });

    setState(newState);
    setMessages(updatedMessages);
    persistState(newState);
    persistChat(updatedMessages);
  }, [messages, state, contributeToGoal, persistState, persistChat]);

  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // PENDING RECURRING PICK / UPDATE: accept short yes/no replies. Other
    // inputs silently dismiss the prompt (no insisting) and fall through
    // to the normal pipeline so the user can keep talking.
    const pendingRec = [...messages].reverse().find(
      m => m.role === 'assistant' && m.recurringPick && !m.recurringPick.answered,
    );
    if (pendingRec && pendingRec.recurringPick) {
      const pick = pendingRec.recurringPick;
      const yes = isYes(text);
      const no = isNo(text);
      if (yes || no) {
        const month = currentMonth();
        let newState = state;
        let aiText: string;
        if (yes) {
          if (pick.mode === 'candidate') {
            const recurring = { ...(state.recurring ?? {}) };
            recurring[pick.signature] = {
              ...(recurring[pick.signature] ?? {}),
              confirmed: true,
            };
            newState = { ...state, recurring };
            aiText = `Perfeito. Vou lembrar de ${pick.merchantLabel} como recorrente em ${pick.category}.`;
          } else {
            const tx = createTransaction(
              pick.type === 'income'
                ? { kind: 'transaction', type: 'income', amount: pick.amount, category: pick.category, description: pick.merchantLabel }
                : { kind: 'transaction', type: 'expense', amount: pick.amount, category: pick.category, description: pick.merchantLabel },
            );
            newState = { ...state, transactions: [...state.transactions, tx] };
            toast.success('Registrado', { description: `${pick.merchantLabel} — R$${pick.amount.toFixed(2)}` });
            aiText = `Feito. Registrei ${pick.merchantLabel} de R$${pick.amount.toFixed(2)} em ${pick.category}.`;
          }
        } else {
          const recurring = { ...(state.recurring ?? {}) };
          recurring[pick.signature] = {
            ...(recurring[pick.signature] ?? {}),
            ...(pick.mode === 'candidate' ? { candidatePromptMonth: month } : { dismissed: month }),
          };
          newState = { ...state, recurring };
          aiText = pick.mode === 'candidate'
            ? 'Tudo bem, não vou salvar isso como recorrente agora.'
            : 'Tranquilo, não registro então.';
        }
        const updated = messages.map(m =>
          m.id === pendingRec.id ? { ...m, recurringPick: { ...m.recurringPick!, answered: true } } : m,
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
        });
        setState(newState);
        setMessages(updated);
        persistState(newState);
        persistChat(updated);
        return;
      }
      // Not yes/no — leave the suggestion as-is (we never insist) and let
      // the normal pipeline handle this message.
    }


    const pendingRecUpd = [...messages].reverse().find(
      m => m.role === 'assistant' && m.recurringUpdate && !m.recurringUpdate.answered,
    );
    if (pendingRecUpd && pendingRecUpd.recurringUpdate) {
      const upd = pendingRecUpd.recurringUpdate;
      const yes = isYes(text);
      const no = isNo(text);
      if (yes || no) {
        let newState = state;
        let aiText: string;
        if (yes) {
          const recurring = { ...(state.recurring ?? {}) };
          recurring[upd.signature] = {
            ...(recurring[upd.signature] ?? {}),
            baseline: upd.newAmount,
            updatePromptMonth: currentMonth(),
          };
          newState = { ...state, recurring };
          aiText = `Atualizado. Vou considerar R$${upd.newAmount.toFixed(2)} como novo valor recorrente de ${upd.merchantLabel}.`;
        } else {
          const recurring = { ...(state.recurring ?? {}) };
          recurring[upd.signature] = { ...(recurring[upd.signature] ?? {}), updatePromptMonth: currentMonth() };
          newState = { ...state, recurring };
          aiText = 'Beleza, mantenho o valor anterior como recorrência.';
        }
        const updated = messages.map(m =>
          m.id === pendingRecUpd.id ? { ...m, recurringUpdate: { ...m.recurringUpdate!, answered: true } } : m,
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
        });
        setState(newState);
        setMessages(updated);
        persistState(newState);
        persistChat(updated);
        return;
      }
      // Not yes/no — leave update prompt as-is and continue.
    }



    // PENDING CORRECTION (priority 1): assistant previously asked
    // "Para qual categoria deseja mover?" — interpret the next reply as
    // the target category and apply it to the stored transaction.
    const pendingCorr = [...messages].reverse().find(
      m => m.role === 'assistant' && m.correctionPending && !m.correctionPending.answered
    );
    if (pendingCorr && pendingCorr.correctionPending) {
      const target = state.transactions.find(t => t.id === pendingCorr.correctionPending!.targetId);
      if (!target) {
        // Stored transaction no longer exists — clear and reprompt
        const updated = messages.map(m =>
          m.id === pendingCorr.id ? { ...m, correctionPending: { ...m.correctionPending!, answered: true } } : m
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Não encontrei mais esse lançamento. Pode me dizer qual quer corrigir?',
          timestamp: new Date(),
        });
        setMessages(updated);
        persistChat(updated);
        return;
      }
      const resolved = resolveCategoryStrict(text);
      if (resolved) {
        const updatedTx = state.transactions.map(t =>
          t.id === target.id ? { ...t, category: resolved } : t
        );
        const newState = { ...state, transactions: updatedTx };
        toast.success('Corrigido', { description: `${target.description.slice(0, 30)} → ${resolved}` });
        const updated = messages.map(m =>
          m.id === pendingCorr.id ? { ...m, correctionPending: { ...m.correctionPending!, answered: true } } : m
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Feito 🙂 Atualizei esse gasto para ${resolved}.`,
          timestamp: new Date(),
        });
        setState(newState);
        setMessages(updated);
        persistState(newState);
        persistChat(updated);
        return;
      }
      // Could not resolve → reprompt, keep pending state
      const reprompt: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Ainda preciso concluir a correção 🙂 Em qual categoria deseja mover esse lançamento?',
        timestamp: new Date(),
      };
      const updated = [...messages, userMsg, reprompt];
      setMessages(updated);
      persistChat(updated);
      return;
    }

    // PENDING CLARIFICATION (priority 2): if the last assistant message asked
    // for a category for a brand-new transaction, treat reply as that category.
    const pending = [...messages].reverse().find(
      m => m.role === 'assistant' && m.categoryPick && !m.categoryPick.answered
    );
    if (pending && pending.categoryPick) {
      const resolved = resolveCategoryFromText(text);
      if (resolved) {
        const { amount, description } = pending.categoryPick;
        const tx = createTransaction({
          kind: 'transaction',
          type: 'expense',
          amount,
          category: resolved,
          description,
        });
        const newState = { ...state, transactions: [...state.transactions, tx] };
        toast.success('Registrado', { description: `R$${amount.toFixed(2)} em ${resolved}.` });
        const updated = messages.map(m =>
          m.id === pending.id ? { ...m, categoryPick: { ...m.categoryPick!, answered: true } } : m
        );
        updated.push(userMsg, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Registrei R$${amount.toFixed(2)} como despesa em ${resolved}.`,
          timestamp: new Date(),
        });
        setState(newState);
        setMessages(updated);
        persistState(newState);
        persistChat(updated);
        return;
      }
      // Could not resolve → reprompt, keep pending state
      const reprompt: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Não reconheci essa categoria. Escolhe uma: ${SUGGESTED_PICK_CATEGORIES.join(', ')}.`,
        timestamp: new Date(),
      };
      const updated = [...messages, userMsg, reprompt];
      setMessages(updated);
      persistChat(updated);
      return;
    }


    // Conversational intents (advice/correction/etc) take priority over transaction parsing
    const conversational = detectConversationalIntent(text);
    const conversationalWins =
      conversational.kind === 'advice' ||
      conversational.kind === 'greeting' ||
      conversational.kind === 'thanks' ||
      conversational.kind === 'help_general' ||
      conversational.kind === 'financial_health' ||
      conversational.kind === 'correction';


    const parsed = conversationalWins ? null : parseInput(text);
    let newState: FinanceState = { ...state };
    let aiResponse: string | null = null;
    let pendingCorrectionTargetId: string | null = null;
    let createdTx: ReturnType<typeof createTransaction> | null = null;


    if (!parsed) {
      const intent = conversationalWins ? conversational : detectConversationalIntent(text);
      switch (intent.kind) {
        case 'advice':
          aiResponse = getContextualAdvice(newState, intent.topic);
          break;
        case 'correction': {
          const flipType = intent.newType;
          // Special case: convert latest expense into a savings/goal contribution
          if (flipType === 'goal_contribution') {
            const target = findRecentTransactionToCorrect(newState, intent.targetHint, 'expense');
            if (!target) {
              aiResponse = 'Ainda não encontrei um lançamento recente pra corrigir.';
            } else {
              const goal = findMatchingGoal(newState.goals, intent.goalHint ?? null);
              if (!goal) {
                aiResponse = 'Você ainda não tem uma meta. Quer criar uma agora? Diga "Quero economizar 500 para viagem".';
              } else {
                // Remove the old expense, add a goal contribution, update goal
                const filteredTx = newState.transactions.filter(t => t.id !== target.id);
                const contribution = createGoalContribution(target.amount, goal, target.description);
                const updatedGoals = newState.goals.map(g =>
                  g.id === goal.id
                    ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + target.amount) }
                    : g
                );
                newState = { ...newState, transactions: [...filteredTx, contribution], goals: updatedGoals };
                toast.success('Corrigido', { description: `Movido para a meta "${goal.name}".` });
                aiResponse = `Feito. Corrigi esse lançamento para sua meta "${goal.name}".`;
              }
            }
            break;
          }
          // When flipping type, find the opposite-type transaction first
          const lookFor = flipType
            ? (flipType === 'expense' ? 'income' : 'expense')
            : 'expense';
          const target = findRecentTransactionToCorrect(newState, intent.targetHint, lookFor);
          // Partial correction: no new category provided → ask the user
          // and store the target tx id so the next reply resolves it.
          if (!intent.newCategory && !flipType) {
            if (target) {
              const label = intent.targetHint
                ? intent.targetHint.charAt(0).toUpperCase() + intent.targetHint.slice(1)
                : target.description;
              aiResponse = `Claro. Para qual categoria você quer mover ${label}?`;
              pendingCorrectionTargetId = target.id;
            } else {
              aiResponse = 'Claro. Qual lançamento você quer corrigir e para qual categoria?';
            }
            break;
          }

          if (!target) {
            aiResponse = 'Ainda não encontrei uma transação recente pra corrigir. Registre uma primeira e depois me avise.';
          } else {
            const oldCat = target.category;
            const oldType = target.type;
            const nextType = (flipType ?? target.type) as 'expense' | 'income';
            const nextCategory = intent.newCategory ?? (
              nextType === 'expense' && oldType !== 'expense' ? 'Outros'
              : nextType === 'income' && oldType !== 'income' ? 'Outros Ganhos'
              : oldCat
            );
            // Skip fake/no-op corrections (same type AND same category)
            if (oldType === nextType && oldCat === nextCategory) {
              aiResponse = `Esse lançamento já está em ${oldCat}. Nada a alterar.`;
            } else {
              const updatedTx = newState.transactions.map(t =>
                t.id === target.id ? { ...t, type: nextType, category: nextCategory } : t
              );
              newState = { ...newState, transactions: updatedTx };
              const typeLabel = nextType === 'expense' ? 'despesa' : 'receita';
              toast.success('Transação atualizada', {
                description: `${target.description.slice(0, 30)} → ${typeLabel} em ${nextCategory}`,
              });
              aiResponse = flipType
                ? `Feito. Atualizei essa transação como ${typeLabel} em ${nextCategory} e recalculei seu saldo.`
                : `Feito. Atualizei "${target.description}" de ${oldCat} para ${nextCategory}. Seu dashboard já foi recalculado.`;
            }
          }
          break;
        }
        case 'greeting':
          aiResponse = `Oi${state.user.name ? `, ${state.user.name}` : ''}! Quer registrar algo ou prefere uma dica de finanças?`;
          break;
        case 'thanks':
          aiResponse = 'Tô aqui pra isso. 💜';
          break;
        case 'balance':
          aiResponse = `Seu saldo atual é R$${getBalance(newState).toFixed(2)}.`;
          break;
        case 'expenses_query': {
          const { expenses } = getMonthlyTotals(newState);
          aiResponse = `Você gastou R$${expenses.toFixed(2)} este mês.`;
          break;
        }
        case 'goals_query': {
          const totalSaved = newState.goals.reduce((a, g) => a + g.currentAmount, 0);
          aiResponse = newState.goals.length === 0
            ? 'Você ainda não tem metas. Que tal criar uma? Diga algo como "Quero economizar 500 para viagem".'
            : `Você já juntou R$${totalSaved.toFixed(2)} entre suas metas. Continua firme!`;
          break;
        }
        case 'financial_health':
          aiResponse = explainFinancialHealthByFocus(newState, intent.focus);
          break;
        case 'help_general':
          aiResponse = 'Eu te ajudo a controlar suas finanças no dia a dia. Você pode:\n\n- registrar gastos ("gastei 30 no almoço")\n- registrar receitas ("recebi 2000 de salário")\n- guardar pra metas ("guardei 100 para viagem")\n- corrigir uma categoria ("muda Netflix para streaming")\n- pedir dicas ("como economizar?")';
          break;
        default:
          aiResponse = 'Não entendi totalmente. Você quis registrar um gasto, corrigir uma categoria, ou tá buscando alguma dica de finanças?';
      }
    } else if (parsed.kind === 'create_goal') {
      const goal = createGoal(parsed.goalName, parsed.amount);
      newState = { ...newState, goals: [...newState.goals, goal] };
      toast.success('Meta criada', { description: `${goal.name} — R$${goal.targetAmount.toFixed(2)}` });
      aiResponse = `Meta criada. Vou te ajudar a chegar lá.`;
    } else if (parsed.kind === 'goal_contribution') {
      const matched = findMatchingGoal(newState.goals, parsed.goalHint);
      if (!matched) {
        aiResponse = 'Você ainda não tem uma meta. Crie uma assim: "Quero economizar 500 para viagem".';
      } else {
        newState = contributeToGoal(matched, parsed.amount, parsed.description, newState);
        toast.success('Poupança registrada', {
          description: `Adicionei R$${parsed.amount.toFixed(2)} à sua meta "${matched.name}".`,
        });
        const updated = newState.goals.find(g => g.id === matched.id)!;
        const pct = Math.min(100, (updated.currentAmount / updated.targetAmount) * 100);
        aiResponse = pct >= 100
          ? `Meta "${matched.name}" concluída! 🎉`
          : `Você já tem ${pct.toFixed(0)}% da meta "${matched.name}".`;
      }
    } else if (parsed.kind === 'transaction_pending_category') {
      // Low-confidence: ask the user which category before registering
      const pickMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Posso registrar 🙂 Em qual categoria esse gasto de **R$${parsed.amount.toFixed(2)}** entra?`,
        timestamp: new Date(),
        categoryPick: {
          amount: parsed.amount,
          description: parsed.description,
          options: SUGGESTED_PICK_CATEGORIES,
        },
      };
      const newMessages = [...messages, userMsg, pickMsg];
      setMessages(newMessages);
      persistChat(newMessages);
      return;
    } else {
      // transaction
      const tx = createTransaction(parsed);
      newState = { ...newState, transactions: [...newState.transactions, tx] };
      toast.success('Registrado', { description: generateConfirmation(newState, parsed) });
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')?.content ?? null;
      aiResponse = generateContextualResponse(newState, parsed, lastAssistant);
      createdTx = tx;
    }

    let newMessages: ChatMessage[] = [...messages, userMsg];
    if (aiResponse) {
      newMessages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        ...(pendingCorrectionTargetId
          ? { correctionPending: { targetId: pendingCorrectionTargetId } }
          : {}),
      });
    }

    // Immediately after a successful save, if this is now the 2nd occurrence
    // of a high-confidence pattern, ask to save it as recurring.
    if (createdTx) {
      const candidate = getRecurringCandidatePrompt(newState, createdTx);
      if (candidate) {
        const month = currentMonth();
        const recurring = { ...(newState.recurring ?? {}) };
        recurring[candidate.signature] = {
          ...(recurring[candidate.signature] ?? {}),
          candidatePromptMonth: month,
        };
        newState = { ...newState, recurring };

        const valueStr = `R$${candidate.amount.toFixed(2)}`;
        const content = candidate.type === 'income' && candidate.category === 'Salário'
          ? `Percebi que salário pode ser recorrente.\n\nDeseja salvar como recorrente?\n\n**${candidate.merchantLabel}** — ${valueStr}`
          : candidate.category === 'Moradia' && candidate.merchantLabel.toLowerCase() === 'internet'
            ? `Internet parece um gasto recorrente.\n\nDeseja lembrar desse lançamento nos próximos meses?\n\n**${candidate.merchantLabel}** — ${valueStr}`
            : `Percebi que ${candidate.merchantLabel} pode ser recorrente.\n\nDeseja salvar como recorrente?\n\n**${candidate.merchantLabel}** — ${valueStr}`;

        newMessages = [...newMessages, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          recurringPick: {
            signature: candidate.signature,
            type: candidate.type,
            category: candidate.category,
            merchantLabel: candidate.merchantLabel,
            amount: candidate.amount,
            mode: 'candidate',
          },
        }];

        setState(newState);
        setMessages(newMessages);
        persistState(newState);
        persistChat(newMessages);
        return;
      }
    }

    // Value-change prompt: if the new tx differs >20% from the recurring
    // baseline, ask the user before updating the remembered value.
    if (createdTx) {
      const change = detectRecurringValueChange(newState, createdTx);
      if (change) {
        const recurring = { ...(newState.recurring ?? {}) };
        recurring[change.signature] = {
          ...(recurring[change.signature] ?? {}),
          updatePromptMonth: currentMonth(),
        };
        newState = { ...newState, recurring };
        newMessages = [...newMessages, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Percebi uma mudança no valor recorrente de ${change.merchantLabel} (antes R$${change.previousAmount.toFixed(2)}, agora R$${change.newAmount.toFixed(2)}). Deseja atualizar a recorrência para R$${change.newAmount.toFixed(2)}?`,
          timestamp: new Date(),
          recurringUpdate: {
            signature: change.signature,
            merchantLabel: change.merchantLabel,
            newAmount: change.newAmount,
          },
        }];
      }
    }

    // Recurring "register again?" suggestion — only one per turn, only if
    // nothing else is pending.
    const afterRec = maybeAppendRecurringSuggestion(newState, newMessages);
    newState = afterRec.state;
    newMessages = afterRec.messages;

    // After processing, see if we should proactively suggest savings.
    const after = maybeAppendSavingsSuggestion(newState, newMessages);
    newState = after.state;
    newMessages = after.messages;

    setState(newState);
    setMessages(newMessages);
    persistState(newState);
    persistChat(newMessages);
  }, [state, messages, persistState, persistChat, contributeToGoal]);


  const respondToCategoryPick = useCallback((messageId: string, category: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.categoryPick || msg.categoryPick.answered) return;

    const { amount, description } = msg.categoryPick;
    const tx = createTransaction({
      kind: 'transaction',
      type: 'expense',
      amount,
      category,
      description,
    });
    const newState = { ...state, transactions: [...state.transactions, tx] };
    toast.success('Registrado', { description: `R$${amount.toFixed(2)} em ${category}.` });

    const updated = messages.map(m =>
      m.id === messageId ? { ...m, categoryPick: { ...m.categoryPick!, answered: true } } : m
    );
    updated.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Registrei R$${amount.toFixed(2)} como despesa em ${category}.`,
      timestamp: new Date(),
    });

    setState(newState);
    setMessages(updated);
    persistState(newState);
    persistChat(updated);
  }, [messages, state, persistState, persistChat]);


  const respondToRecurringPick = useCallback((messageId: string, accept: boolean) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.recurringPick || msg.recurringPick.answered) return;
    const pick = msg.recurringPick;
    const month = currentMonth();
    let newState: FinanceState = state;
    let aiText: string;
    if (accept) {
      if (pick.mode === 'candidate') {
        const recurring = { ...(state.recurring ?? {}) };
        recurring[pick.signature] = {
          ...(recurring[pick.signature] ?? {}),
          confirmed: true,
        };
        newState = { ...state, recurring };
        aiText = `Perfeito. Vou lembrar de ${pick.merchantLabel} como recorrente em ${pick.category}.`;
      } else {
        const tx = createTransaction(
          pick.type === 'income'
            ? { kind: 'transaction', type: 'income', amount: pick.amount, category: pick.category, description: pick.merchantLabel }
            : { kind: 'transaction', type: 'expense', amount: pick.amount, category: pick.category, description: pick.merchantLabel },
        );
        newState = { ...state, transactions: [...state.transactions, tx] };
        toast.success('Registrado', { description: `${pick.merchantLabel} — R$${pick.amount.toFixed(2)}` });
        aiText = `Feito. Registrei ${pick.merchantLabel} de R$${pick.amount.toFixed(2)} em ${pick.category}.`;
      }
    } else {
      const recurring = { ...(state.recurring ?? {}) };
      recurring[pick.signature] = {
        ...(recurring[pick.signature] ?? {}),
        ...(pick.mode === 'candidate' ? { candidatePromptMonth: month } : { dismissed: month }),
      };
      newState = { ...state, recurring };
      aiText = pick.mode === 'candidate'
        ? 'Tudo bem, não vou salvar isso como recorrente agora.'
        : 'Tranquilo, não registro então.';
    }
    const updated = messages.map(m =>
      m.id === messageId ? { ...m, recurringPick: { ...m.recurringPick!, answered: true } } : m,
    );
    updated.push({ id: crypto.randomUUID(), role: 'assistant', content: aiText, timestamp: new Date() });
    setState(newState);
    setMessages(updated);
    persistState(newState);
    persistChat(updated);
  }, [messages, state, persistState, persistChat]);

  const respondToRecurringUpdate = useCallback((messageId: string, accept: boolean) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.recurringUpdate || msg.recurringUpdate.answered) return;
    const upd = msg.recurringUpdate;
    const recurring = { ...(state.recurring ?? {}) };
    if (accept) {
      recurring[upd.signature] = {
        ...(recurring[upd.signature] ?? {}),
        baseline: upd.newAmount,
        updatePromptMonth: currentMonth(),
      };
    } else {
      recurring[upd.signature] = { ...(recurring[upd.signature] ?? {}), updatePromptMonth: currentMonth() };
    }
    const newState: FinanceState = { ...state, recurring };
    const aiText = accept
      ? `Atualizado. Vou considerar R$${upd.newAmount.toFixed(2)} como novo valor recorrente de ${upd.merchantLabel}.`
      : 'Beleza, mantenho o valor anterior como recorrência.';
    const updated = messages.map(m =>
      m.id === messageId ? { ...m, recurringUpdate: { ...m.recurringUpdate!, answered: true } } : m,
    );
    updated.push({ id: crypto.randomUUID(), role: 'assistant', content: aiText, timestamp: new Date() });
    setState(newState);
    setMessages(updated);
    persistState(newState);
    persistChat(updated);
  }, [messages, state, persistState, persistChat]);

  const resetAll = useCallback(() => {
    clearAllGranaStorage();
    const fresh = { transactions: [], goals: [], user: DEFAULT_USER };
    setState(fresh);
    setMessages([welcomeMessage('')]);
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
    resetAll,
  };
}
