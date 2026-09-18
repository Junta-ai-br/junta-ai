import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Camera, Trash2 } from "lucide-react";

import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import Input from "@/components/forms/Input";
import Checkbox from "@/components/forms/Checkbox";
import Toast from "@/components/feedback/Toast";

import { useUser } from "@/contexts/useUser";

import "./Perfil.css";

const MAX_AVATAR_SIZE = 1024 * 1024; // 1 MB
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const notificationOptions = [
  {
    key: "atualizacoes",
    label: "Atualizações do Junta.ai",
    helper: "Fique por dentro das novidades e melhorias do produto.",
  },
  {
    key: "dicas",
    label: "Dicas para sua experiência",
    helper: "Receba sugestões para aproveitar melhor os recursos do Junta.ai.",
  },
  {
    key: "lembretes",
    label: "Lembretes e avisos importantes",
    helper: "Receba informações relevantes sobre sua conta e o funcionamento do serviço.",
  },
  {
    key: "convites",
    label: "Convites e pesquisas",
    helper: "Participe de pesquisas e ajude a melhorar o Junta.ai.",
  },
  {
    key: "mensagens",
    label: "Mensagens do Junta.ai",
    helper: "Receba outras comunicações relacionadas ao produto e à experiência.",
  },
];

function SectionCard({ number, title, description, children }) {
  return (
    <Card as="section" padding="lg" className="settings-card">
      <header className="settings-card__header">
        <span className="settings-card__number" aria-hidden="true">
          {number}
        </span>

        <div>
          <h2 className="settings-card__title">{title}</h2>
          {description && (
            <p className="settings-card__description">{description}</p>
          )}
        </div>
      </header>

      <div className="settings-card__body">{children}</div>
    </Card>
  );
}

export default function Perfil() {
  const { profile, updateProfile } = useUser();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nome: profile.nome,
    whatsapp: profile.whatsapp,
    notifications: { ...profile.notifications },
  });

  const [avatarError, setAvatarError] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setToast(null);
  }

  function handleToggleNotification(key) {
    setForm((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [key]: !current.notifications[key],
      },
    }));
    setToast(null);
  }

  function handleAvatarButtonClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Esse formato de imagem não é compatível. Use JPG, JPEG ou PNG.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("A imagem excede o limite de 1 MB. Escolha um arquivo menor.");
      return;
    }

    setAvatarError("");

    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatarUrl: reader.result });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatarError("");
    updateProfile({ avatarUrl: "" });
  }

  function handleCancel() {
    setForm({
      nome: profile.nome,
      whatsapp: profile.whatsapp,
      notifications: { ...profile.notifications },
    });
    setAvatarError("");
    setToast(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);

    window.setTimeout(() => {
      updateProfile({
        nome: form.nome,
        whatsapp: form.whatsapp,
        notifications: form.notifications,
      });

      setIsSaving(false);
      setToast({ variant: "success", message: "Suas alterações foram salvas." });
    }, 500);
  }

  return (
    <div className="settings-page">
      <Header />

      <main className="settings-page__main">
        <div className="settings-page__container">
          <nav className="settings-page__breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Início</Link>
            <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
            <span aria-current="page">Configurações</span>
          </nav>

          <div className="settings-page__intro">
            <p className="settings-page__eyebrow">SEU ESPAÇO PESSOAL</p>
            <h1>Configurações</h1>
            <p className="settings-page__description">
              Gerencie suas informações pessoais e escolha como você quer
              receber novidades do Junta.ai.
            </p>
          </div>

          <form className="settings-page__form" onSubmit={handleSubmit} noValidate>
            <SectionCard
              number={1}
              title="Informações pessoais"
              description="Mantenha seus dados atualizados para ter uma experiência mais completa no Junta.ai."
            >
              <div className="settings-avatar">
                <Avatar
                  src={profile.avatarUrl}
                  alt="Foto de perfil"
                  fallback={profile.nome ? profile.nome.charAt(0).toUpperCase() : ""}
                  size="xl"
                  className="settings-avatar__image"
                />

                <div className="settings-avatar__info">
                  <p className="settings-avatar__label">Sua foto</p>
                  <p className="settings-avatar__helper">
                    Escolha uma imagem para personalizar seu perfil.
                  </p>

                  <div className="settings-avatar__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAvatarButtonClick}
                    >
                      <Camera size={15} strokeWidth={2} />
                      Alterar imagem
                    </Button>

                    {profile.avatarUrl && (
                      <button
                        type="button"
                        className="settings-avatar__remove"
                        onClick={handleRemoveAvatar}
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    className="settings-avatar__file-input"
                    onChange={handleAvatarChange}
                  />

                  <p className="settings-avatar__requirements">
                    JPG, JPEG ou PNG. Tamanho máximo de 1 MB.
                  </p>

                  {avatarError && (
                    <p className="settings-avatar__error">{avatarError}</p>
                  )}
                </div>
              </div>

              <div className="settings-page__fields">
                <Input
                  id="perfil-nome"
                  name="nome"
                  label="Nome"
                  type="text"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                />

                <Input
                  id="perfil-email"
                  name="email"
                  label="E-mail"
                  type="email"
                  value={profile.email}
                  disabled
                  helperText="Este é o e-mail que você utiliza para acessar o Junta.ai."
                />

                <Input
                  id="perfil-whatsapp"
                  name="whatsapp"
                  label="WhatsApp (opcional)"
                  type="tel"
                  value={form.whatsapp}
                  onChange={handleChange}
                  placeholder="(21) 99999-9999"
                  helperText="Informe seu número de WhatsApp, se quiser."
                />
              </div>
            </SectionCard>

            <SectionCard
              number={2}
              title="Preferências de notificação"
              description="Escolha quais novidades e comunicações você gostaria de receber do Junta.ai."
            >
              <div className="settings-notifications">
                {notificationOptions.map((option) => (
                  <Checkbox
                    key={option.key}
                    id={`perfil-notif-${option.key}`}
                    label={option.label}
                    helperText={option.helper}
                    checked={form.notifications[option.key]}
                    onChange={() => handleToggleNotification(option.key)}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              number={3}
              title="Acesso à conta"
              description="Seu acesso ao Junta.ai é feito de forma simples, usando sua conta Google ou uma chave de acesso enviada por e-mail."
            >
              <div className="settings-page__fields">
                <Input
                  id="perfil-email-acesso"
                  label="E-mail de acesso"
                  type="email"
                  value={profile.email}
                  disabled
                  helperText="Este e-mail está vinculado à sua conta e não pode ser alterado aqui."
                />
              </div>
            </SectionCard>

            <SectionCard
              number={4}
              title="Excluir minha conta"
              description="Se você decidir seguir outro caminho, poderá excluir sua conta e seus dados do Junta.ai."
            >
              <Link to="/perfil/excluir-conta" className="button button--danger-outline">
                <Trash2 size={16} strokeWidth={2} />
                Excluir minha conta
              </Link>
            </SectionCard>

            {toast && (
              <Toast variant={toast.variant} onDismiss={() => setToast(null)}>
                {toast.message}
              </Toast>
            )}

            <div className="settings-page__actions">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" loading={isSaving}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}