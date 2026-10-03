import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  History,
  PiggyBank,
  Plus,
  ReceiptText,
  Save,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { loadTransactions } from "@/services/finance/store";
import { savePlannerSimulation } from "@/services/planner/store";

import "./Planejador.css";

const PERIOD_OPTIONS = [
  {
    id: "current_month",
    label: "Mês atual",
    description: "Receitas e despesas do mês em andamento.",
    icon: CalendarDays,
  },
  {
    id: "last_30_days",
    label: "Últimos 30 dias",
    description: "Sua movimentação financeira dos últimos 30 dias.",
    icon: Clock3,
  },
  {
    id: "last_3_months",
    label: "Média dos últimos 3 meses",
    description: "A média da sua movimentação dos últimos três meses.",
    icon: WalletCards,
  },
  {
    id: "no_history",
    label: "Sem histórico",
    description: "Crie sua meta sem usar movimentações anteriores.",
    icon: Sparkles,
  },
];

const INITIAL_FORM = {
  period: "current_month",
  goalName: "",
  goalAmount: "",
  goalDeadline: "",
};

const FIXED_EXPENSE_CATEGORIES = new Set([
  "Moradia",
  "Transporte",
  "Saúde",
]);

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getHistoryRange(period, referenceDate = new Date()) {
  const end = new Date(referenceDate);

  if (period === "current_month") {
    return {
      start: formatDateKey(
        new Date(end.getFullYear(), end.getMonth(), 1),
      ),
      end: formatDateKey(end),
      divisor: 1,
    };
  }

  if (period === "last_30_days") {
    const start = new Date(end);
    start.setDate(start.getDate() - 29);

    return {
      start: formatDateKey(start),
      end: formatDateKey(end),
      divisor: 1,
    };
  }

  if (period === "last_3_months") {
    const start = new Date(
      end.getFullYear(),
      end.getMonth() - 2,
      1,
    );

    return {
      start: formatDateKey(start),
      end: formatDateKey(end),
      divisor: 3,
    };
  }

  return null;
}

function buildHistoryAnalysis(transactions, period) {
  const range = getHistoryRange(period);

  if (!range) {
    return null;
  }

  const transactionsInRange = transactions.filter(
    (transaction) =>
      transaction.date >= range.start &&
      transaction.date <= range.end,
  );

  if (!transactionsInRange.length) {
    return {
      hasData: false,
      income: 0,
      fixedExpenses: 0,
      totalExpenses: 0,
      available: 0,
      commitmentRate: 0,
    };
  }

  const incomeTotal = transactionsInRange
    .filter((transaction) => transaction.amount > 0)
    .reduce(
      (total, transaction) => total + transaction.amount,
      0,
    );

  const expenseTransactions = transactionsInRange.filter(
    (transaction) => transaction.amount < 0,
  );

  const expensesTotal = expenseTransactions.reduce(
    (total, transaction) =>
      total + Math.abs(transaction.amount),
    0,
  );

  const fixedExpensesTotal = expenseTransactions
    .filter((transaction) =>
      FIXED_EXPENSE_CATEGORIES.has(transaction.category),
    )
    .reduce(
      (total, transaction) =>
        total + Math.abs(transaction.amount),
      0,
    );

  const income = incomeTotal / range.divisor;
  const totalExpenses = expensesTotal / range.divisor;
  const fixedExpenses =
    fixedExpensesTotal / range.divisor;

  const available = Math.max(
    income - totalExpenses,
    0,
  );

  const commitmentRate =
    income > 0
      ? (totalExpenses / income) * 100
      : 0;

  return {
    hasData: true,
    income,
    fixedExpenses,
    totalExpenses,
    available,
    commitmentRate,
  };
}

