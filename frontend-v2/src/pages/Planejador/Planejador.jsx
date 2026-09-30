import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Goal,
  History,
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
    description:
      "Considera as receitas e despesas do mês em andamento.",
    icon: CalendarDays,
  },
  {
    id: "last_30_days",
    label: "Últimos 30 dias",
    description:
      "Considera sua movimentação financeira dos últimos 30 dias.",
    icon: Clock3,
  },
  {
    id: "last_3_months",
    label: "Média dos últimos 3 meses",
    description:
      "Usa a média da sua movimentação financeira dos últimos três meses.",
    icon: WalletCards,
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

export default function Planejador() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const selectedPeriod = useMemo(
    () =>
      PERIOD_OPTIONS.find(
        (option) =>
          option.id === form.period
      ),
    [form.period]
  );

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
        "Escolha um período para o planejamento.";
    }

    if (!form.goalName.trim()) {
      nextErrors.goalName =
        "Informe o nome da sua meta.";
    }

    const goalAmount =
      parseCurrency(form.goalAmount);

    if (
      !form.goalAmount ||
      !Number.isFinite(goalAmount) ||
      goalAmount <= 0
    ) {
      nextErrors.goalAmount =
        "Informe um valor válido para a meta.";
    }

    const deadline = Number(
      form.goalDeadline
    );

    if (
      !form.goalDeadline ||
      !Number.isInteger(deadline) ||
      deadline <= 0
    ) {
      nextErrors.goalDeadline =
        "Informe um prazo válido em meses.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    /*
     * Neste primeiro passo não fazemos chamada ao backend.
     *
     * O objeto abaixo já representa o contrato inicial
     * que será utilizado pelo cálculo do planejamento.
     *
     * Na próxima etapa ele será alimentado pelas
     * transactions reais do usuário.
     */

    const planningData = {
      period: {
        type: form.period,
        label: selectedPeriod?.label || "",
      },

      goal: {
        name: form.goalName.trim(),
        amount: parseCurrency(
          form.goalAmount
        ),
        deadlineMonths: Number(
          form.goalDeadline
        ),
      },

      createdAt:
        new Date().toISOString(),
    };

    console.log(
      "Junta.ai — planejamento:",
      planningData
    );

    /*
     * Temporariamente mantemos o objeto no estado
     * da página. A persistência e a tela de resultado
     * entram na próxima etapa.
     */

    window.setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <main className="planner-page">
      <AuthHeader activePath="/planejador" />

      <div className="planner-page__container">
        {/* ================================================================
            Hero
        ================================================================= */}

        <header className="planner-page__hero">
          <div className="planner-page__hero-content">
            <span className="planner-page__eyebrow">
              Planejador
            </span>

            <h1 className="planner-page__title">
              Planeje uma meta do seu jeito.
            </h1>

            <p className="planner-page__description">
              Transforme um objetivo em um plano
              possível, usando sua realidade
              financeira como ponto de partida.
            </p>
          </div>

          <Link
            to="/planejador/historico"
            className="planner-page__history-link"
          >
            <History size={17} />
            <span>Histórico</span>
          </Link>
        </header>

        {/* ================================================================
            Form
        ================================================================= */}

        <form
          className="planner-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* ==============================================================
              Period
          ============================================================== */}

          <Card
            className="planner-section"
            padding="lg"
          >
            <div className="planner-section__header">
              <div className="planner-section__number">
                01
              </div>

              <div>
                <span className="planner-section__eyebrow">
                  Base do planejamento
                </span>

                <h2 className="planner-section__title">
                  Qual período você quer usar?
                </h2>

                <p className="planner-section__description">
                  Escolha qual movimentação
                  financeira será considerada para
                  montar seu planejamento.
                </p>
              </div>
            </div>

            <div className="planner-periods">
              {PERIOD_OPTIONS.map(
                (option) => {
                  const Icon = option.icon;
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
                          option.id
                        )
                      }
                      aria-pressed={
                        isSelected
                      }
                    >
                      <div className="planner-period-card__icon">
                        <Icon
                          size={20}
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="planner-period-card__content">
                        <strong>
                          {option.label}
                        </strong>

                        <span>
                          {option.description}
                        </span>
                      </div>

                      <span
                        className="planner-period-card__check"
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <Check
                            size={15}
                            strokeWidth={2.5}
                          />
                        )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {errors.period && (
              <p className="planner-field__error">
                {errors.period}
              </p>
            )}
          </Card>

          {/* ==============================================================
              Goal
          ============================================================== */}

          <Card
            className="planner-section"
            padding="lg"
          >
            <div className="planner-section__header">
              <div className="planner-section__number">
                02
              </div>

              <div>
                <span className="planner-section__eyebrow">
                  Sua meta
                </span>

                <h2 className="planner-section__title">
                  O que você quer alcançar?
                </h2>

                <p className="planner-section__description">
                  Defina o objetivo, o valor que
                  você precisa e o prazo desejado.
                </p>
              </div>
            </div>

            <div className="planner-fields">
              {/* Nome */}

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
                      Dê um nome que faça
                      sentido para você.
                    </span>
                  )}
                </div>
              </div>

              {/* Valor */}

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

              {/* Prazo */}

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

          {/* ==============================================================
              Preview
          ============================================================== */}

          <Card
            className="planner-preview"
            padding="lg"
          >
            <div className="planner-preview__icon">
              <Goal
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <div className="planner-preview__content">
              <span className="planner-preview__eyebrow">
                Seu planejamento
              </span>

              <h2 className="planner-preview__title">
                {form.goalName.trim() ||
                  "Sua próxima meta"}
              </h2>

              <p className="planner-preview__description">
                {selectedPeriod
                  ? `Vamos usar ${selectedPeriod.label.toLowerCase()} como base para analisar sua situação financeira.`
                  : "Escolha um período para continuar."}
              </p>

              <div className="planner-preview__summary">
                <div>
                  <span>Meta</span>

                  <strong>
                    {form.goalAmount
                      ? `R$ ${form.goalAmount}`
                      : "R$ 0,00"}
                  </strong>
                </div>

                <div>
                  <span>Prazo</span>

                  <strong>
                    {form.goalDeadline
                      ? `${form.goalDeadline} ${
                          Number(
                            form.goalDeadline
                          ) === 1
                            ? "mês"
                            : "meses"
                        }`
                      : "Não definido"}
                  </strong>
                </div>
              </div>
            </div>
          </Card>

          {/* ==============================================================
              Submit
          ============================================================== */}

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
              />
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}