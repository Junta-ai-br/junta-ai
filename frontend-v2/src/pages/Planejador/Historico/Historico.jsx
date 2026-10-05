import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  History as HistoryIcon,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";
import {
  loadPlannerSimulations,
  removePlannerSimulation,
} from "@/services/planner/store";

import "./Historico.css";

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getPeriodLabel(simulation) {
  return (
    simulation?.period?.label ||
    "Base não informada"
  );
}

function getInitialHistoryState() {
  try {
    return {
      simulations: loadPlannerSimulations(),
      error: "",
    };
  } catch {
    return {
      simulations: [],
      error:
        "Não foi possível carregar seu histórico de simulações.",
    };
  }
}

export default function Historico() {
  const [historyState, setHistoryState] = useState(
    getInitialHistoryState,
  );

  const [expandedId, setExpandedId] = useState(null);

  const simulations = historyState.simulations;
  const error = historyState.error;

  const orderedSimulations = useMemo(
    () =>
      [...simulations].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      ),
    [simulations],
  );

  const handleToggleDetails = (id) => {
    setExpandedId((current) =>
      current === id ? null : id,
    );
  };

  const handleDelete = (simulation) => {
    const confirmed = window.confirm(
      `Deseja excluir a simulação "${simulation.goal?.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const nextSimulations =
        removePlannerSimulation(simulation.id);

      setHistoryState({
        simulations: nextSimulations,
        error: "",
      });

      setExpandedId((current) =>
        current === simulation.id
          ? null
          : current,
      );
    } catch {
      setHistoryState((current) => ({
        ...current,
        error:
          "Não foi possível excluir esta simulação. Tente novamente.",
      }));
    }
  };

  return (
    <main className="planner-history-page">
      <AuthHeader activePath="/planejador" />

      <div className="planner-history-page__container">
        <header className="planner-history-page__hero">
          <div className="planner-history-page__heading">
            <span className="planner-history-page__eyebrow">
              <HistoryIcon
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              Histórico
            </span>

            <h1 className="planner-history-page__title">
              Histórico de simulações
            </h1>

            <p className="planner-history-page__description">
              Reveja os planejamentos que você salvou
              e consulte os cenários simulados.
            </p>
          </div>

          <Link
            to="/planejador"
            className="planner-history-page__new"
          >
            <Plus
              size={17}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>Nova simulação</span>
          </Link>
        </header>

        {error && (
          <div
            className="planner-history-page__error"
            role="alert"
          >
            {error}
          </div>
        )}

        {orderedSimulations.length > 0 ? (
          <section
            className="planner-history-list"
            aria-label="Simulações salvas"
          >
            {orderedSimulations.map((simulation) => {
              const isExpanded =
                expandedId === simulation.id;

              const monthlyAmount =
                simulation.simulation?.monthlyAmount;

              const estimatedMonths =
                simulation.simulation?.estimatedMonths;

              const deadlineMonths =
                simulation.goal?.deadlineMonths;

              const usesHistory =
                simulation.period?.usesHistory;

              return (
                <article
                  key={simulation.id}
                  className={`planner-history-card ${
                    isExpanded
                      ? "planner-history-card--expanded"
                      : ""
                  }`}
                >
                  <div className="planner-history-card__main">
                    <div className="planner-history-card__content">
                      <span className="planner-history-card__eyebrow">
                        Meta
                      </span>

                      <div className="planner-history-card__title-row">
                        <h2 className="planner-history-card__title">
                          {simulation.goal?.name ||
                            "Meta sem nome"}
                        </h2>

                        {simulation.createdAt && (
                          <span className="planner-history-card__date">
                            {formatDate(
                              simulation.createdAt,
                            )}
                          </span>
                        )}
                      </div>

                      <div className="planner-history-card__summary">
                        <span>
                          Prazo:{" "}
                          <strong>
                            {deadlineMonths || "—"}{" "}
                            {deadlineMonths === 1
                              ? "mês"
                              : "meses"}
                          </strong>
                        </span>

                        <span
                          className="planner-history-card__separator"
                          aria-hidden="true"
                        >
                          •
                        </span>

                        <span>
                          Valor mensal:{" "}
                          <strong>
                            {formatCurrency(
                              monthlyAmount,
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="planner-history-card__actions">
                      <button
                        type="button"
                        className="planner-history-card__details"
                        onClick={() =>
                          handleToggleDetails(
                            simulation.id,
                          )
                        }
                        aria-expanded={isExpanded}
                      >
                        <span>
                          {isExpanded
                            ? "Ocultar detalhes"
                            : "Ver detalhes"}
                        </span>

                        {isExpanded ? (
                          <ChevronDown
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        className="planner-history-card__delete"
                        onClick={() =>
                          handleDelete(simulation)
                        }
                        aria-label={`Excluir simulação ${
                          simulation.goal?.name || ""
                        }`}
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="planner-history-card__details-content">
                      <div className="planner-history-card__detail">
                        <span>Valor da meta</span>

                        <strong>
                          {formatCurrency(
                            simulation.goal?.amount,
                          )}
                        </strong>
                      </div>

                      <div className="planner-history-card__detail">
                        <span>Prazo estimado</span>

                        <strong>
                          {estimatedMonths
                            ? `${estimatedMonths} ${
                                estimatedMonths === 1
                                  ? "mês"
                                  : "meses"
                              }`
                            : "—"}
                        </strong>
                      </div>

                      <div className="planner-history-card__detail">
                        <span>Base utilizada</span>

                        <strong>
                          {getPeriodLabel(simulation)}
                        </strong>
                      </div>

                      <div className="planner-history-card__detail">
                        <span>Tipo de análise</span>

                        <strong>
                          {usesHistory
                            ? "Com histórico"
                            : "Sem histórico"}
                        </strong>
                      </div>

                      {simulation.historyContext && (
                        <>
                          <div className="planner-history-card__detail">
                            <span>
                              Renda considerada
                            </span>

                            <strong>
                              {formatCurrency(
                                simulation
                                  .historyContext
                                  .income,
                              )}
                            </strong>
                          </div>

                          <div className="planner-history-card__detail">
                            <span>
                              Margem disponível
                            </span>

                            <strong>
                              {formatCurrency(
                                simulation
                                  .historyContext
                                  .available,
                              )}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="planner-history-empty">
            <div className="planner-history-empty__icon">
              <Target
                size={24}
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </div>

            <span className="planner-history-empty__eyebrow">
              Seu histórico começa aqui
            </span>

            <h2 className="planner-history-empty__title">
              Nenhuma simulação salva
            </h2>

            <p className="planner-history-empty__description">
              Crie um planejamento e salve os cenários
              que quiser consultar novamente.
            </p>

            <Link
              to="/planejador"
              className="planner-history-empty__action"
            >
              <ArrowLeft
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>Ir para o Planejador</span>
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}