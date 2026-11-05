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
import Input from "@/components/forms/Input";

import { useUser } from "@/contexts/useUser";
import { deleteMyAccount } from "@/services/account.api";

import "./ExcluirConta.css";

export const CONFIRMATION_PHRASE = "Desejo excluir minha conta permanentemente";

const DELETION_ITEMS = [
  "Suas informações pessoais (nome, e-mail e telefone).",
  "Suas preferências e configurações.",
  "Dados relacionados ao uso do Junta.ai.",
  "Histórico de conversas e planejamentos.",
];

function deletionErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 401 || error?.code === "SESSION_EXPIRED") {
    return "Sua sessão expirou. Entre novamente e tente excluir a conta.";
  }
  if (!status) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  return "Não foi possível excluir sua conta agora. Tente novamente em instantes.";
}

export default function ExcluirConta() {
  const navigate = useNavigate();
  const { clearProfile } = useUser();

  const [typed, setTyped] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const confirmed = typed.trim() === CONFIRMATION_PHRASE;

  async function handleDelete() {
    if (!confirmed || isDeleting) return;

    setErrorMessage("");
    setIsDeleting(true);

    try {
      await deleteMyAccount();
    } catch (error) {
      setErrorMessage(deletionErrorMessage(error));
      setIsDeleting(false);
      return;
    }

    clearProfile();
    setIsDeleting(false);
    setIsDeleted(true);
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
                    Ao excluir sua conta, seus dados serão removidos
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

                <Input
                  id="excluir-conta-frase"
                  label={`Para confirmar, digite: ${CONFIRMATION_PHRASE}`}
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  autoComplete="off"
                  disabled={isDeleting}
                />

                {errorMessage && (
                  <p className="input-message input-message--error" role="alert">
                    {errorMessage}
                  </p>
                )}

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