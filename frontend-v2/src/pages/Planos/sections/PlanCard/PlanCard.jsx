import { CheckCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";
import logoIcon from "@/assets/logos/logo-icon.svg";

import "./PlanCard.css";

const includedItems = [
  "Registrar despesas em conversa",
  "Categorizar transações automaticamente",
  "Conversar com o agente financeiro",
  "Visualizar seus gastos de forma simples",
  "Criar e acompanhar suas metas",
  "Entender para onde seu dinheiro está indo",
  "Escolher o que você quer compartilhar",
  "Sem conectar conta bancária ou cadastrar cartão de crédito",
];

function PlanCard() {
  return (
    <section className="plan-card-section" id="plano-gratuito">
      <div className="plan-card-section__container">
        <div className="plan-card">
          <div className="plan-card__info">
            <div className="plan-card__icon">
              <img src={logoIcon} alt="" />
            </div>

            <span className="plan-card__eyebrow">Junta.ai</span>

            <h2 className="plan-card__name">Plano gratuito</h2>

            <div className="plan-card__price">
              <span className="plan-card__price-value">R$ 0</span>
            </div>

            <Link to="/cadastro">
              <Button
                variant="primary"
                size="lg"
                className="plan-card__cta"
              >
                Começar agora
              </Button>
            </Link>
          </div>

          <div className="plan-card__details">
            <h3 className="plan-card__details-title">
              Tudo para começar a entender melhor para onde vai seu dinheiro.
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