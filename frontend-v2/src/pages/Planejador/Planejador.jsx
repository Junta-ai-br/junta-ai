import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  History,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";

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
      .replace(",", ".")
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function Planejador() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState(0);

  const selectedPeriod = useMemo(
    () =>
      PERIOD_OPTIONS.find(
        (option) => option.id === form.period
      ),
    [form.period]
  );

  const numericGoalAmount = parseCurrency(form.goalAmount);
  const numericGoalDeadline = Number(form.goalDeadline);

  const monthlyReference = useMemo(() => {
    if (
      !numericGoalAmount ||
      numericGoalAmount <= 0 ||
      !numericGoalDeadline ||
      numericGoalDeadline <= 0
    ) {
      return 0;
    }

    return numericGoalAmount / numericGoalDeadline;
  }, [numericGoalAmount, numericGoalDeadline]);

  const isWithoutHistory = form.period === "no_history";

  const simulationMin = useMemo(() => {
    if (!monthlyReference) {
      return 0;
    }

    return Math.max(
      1,
      Math.round(monthlyReference * 0.2)
    );
  }, [monthlyReference]);

  const simulationMax = useMemo(() => {
    if (!monthlyReference) {
      return 0;
    }

    return Math.max(
      simulationMin,
      Math.round(monthlyReference * 2)
    );
  }, [monthlyReference, simulationMin]);

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
      numericGoalAmount / simulationAmount
    );
  }, [numericGoalAmount, simulationAmount]);

  const deadlineDifference =
    estimatedMonths > 0
      ? estimatedMonths - numericGoalDeadline
      : 0;

  const updateField = (field, value) => {
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
      !Number.isFinite(numericGoalAmount) ||
      numericGoalAmount <= 0
    ) {
      nextErrors.goalAmount =
        "Informe um valor maior que zero.";
    }

    if (
      !form.goalDeadline ||
      !Number.isInteger(numericGoalDeadline) ||
      numericGoalDeadline <= 0
    ) {
      nextErrors.goalDeadline =
        "Informe um prazo maior que zero.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const planningData = {
      period: {
        type: form.period,
        label: selectedPeriod?.label || "",
      },

      goal: {
        name: form.goalName.trim(),
        amount: numericGoalAmount,
        deadlineMonths: numericGoalDeadline,
      },

      createdAt: new Date().toISOString(),
    };

    console.log(
      "Junta.ai — planejamento:",
      planningData
    );

    const initialSimulation = Math.min(
      Math.max(
        Math.round(monthlyReference),
        simulationMin
      ),
      simulationMax
    );

    window.setTimeout(() => {
      setSimulationAmount(initialSimulation);
      setShowResult(true);
      setIsSubmitting(false);
    }, 400);
  };

  const handleSimulationChange = (event) => {
    setSimulationAmount(Number(event.target.value));
  };

  const simulationDescription = useMemo(() => {
    if (!estimatedMonths) {
      return "";
    }

    if (deadlineDifference < 0) {
      const monthsBeforeDeadline =
        Math.abs(deadlineDifference);

      return `Nesse cenário, você alcançaria sua meta ${monthsBeforeDeadline} ${
        monthsBeforeDeadline === 1 ? "mês" : "meses"
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
              Transforme um objetivo em um plano possível,
              usando sua realidade financeira como ponto
              de partida.
            </p>
          </div>

          <Link
            to="/planejador/historico"
            className="planner-page__history-link"
          >
            <History size={17} aria-hidden="true" />
            <span>Histórico</span>
          </Link>
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
                  Qual período você quer usar?
                </h2>

                <p className="planner-section__description">
                  Escolha a movimentação financeira que
                  servirá de base para o seu planejamento.
                </p>
              </div>
            </div>

            <div className="planner-periods">
              {PERIOD_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected =
                  form.period === option.id;

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
                      updateField("period", option.id)
                    }
                    aria-pressed={isSelected}
                  >
                    <span className="planner-period-card__icon">
                      <Icon
                        size={19}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="planner-period-card__content">
                      <strong>{option.label}</strong>

                      <span>
                        {option.description}
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
              })}
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
                  Defina sua meta, o valor que você precisa
                  e em quanto tempo quer chegar lá.
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
                      event.target.value
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
                      Escolha um nome que faça sentido
                      para você.
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
                          event.target.value
                        )
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
                    value={form.goalDeadline}
                    onChange={(event) =>
                      updateField(
                        "goalDeadline",
                        event.target.value
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
                  {form.goalName.trim() || "Sua meta"}
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
                    ? formatCurrency(numericGoalAmount)
                    : "R$ 0,00"}
                </strong>
              </div>

              <div>
                <span>Prazo</span>

                <strong>
                  {numericGoalDeadline > 0
                    ? `${numericGoalDeadline} ${
                        numericGoalDeadline === 1
                          ? "mês"
                          : "meses"
                      }`
                    : "Não definido"}
                </strong>
              </div>

              <div className="planner-preview__highlight">
                <span>Referência mensal</span>

                <strong>
                  {monthlyReference > 0
                    ? formatCurrency(monthlyReference)
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
              <span>Criar planejamento</span>

              <ChevronRight
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Button>
          </div>
        </form>

        {/* =====================================================
            Resultado do planejamento
            Estrutura baseada na referência visual do Planeja.ai
            ===================================================== */}

        {showResult && (
          <section
            className="planner-result-wrapper"
            aria-labelledby="planner-result-title"
          >
            <div className="planner-result">
              {/* Cabeçalho */}

              <header className="planner-result__header">
                <span className="planner-result__eyebrow">
                  Resultado do seu planejamento
                </span>

                <h2
                  id="planner-result-title"
                  className="planner-result__title"
                >
                  {form.goalName.trim()}
                </h2>

                <p className="planner-result__description">
                  Veja a referência inicial, ajuste o valor mensal
                  e acompanhe o impacto no prazo.
                </p>
              </header>

              {/* Métricas principais */}

              <div className="planner-result__metrics">
                <article className="planner-result__metric-card">
                  <span className="planner-result__metric-label">
                    Meta
                  </span>

                  <strong className="planner-result__metric-value">
                    {formatCurrency(numericGoalAmount)}
                  </strong>

                  <span className="planner-result__metric-description">
                    Valor que você quer alcançar
                  </span>
                </article>

                <article className="planner-result__metric-card">
                  <span className="planner-result__metric-label">
                    Prazo
                  </span>

                  <strong className="planner-result__metric-value">
                    {numericGoalDeadline}{" "}
                    {numericGoalDeadline === 1
                      ? "mês"
                      : "meses"}
                  </strong>

                  <span className="planner-result__metric-description">
                    Tempo definido para alcançar a meta
                  </span>
                </article>

                <article className="planner-result__metric-card">
                  <span className="planner-result__metric-label">
                    Referência mensal
                  </span>

                  <strong className="planner-result__metric-value">
                    {formatCurrency(monthlyReference)}
                  </strong>

                  <span className="planner-result__metric-description">
                    Valor aproximado para guardar por mês
                  </span>
                </article>
              </div>

              {/* Análise da meta */}

              <article className="planner-result__card">
                <div className="planner-result__card-header">
                  <span className="planner-result__card-eyebrow">
                    Análise da sua meta
                  </span>

                  <h3 className="planner-result__card-title">
                    Como este plano foi definido
                  </h3>

                  <p className="planner-result__card-description">
                    O critério usado para chegar à referência mensal.
                  </p>
                </div>

                <p className="planner-result__analysis-copy">
                  {isWithoutHistory
                    ? "Sem histórico financeiro, a simulação parte do objetivo e do prazo informados. A referência mensal funciona como um ponto inicial para organizar essa meta."
                    : "O período escolhido funciona como contexto para este plano. Nesta versão, a referência mensal é calculada a partir da meta e do prazo informados; os lançamentos financeiros desse período ainda não entram na conta."}
                </p>

                <div className="planner-result__base">
                  <span>Base selecionada</span>

                  <strong>
                    {isWithoutHistory
                      ? "Sem histórico financeiro"
                      : selectedPeriod?.label}
                  </strong>
                </div>
              </article>

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
                    Ajuste quanto você conseguiria guardar
                    por mês e veja como isso muda o tempo
                    necessário para alcançar sua meta.
                  </p>
                </div>

                <div className="planner-result__slider">
                  <div className="planner-result__slider-header">
                    <div className="planner-result__slider-question">
                      <span className="planner-result__slider-label">
                        Quanto você conseguiria guardar por
                        mês?
                      </span>

                      <strong className="planner-result__slider-value">
                        {formatCurrency(simulationAmount)}
                      </strong>
                    </div>

                    <span className="planner-result__slider-current">
                      Referência atual:{" "}
                      {formatCurrency(monthlyReference)}
                    </span>
                  </div>

                  <input
                    className="planner-result__range"
                    type="range"
                    min={simulationMin}
                    max={simulationMax}
                    step="1"
                    value={simulationAmount}
                    onChange={handleSimulationChange}
                    aria-label="Valor mensal para simulação"
                  />

                  <div className="planner-result__slider-scale">
                    <span>
                      {formatCurrency(simulationMin)}
                    </span>

                    <span>
                      {formatCurrency(simulationMax)}
                    </span>
                  </div>

                  <div className="planner-result__simulation">
                    <div className="planner-result__simulation-main">
                      <span className="planner-result__simulation-label">
                        Prazo estimado para alcançar a meta
                      </span>

                      <strong className="planner-result__simulation-value">
                        {estimatedMonths}{" "}
                        <span>
                          {estimatedMonths === 1
                            ? "mês"
                            : "meses"}
                        </span>
                      </strong>
                    </div>

                  </div>
                </div>
              </article>

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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}