function formatCurrencyInput(value) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const numericValue = Number(digits) / 100;

  return numericValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrency(value) {
  if (!value) {
    return 0;
  }

  return Number(
    value
      .replace(/\./g, "")
      .replace(",", "."),
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function roundUpToCents(value) {
  return (
    Math.ceil(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

export default function Planejador() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [showResult, setShowResult] =
    useState(false);
  const [simulationAmount, setSimulationAmount] =
    useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const savedRef = useRef(false);
  const submissionTimer = useRef(null);

  const navigate = useNavigate();

  useEffect(
    () => () =>
      window.clearTimeout(
        submissionTimer.current,
      ),
    [],
  );

  const invalidateSave = () => {
    savedRef.current = false;
    setIsSaved(false);
    setSaveError("");
  };

  const handleNewSimulation = () => {
    if (
      showResult &&
      !savedRef.current &&
      !window.confirm(
        "Descartar a simulação não salva e iniciar uma nova?",
      )
    ) {
      return;
    }

    window.clearTimeout(
      submissionTimer.current,
    );

    setIsSubmitting(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setShowResult(false);
    setSimulationAmount(0);

    invalidateSave();

    const prefersReducedMotion =
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion
        ? "auto"
        : "smooth",
    });
  };

  const transactions = useMemo(
    () => loadTransactions(),
    [],
  );

  const selectedPeriod = useMemo(
    () =>
      PERIOD_OPTIONS.find(
        (option) =>
          option.id === form.period,
      ),
    [form.period],
  );

  const numericGoalAmount =
    parseCurrency(form.goalAmount);

  const numericGoalDeadline = Number(
    form.goalDeadline,
  );

  const monthlyReference = useMemo(() => {
    if (
      !numericGoalAmount ||
      numericGoalAmount <= 0 ||
      !numericGoalDeadline ||
      numericGoalDeadline <= 0
    ) {
      return 0;
    }

    return (
      numericGoalAmount /
      numericGoalDeadline
    );
  }, [
    numericGoalAmount,
    numericGoalDeadline,
  ]);

  const isWithoutHistory =
    form.period === "no_history";

  const historyAnalysis = useMemo(() => {
    if (isWithoutHistory) {
      return null;
    }

    return buildHistoryAnalysis(
      transactions,
      form.period,
    );
  }, [
    transactions,
    form.period,
    isWithoutHistory,
  ]);

  const hasUsableHistory = Boolean(
    historyAnalysis?.hasData,
  );

  const hasHistoryIncome =
    hasUsableHistory &&
    historyAnalysis.income > 0;

  const historyMonthlyCapacity =
    hasHistoryIncome
      ? historyAnalysis.available
      : 0;

  /*
   * Enquanto a integração definitiva com backend/MCP/AI Service
   * não está disponível, o histórico local funciona como fonte
   * transitória para contextualizar o planejamento.
   *
   * Quando existe margem financeira positiva identificada,
   * ela passa a ser a referência inicial do simulador.
   *
   * Se não existe histórico suficiente ou margem disponível,
   * preservamos a referência matemática básica da meta.
   */
  const usesHistoryReference =
    !isWithoutHistory &&
    hasHistoryIncome &&
    historyMonthlyCapacity > 0;

  const planningMonthlyReference =
    usesHistoryReference
      ? historyMonthlyCapacity
      : monthlyReference;

  const simulationMin = useMemo(() => {
    if (!planningMonthlyReference) {
      return 0;
    }

    return Math.max(
      0.01,
      roundUpToCents(
        planningMonthlyReference * 0.2,
      ),
    );
  }, [planningMonthlyReference]);

  const simulationMax = useMemo(() => {
    if (!planningMonthlyReference) {
      return 0;
    }

    return Math.max(
      simulationMin,
      roundUpToCents(
        planningMonthlyReference * 2,
      ),
    );
  }, [
    planningMonthlyReference,
    simulationMin,
  ]);

  const estimatedMonths = useMemo(() => {
    if (
      !numericGoalAmount ||
      numericGoalAmount <= 0 ||
      !simulationAmount ||
      simulationAmount <= 0
    ) {
      return 0;
    }

    return Math.ceil(
      numericGoalAmount /
        simulationAmount,
    );
  }, [
    numericGoalAmount,
    simulationAmount,
  ]);

  const deadlineDifference =
    estimatedMonths > 0
      ? estimatedMonths -
        numericGoalDeadline
      : 0;

  const updateField = (field, value) => {
    window.clearTimeout(
      submissionTimer.current,
    );

    setIsSubmitting(false);
    setShowResult(false);

    invalidateSave();

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.period) {
      nextErrors.period =
        "Escolha uma base para o planejamento.";
    }

    if (!form.goalName.trim()) {
      nextErrors.goalName =
        "Informe o nome da sua meta.";
    }

    if (
      !form.goalAmount ||
      !Number.isFinite(
        numericGoalAmount,
      ) ||
      numericGoalAmount <= 0
    ) {
      nextErrors.goalAmount =
        "Informe um valor maior que zero.";
    }

    if (
      !form.goalDeadline ||
      !Number.isInteger(
        numericGoalDeadline,
      ) ||
      numericGoalDeadline <= 0
    ) {
      nextErrors.goalDeadline =
        "Informe um prazo maior que zero.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length ===
      0
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    invalidateSave();

    const planningData = {
      period: {
        type: form.period,
        label:
          selectedPeriod?.label || "",
        usesHistory:
          !isWithoutHistory,
      },

      goal: {
        name: form.goalName.trim(),
        amount: numericGoalAmount,
        deadlineMonths:
          numericGoalDeadline,
      },

      /*
       * Snapshot transitório utilizado apenas pelo frontend.
       * Futuramente estes dados deverão vir das integrações
       * responsáveis pelo contexto financeiro.
       */
      historyContext:
        !isWithoutHistory &&
        historyAnalysis
          ? {
              hasData:
                historyAnalysis.hasData,
              income:
                historyAnalysis.income,
              fixedExpenses:
                historyAnalysis.fixedExpenses,
              totalExpenses:
                historyAnalysis.totalExpenses,
              available:
                historyAnalysis.available,
              commitmentRate:
                historyAnalysis.commitmentRate,
            }
          : null,

      createdAt:
        new Date().toISOString(),
    };

    console.log(
      "Junta.ai — planejamento:",
      planningData,
    );

    const initialSimulation =
      Math.min(
        Math.max(
          roundUpToCents(
            planningMonthlyReference,
          ),
          simulationMin,
        ),
        simulationMax,
      );

    window.clearTimeout(
      submissionTimer.current,
    );

    submissionTimer.current =
      window.setTimeout(() => {
        setSimulationAmount(
          initialSimulation,
        );
        setShowResult(true);
        setIsSubmitting(false);
      }, 400);
  };

  const handleSimulationChange = (
    event,
  ) => {
    invalidateSave();

    setSimulationAmount(
      Number(event.target.value),
    );
  };

  const handleSaveSimulation = () => {
    if (
      !showResult ||
      isSubmitting ||
      savedRef.current ||
      simulationAmount <= 0 ||
      estimatedMonths <= 0
    ) {
      return;
    }

    savedRef.current = true;

    try {
      savePlannerSimulation({
        id: crypto.randomUUID(),

        createdAt:
          new Date().toISOString(),

        period: {
          type: form.period,
          label: selectedPeriod.label,
          usesHistory:
            !isWithoutHistory,
        },

        goal: {
          name: form.goalName.trim(),
          amount: numericGoalAmount,
          deadlineMonths:
            numericGoalDeadline,
        },

        simulation: {
          monthlyAmount:
            simulationAmount,
          estimatedMonths,
        },

        historyContext:
          hasUsableHistory
            ? {
                income:
                  historyAnalysis.income,
                fixedExpenses:
                  historyAnalysis.fixedExpenses,
                totalExpenses:
                  historyAnalysis.totalExpenses,
                available:
                  historyAnalysis.available,
                commitmentRate:
                  historyAnalysis.commitmentRate,
              }
            : null,
      });

      setIsSaved(true);
      setSaveError("");
    } catch {
      savedRef.current = false;

      setSaveError(
        "Não foi possível salvar a simulação. Tente novamente.",
      );

      return;
    }

    navigate(
      "/planejador/historico",
    );
  };

  const simulationDescription =
    useMemo(() => {
      if (!estimatedMonths) {
        return "";
      }

      if (deadlineDifference < 0) {
        const monthsBeforeDeadline =
          Math.abs(
            deadlineDifference,
          );

        return `Nesse cenário, você alcançaria sua meta ${monthsBeforeDeadline} ${
          monthsBeforeDeadline === 1
            ? "mês"
            : "meses"
        } antes do prazo escolhido.`;
      }

      if (deadlineDifference > 0) {
        return `Nesse cenário, você precisaria de mais ${
          deadlineDifference === 1
            ? "1 mês"
            : `${deadlineDifference} meses`
        } além do prazo escolhido para alcançar a meta.`;
      }

      return "O cenário simulado está alinhado ao prazo escolhido para esta meta.";
    }, [
      estimatedMonths,
      deadlineDifference,
    ]);

  const historyInsight = useMemo(() => {
    if (isWithoutHistory) {
      return null;
    }

    if (!historyAnalysis?.hasData) {
      return {
        tone: "neutral",

        status:
          "Histórico insuficiente",

        title:
          "Ainda não há movimentações suficientes",

        viability:
          "Não encontramos movimentações no período selecionado para relacionar esta meta ao seu histórico financeiro.",

        diagnosis:
          "Sem dados suficientes, o planejamento continua usando apenas o valor da meta e o prazo informado como referência.",

        suggestion:
          "Você pode escolher outro período ou continuar com a simulação básica.",
      };
    }

    if (!hasHistoryIncome) {
      return {
        tone: "attention",

        status:
          "Sem renda identificada",

        title:
          "Precisamos de mais contexto financeiro",

        viability:
          "Encontramos movimentações no período, mas nenhuma entrada positiva que possa servir como referência de renda.",

        diagnosis:
          "Sem uma referência de entrada, não é possível estimar com segurança quanto do orçamento pode ser destinado à meta.",

        suggestion:
          "Revise seus lançamentos de entrada ou escolha outro período para o planejamento.",
      };
    }

    const required =
      monthlyReference;

    const available =
      historyAnalysis.available;

    const difference =
      available - required;

    const canReachDeadline =
      available >= required;

    const commitmentRate =
      historyAnalysis.commitmentRate.toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        },
      );

    return {
      tone: canReachDeadline
        ? "positive"
        : "attention",

      status: canReachDeadline
        ? "Meta viável no prazo"
        : "Meta pede ajuste",

      title: canReachDeadline
        ? "Seu histórico comporta a referência mensal"
        : "A referência mensal supera sua margem atual",

      viability: canReachDeadline
        ? `Para alcançar ${formatCurrency(
            numericGoalAmount,
          )} em ${numericGoalDeadline} ${
            numericGoalDeadline === 1
              ? "mês"
              : "meses"
          }, a referência seria ${formatCurrency(
            required,
          )} por mês. O histórico selecionado indica uma margem média de ${formatCurrency(
            available,
          )}.`
        : `Sua meta pede aproximadamente ${formatCurrency(
            required,
          )} por mês, enquanto o histórico selecionado indica uma margem de ${formatCurrency(
            available,
          )}. A diferença atual é de ${formatCurrency(
            Math.abs(difference),
          )} por mês.`,

      diagnosis:
        `No período selecionado, foram considerados ${formatCurrency(
          historyAnalysis.income,
        )} em entradas e ${formatCurrency(
          historyAnalysis.totalExpenses,
        )} em saídas. Aproximadamente ${commitmentRate}% da renda identificada está comprometida com despesas.`,

      suggestion: canReachDeadline
        ? "Você pode usar o simulador abaixo para testar quanto dessa margem deseja realmente reservar para a meta."
        : "Você pode testar um prazo maior ou ajustar o valor mensal no simulador antes de definir o planejamento.",
    };
  }, [
    isWithoutHistory,
    historyAnalysis,
    hasHistoryIncome,
    monthlyReference,
    numericGoalAmount,
    numericGoalDeadline,
  ]);

  return (
    <main className="planner-page">
      <AuthHeader activePath="/planejador" />

      <div className="planner-page__container">
        <header className="planner-page__hero">
          <div className="planner-page__hero-content">
            <span className="planner-page__eyebrow">
              Planejador
            </span>

            <h1 className="planner-page__title">
              Planeje uma meta do seu jeito.
            </h1>

            <p className="planner-page__description">
              Transforme um objetivo em um
              plano possível, usando sua
              realidade financeira como ponto
              de partida.
            </p>
          </div>

          <div className="planner-page__actions">
            <Button
              variant="secondary"
              onClick={
                handleNewSimulation
              }
            >
              <Plus
                size={17}
                aria-hidden="true"
              />
              Nova simulação
            </Button>

            <Link
              to="/planejador/historico"
              className="planner-page__history-link"
            >
              <History
                size={17}
                aria-hidden="true"
              />

              <span>Histórico</span>
            </Link>
          </div>
        </header>

        <form
          className="planner-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Base do planejamento */}

          <Card
            className="planner-section planner-section--base"
            padding="lg"
          >
            <div className="planner-section__header">
              <div className="planner-section__icon">
                <CalendarDays
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <div className="planner-section__heading">
                <h2 className="planner-section__title">
                  Qual período você quer
                  usar?
                </h2>

                <p className="planner-section__description">
                  Escolha a movimentação
                  financeira que servirá de
                  base para o seu
                  planejamento.
                </p>
              </div>
            </div>

            <div className="planner-periods">
              {PERIOD_OPTIONS.map(
                (option) => {
                  const Icon =
                    option.icon;

                  const isSelected =
                    form.period ===
                    option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`planner-period-card ${
                        isSelected
                          ? "planner-period-card--selected"
                          : ""
                      }`}
                      onClick={() =>
                        updateField(
                          "period",
                          option.id,
                        )
                      }
                      aria-pressed={
                        isSelected
                      }
                    >
                      <span className="planner-period-card__icon">
                        <Icon
                          size={19}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </span>

                      <span className="planner-period-card__content">
                        <strong>
                          {option.label}
                        </strong>

                        <span>
                          {
                            option.description
                          }
                        </span>
                      </span>

                      <span
                        className="planner-period-card__check"
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <Check
                            size={13}
                            strokeWidth={3}
                          />
                        )}
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            {errors.period && (
              <p className="planner-field__error">
                {errors.period}
              </p>
            )}
          </Card>

          {/* Meta */}

          <Card
            className="planner-section planner-section--goal"
            padding="lg"
          >
            <div className="planner-section__header">
              <div className="planner-section__icon">
                <Target
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <div className="planner-section__heading">
                <h2 className="planner-section__title">
                  O que você quer alcançar?
                </h2>

                <p className="planner-section__description">
                  Defina sua meta, o valor
                  que você precisa e em
                  quanto tempo quer chegar
                  lá.
                </p>
              </div>
            </div>

            <div className="planner-fields">
              <div className="planner-field planner-field--full">
                <label
                  htmlFor="goal-name"
                  className="planner-field__label"
                >
                  Nome da meta
                </label>

                <input
                  id="goal-name"
                  type="text"
                  className={`planner-field__input ${
                    errors.goalName
                      ? "planner-field__input--error"
                      : ""
                  }`}
                  placeholder="Ex.: Viagem para Portugal"
                  value={form.goalName}
                  maxLength={80}
                  onChange={(event) =>
                    updateField(
                      "goalName",
                      event.target.value,
                    )
                  }
                />

                <div className="planner-field__footer">
                  {errors.goalName ? (
                    <span className="planner-field__error">
                      {errors.goalName}
                    </span>
                  ) : (
                    <span>
                      Escolha um nome que
                      faça sentido para você.
                    </span>
                  )}
                </div>
              </div>

              <div className="planner-field">
                <label
                  htmlFor="goal-amount"
                  className="planner-field__label"
                >
                  Valor da meta
                </label>

                <div
                  className={`planner-field__money ${
                    errors.goalAmount
                      ? "planner-field__money--error"
                      : ""
                  }`}
                >
                  <span>R$</span>

                  <input
                    id="goal-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form.goalAmount}
                    onChange={(event) =>
                      updateField(
                        "goalAmount",
                        formatCurrencyInput(
                          event.target.value,
                        ),
                      )
                    }
                  />
                </div>

                {errors.goalAmount && (
                  <span className="planner-field__error">
                    {errors.goalAmount}
                  </span>
                )}
              </div>

              <div className="planner-field">
                <label
                  htmlFor="goal-deadline"
                  className="planner-field__label"
                >
                  Prazo desejado
                </label>

                <div
                  className={`planner-field__suffix ${
                    errors.goalDeadline
                      ? "planner-field__suffix--error"
                      : ""
                  }`}
                >
                  <input
                    id="goal-deadline"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="12"
                    value={
                      form.goalDeadline
                    }
                    onChange={(event) =>
                      updateField(
                        "goalDeadline",
                        event.target.value,
                      )
                    }
                  />

                  <span>meses</span>
                </div>

                {errors.goalDeadline && (
                  <span className="planner-field__error">
                    {errors.goalDeadline}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Prévia */}

          <Card
            className="planner-preview"
            padding="lg"
          >
            <div className="planner-preview__top">
              <div className="planner-preview__icon">
                <Sparkles
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              <div>
                <span className="planner-preview__eyebrow">
                  Prévia do planejamento
                </span>

                <h2 className="planner-preview__title">
                  {form.goalName.trim() ||
                    "Sua meta"}
                </h2>
              </div>
            </div>

            <div className="planner-preview__context">
              <span>Base</span>

              <strong>
                {isWithoutHistory
                  ? "Sem histórico financeiro"
                  : selectedPeriod?.label}
              </strong>
            </div>

            <div className="planner-preview__summary">
              <div>
                <span>Valor da meta</span>

                <strong>
                  {form.goalAmount
                    ? formatCurrency(
                        numericGoalAmount,
                      )
                    : "R$ 0,00"}
                </strong>
              </div>

              <div>
                <span>Prazo</span>

                <strong>
                  {numericGoalDeadline > 0
                    ? `${numericGoalDeadline} ${
                        numericGoalDeadline ===
                        1
                          ? "mês"
                          : "meses"
                      }`
                    : "Não definido"}
                </strong>
              </div>

              <div className="planner-preview__highlight">
                <span>
                  {usesHistoryReference
                    ? "Margem do histórico"
                    : "Referência mensal"}
                </span>

                <strong>
                  {planningMonthlyReference >
                  0
                    ? formatCurrency(
                        planningMonthlyReference,
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          </Card>

          <div className="planner-form__actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              loadingText="Preparando..."
              className="planner-form__submit"
            >
              <span>
                Criar planejamento
              </span>

              <ChevronRight
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Button>
          </div>
        </form>

        {/* Resultado do planejamento */}

        {showResult && (
          <section
            className="planner-result-wrapper"
            aria-labelledby="planner-result-title"
          >
            <div className="planner-result">
              <header className="planner-result__header">
                <span className="planner-result__eyebrow">
                  Resultado do seu
                  planejamento
                </span>

                <h2
                  id="planner-result-title"
                  className="planner-result__title"
                >
                  {form.goalName.trim()}
                </h2>

                <p className="planner-result__description">
                  {isWithoutHistory
                    ? "Veja a referência inicial, ajuste o valor mensal e acompanhe o impacto no prazo."
                    : "Veja como a sua meta se relaciona com o histórico financeiro selecionado e simule outros cenários."}
                </p>
              </header>

              {/* Métricas principais */}

              <div className="planner-result__metrics">
                <article className="planner-result__metric-card">
                  <span className="planner-result__metric-label">
                    Meta
                  </span>

                  <strong className="planner-result__metric-value">
                    {formatCurrency(
                      numericGoalAmount,
                    )}
                  </strong>

                  <span className="planner-result__metric-description">
                    Valor que você quer
                    alcançar
                  </span>
                </article>

                <article className="planner-result__metric-card">
                  <span className="planner-result__metric-label">
                    Prazo
                  </span>

                  <strong className="planner-result__metric-value">
                    {numericGoalDeadline}{" "}
                    {numericGoalDeadline ===
                    1
                      ? "mês"
                      : "meses"}
                  </strong>

                  <span className="planner-result__metric-description">
                    Tempo definido para
                    alcançar a meta
                  </span>
                </article>

                <article className="planner-result__metric-card">
                  <span className="planner-result__metric-label">
                    {usesHistoryReference
                      ? "Margem do histórico"
                      : "Referência mensal"}
                  </span>

                  <strong className="planner-result__metric-value">
                    {formatCurrency(
                      planningMonthlyReference,
                    )}
                  </strong>

                  <span className="planner-result__metric-description">
                    {usesHistoryReference
                      ? "Valor disponível após as saídas consideradas"
                      : "Valor aproximado para guardar por mês"}
                  </span>
                </article>
              </div>

              {/* Análise baseada no histórico */}

              {!isWithoutHistory && (
                <section
                  className="planner-result__history"
                  aria-labelledby="planner-history-title"
                >
                  <article className="planner-result__history-analysis">
                    <div className="planner-result__history-heading">
                      <span className="planner-result__card-eyebrow">
                        Insight financeiro
                      </span>

                      <div className="planner-result__history-title-row">
                        <h3
                          id="planner-history-title"
                          className="planner-result__card-title"
                        >
                          Análise baseada no
                          seu histórico
                        </h3>

                        <span
                          className={`planner-result__history-status planner-result__history-status--${historyInsight?.tone}`}
                        >
                          {
                            historyInsight?.status
                          }
                        </span>
                      </div>

                      <p className="planner-result__card-description">
                        Base considerada:{" "}
                        {
                          selectedPeriod?.label
                        }
                      </p>
                    </div>

                    <div className="planner-result__history-sections">
                      <div className="planner-result__history-section">
                        <strong>
                          Viabilidade da meta
                        </strong>

                        <p>
                          {
                            historyInsight?.viability
                          }
                        </p>
                      </div>

                      <div className="planner-result__history-section">
                        <strong>
                          Diagnóstico financeiro
                        </strong>

                        <p>
                          {
                            historyInsight?.diagnosis
                          }
                        </p>
                      </div>

                      <div className="planner-result__history-section">
                        <strong>
                          Próximo passo
                        </strong>

                        <p>
                          {
                            historyInsight?.suggestion
                          }
                        </p>
                      </div>
                    </div>
                  </article>

                  <div className="planner-result__financial-cards">
                    <article className="planner-result__financial-card">
                      <div className="planner-result__financial-card-label">
                        <Banknote
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <span>
                          Renda considerada
                        </span>
                      </div>

                      <strong>
                        {historyAnalysis?.hasData
                          ? formatCurrency(
                              historyAnalysis.income,
                            )
                          : "—"}
                      </strong>

                      <p>
                        {form.period ===
                        "last_3_months"
                          ? "Média mensal das entradas"
                          : "Entradas no período selecionado"}
                      </p>
                    </article>

                    <article className="planner-result__financial-card">
                      <div className="planner-result__financial-card-label">
                        <ReceiptText
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <span>
                          Custos fixos
                          estimados
                        </span>
                      </div>

                      <strong>
                        {historyAnalysis?.hasData
                          ? formatCurrency(
                              historyAnalysis.fixedExpenses,
                            )
                          : "—"}
                      </strong>

                      <p>
                        Moradia, transporte e
                        saúde identificados no
                        histórico
                      </p>
                    </article>

                    <article className="planner-result__financial-card">
                      <div className="planner-result__financial-card-label">
                        <PiggyBank
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <span>
                          Margem disponível
                        </span>
                      </div>

                      <strong>
                        {historyAnalysis?.hasData
                          ? formatCurrency(
                              historyAnalysis.available,
                            )
                          : "—"}
                      </strong>

                      <p>
                        Entradas menos todas as
                        saídas consideradas
                      </p>
                    </article>
                  </div>
                </section>
              )}

              {/* Análise sem histórico */}

              {isWithoutHistory && (
                <article className="planner-result__card">
                  <div className="planner-result__card-header">
                    <span className="planner-result__card-eyebrow">
                      Análise da sua meta
                    </span>

                    <h3 className="planner-result__card-title">
                      Como este plano foi
                      definido
                    </h3>

                    <p className="planner-result__card-description">
                      O critério usado para
                      chegar à referência
                      mensal.
                    </p>
                  </div>

                  <p className="planner-result__analysis-copy">
                    Sem histórico financeiro,
                    a simulação parte
                    exclusivamente do objetivo
                    e do prazo informados. A
                    referência mensal funciona
                    como um ponto inicial para
                    organizar essa meta.
                  </p>

                  <div className="planner-result__base">
                    <span>
                      Base selecionada
                    </span>

                    <strong>
                      Sem histórico financeiro
                    </strong>
                  </div>
                </article>
              )}

              {/* Simulador */}

              <article className="planner-result__card">
                <div className="planner-result__card-header">
                  <span className="planner-result__card-eyebrow">
                    Simule seu prazo
                  </span>

                  <h3 className="planner-result__card-title">
                    Veja outros cenários
                  </h3>

                  <p className="planner-result__card-description">
                    Ajuste quanto você
                    conseguiria guardar por mês
                    e veja como isso muda o
                    tempo necessário para
                    alcançar sua meta.
                  </p>
                </div>

                <div className="planner-result__slider">
                  <div className="planner-result__slider-header">
                    <div className="planner-result__slider-question">
                      <span className="planner-result__slider-label">
                        Quanto você
                        conseguiria guardar
                        por mês?
                      </span>

                      <strong className="planner-result__slider-value">
                        {formatCurrency(
                          simulationAmount,
                        )}
                      </strong>
                    </div>

                    <span className="planner-result__slider-current">
                      {usesHistoryReference
                        ? "Margem identificada: "
                        : "Referência atual: "}

                      {formatCurrency(
                        planningMonthlyReference,
                      )}
                    </span>
                  </div>

                  <input
                    className="planner-result__range"
                    type="range"
                    min={simulationMin}
                    max={simulationMax}
                    step="0.01"
                    value={simulationAmount}
                    onChange={
                      handleSimulationChange
                    }
                    aria-label="Valor mensal para simulação"
                  />

                  <div className="planner-result__slider-scale">
                    <span>
                      {formatCurrency(
                        simulationMin,
                      )}
                    </span>

                    <span>
                      {formatCurrency(
                        simulationMax,
                      )}
                    </span>
                  </div>

                  <div className="planner-result__simulation">
                    <div className="planner-result__simulation-main">
                      <span className="planner-result__simulation-label">
                        Prazo estimado para
                        alcançar a meta
                      </span>

                      <strong className="planner-result__simulation-value">
                        {estimatedMonths}{" "}

                        <span>
                          {estimatedMonths ===
                          1
                            ? "mês"
                            : "meses"}
                        </span>
                      </strong>
                    </div>
                  </div>
                </div>
              </article>

              {/* Insight do cenário */}

              <article className="planner-result__insight">
                <span className="planner-result__insight-eyebrow">
                  Insight do cenário
                </span>

                <h3 className="planner-result__insight-title">
                  {deadlineDifference < 0
                    ? "Seu ritmo antecipa o prazo"
                    : deadlineDifference > 0
                      ? "Este ritmo pede mais tempo"
                      : "Seu ritmo acompanha o prazo"}
                </h3>

                <p aria-live="polite">
                  {simulationDescription}
                </p>
              </article>

              <div className="planner-result__actions">
                {saveError && (
                  <p role="alert">
                    {saveError}
                  </p>
                )}

                <Button
                  onClick={
                    handleSaveSimulation
                  }
                  disabled={
                    isSaved ||
                    isSubmitting
                  }
                >
                  <Save
                    size={17}
                    aria-hidden="true"
                  />

                  {isSaved
                    ? "Simulação salva"
                    : "Salvar simulação"}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}