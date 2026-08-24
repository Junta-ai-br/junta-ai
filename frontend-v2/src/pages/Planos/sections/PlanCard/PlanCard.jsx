import { CheckCircle, ShieldCheck } from "lucide-react";

import Button from "@/components/common/Button";

import "./PlanCard.css";

const includedItems = [
  "Registrar despesas em conversa",
  "Categorizar transações automaticamente",
  "Conversar com o agente financeiro",
  "Acompanhar seu mês com clareza",
  "Criar e acompanhar suas metas",
  "100% gratuito para começar",
];

function PlanCard() {
  return (
    <section className="plan-card-section" id="plano-gratuito">
      <div className="plan-card-section__container">
        <div className="plan-card">
          <div className="plan-card__info">
            <div className="plan-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 4 4 9M4 9l5 5M4 9h9a6 6 0 0 1 0 12h-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <span className="plan-card__eyebrow">Junta.ai</span>
            <h2 className="plan-card__name">Gratuito</h2>

            <div className="plan-card__price">
              <span className="plan-card__price-value">R$ 0</span>
              <span className="plan-card__price-caption">para começar</span>
            </div>

            <Button variant="primary" size="lg" className="plan-card__cta">
              Começar agora →
            </Button>
          </div>

          <div className="plan-card__details">
            <h3 className="plan-card__details-title">
              Tudo que você precisa para começar a organizar sua vida
              financeira.
            </h3>

            <ul className="plan-card__list">
              {includedItems.map((item) => (
                <li className="plan-card__list-item" key={item}>
                  <CheckCircle size={18} strokeWidth={1.8} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="plan-card-section__note">
          <ShieldCheck size={16} strokeWidth={1.8} />
          Seus dados são seus. Você decide o que compartilhar.
        </p>
      </div>
    </section>
  );
}

export default PlanCard;
