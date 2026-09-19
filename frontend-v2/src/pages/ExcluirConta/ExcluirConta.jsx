import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Trash2,
  CheckCircle2,
  Info,
  HelpCircle,
} from "lucide-react";

import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Checkbox from "@/components/forms/Checkbox";

import { useUser } from "@/contexts/useUser";

import "./ExcluirConta.css";

const DELETION_ITEMS = [
  "Suas informações pessoais (nome, e-mail e telefone).",
  "Suas preferências e configurações.",
  "Dados relacionados ao uso do Junta.ai.",
  "Histórico de conversas e planejamentos.",
];

export default function ExcluirConta() {
  const navigate = useNavigate();
  const { clearProfile } = useUser();

  const [confirmed, setConfirmed] = useState(false);
  const [showConfirmHint, setShowConfirmHint] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  function handleConfirmToggle() {
    setConfirmed((current) => !current);
    setShowConfirmHint(false);
  }

  function handleDelete() {
    if (!confirmed) {
      setShowConfirmHint(true);
      return;
    }

    setIsDeleting(true);

    window.setTimeout(() => {
      clearProfile();
      setIsDeleting(false);
      setIsDeleted(true);
    }, 700);
  }

  function handleGoHome() {
    navigate("/");
  }

  return (
    <div className="delete-account-page">
      <Header />

      <main className="delete-account-page__main">
        <div className="delete-account-page__container">
          {!isDeleted && (
            <nav className="delete-account-page__breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Início</Link>
              <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
              <Link to="/perfil">Configurações</Link>
              <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
              <span aria-current="page">Excluir conta</span>
            </nav>
          )}

          <Card as="section" padding="lg" className="delete-account-card">
            {isDeleted ? (
              <div className="delete-account-card__success" role="status">
                <span className="delete-account-card__icon delete-account-card__icon--success">
                  <CheckCircle2 size={28} strokeWidth={2} />
                </span>

                <h1>Sua conta foi excluída</h1>

                <p>
                  Se precisar voltar um dia, estaremos por aqui.{" "}
                  <span aria-hidden="true">💜</span>
                </p>

                <Button variant="primary" onClick={handleGoHome}>
                  Ir para a página inicial
                </Button>
              </div>
            ) : (
              <>
                <div className="delete-account-card__heading">
                  <span className="delete-account-card__icon delete-account-card__icon--danger">
                    <Trash2 size={28} strokeWidth={2} />
                  </span>

                  <h1>Tem certeza que deseja excluir sua conta?</h1>

                  <p className="delete-account-card__intro">
                    Vamos sentir sua falta por aqui. <span aria-hidden="true">💜</span>
                  </p>

                  <p className="delete-account-card__warning">
                    Ao excluir sua conta, seus dados poderão ser removidos
                    permanentemente. Essa ação não poderá ser desfeita.
                  </p>
                </div>

                <div className="delete-account-card__info">
                  <p className="delete-account-card__info-title">
                    <Info size={16} strokeWidth={2} />
                    O que será excluído?
                  </p>

                  <ul>
                    {DELETION_ITEMS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <Checkbox
                  id="excluir-conta-confirmacao"
                  label="Eu entendo que essa ação é permanente e desejo excluir minha conta."
                  checked={confirmed}
                  onChange={handleConfirmToggle}
                  error={showConfirmHint ? "Marque a caixa para continuar." : ""}
                />

                <div className="delete-account-card__actions">
                  <Link to="/perfil" className="button button--secondary">
                    Cancelar
                  </Link>

                  <Button
                    type="button"
                    variant="danger"
                    disabled={!confirmed}
                    loading={isDeleting}
                    loadingText="Excluindo..."
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                    Sim, excluir minha conta
                  </Button>
                </div>
              </>
            )}
          </Card>

          {!isDeleted && (
            <Card as="section" padding="md" className="delete-account-help">
              <span className="delete-account-help__icon">
                <HelpCircle size={18} strokeWidth={2} />
              </span>

              <p>
                Em caso de dúvidas sobre a exclusão da conta e o tratamento
                dos seus dados, consulte nossa{" "}
                <Link to="/privacidade">Política de Privacidade</Link> ou
                entre em contato conosco.
              </p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
