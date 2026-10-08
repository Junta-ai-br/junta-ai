import usePublicForm from "@/hooks/usePublicForm";
import { Send } from "lucide-react";

import Button from "@/components/common/Button";

import "./FeedbackPage.css";

const subjectOptions = [
  {
    value: "experiencia",
    label: "Experiência com o Junta.ai",
  },
  {
    value: "sugestao",
    label: "Sugestão ou nova ideia",
  },
  {
    value: "problema",
    label: "Encontrei um problema",
  },
  {
    value: "duvida",
    label: "Algo não ficou claro",
  },
  {
    value: "privacidade",
    label: "Privacidade e segurança",
  },
  {
    value: "financeiro",
    label: "Recursos financeiros",
  },
  {
    value: "assistente",
    label: "Assistente / IA",
  },
  {
    value: "outro",
    label: "Outro",
  },
];

function FeedbackPage() {
  const { formData, isSubmitted, isSending, error, fieldErrors, fieldProps, handleChange, handleSubmit, handleNewMessage } = usePublicForm("feedback");

  if (isSubmitted) {
    return (
      <section className="feedback-page feedback-page--success">
        <div className="feedback-page__container">
          <div className="feedback-page__success" role="status">
            <div className="feedback-page__success-icon">
              <Send size={24} strokeWidth={1.8} />
            </div>

            <span className="feedback-page__eyebrow">
              Feedback recebido
            </span>

            <h1 className="feedback-page__success-title">
              Sua voz ajuda a construir o Junta.ai.
            </h1>

            <p className="feedback-page__success-description">
              Obrigado por compartilhar sua experiência.
              <br />
              Cada mensagem nos ajuda a entender o que faz sentido para quem
              usa o Junta.ai e onde podemos melhorar.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="feedback-page__success-button"
              onClick={handleNewMessage}
            >
              Enviar outro feedback
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="feedback-page">
      <div className="feedback-page__container">
        <div className="feedback-page__intro">
          <span className="feedback-page__eyebrow">
            O Junta.ai cresce com você
          </span>

          <h1 className="feedback-page__title">
            Tem algo para contar?
            <span>A gente quer ouvir.</span>
          </h1>

          <p className="feedback-page__description">
            Seu feedback nos ajuda a entender o que funciona, o que pode
            melhorar e o que você gostaria de encontrar no Junta.ai.
          </p>
        </div>

        <form className="feedback-page__form" onSubmit={handleSubmit} noValidate aria-busy={isSending}>
          <div className="feedback-page__fields">
            <div className="feedback-page__field">
              <label htmlFor="name">Nome</label>

              <input
                id="name"
                name="name"
                {...fieldProps("name")}
                type="text"
                placeholder="Seu nome"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="feedback-page__field">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                name="email"
                {...fieldProps("email")}
                type="email"
                placeholder="seuemail@exemplo.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <span className="feedback-page__helper">
                Usaremos seu e-mail apenas se precisarmos entrar em contato
                sobre seu feedback.
              </span>
            </div>

            <div className="feedback-page__field">
              <label htmlFor="subject">
                Sobre o que você quer falar?
              </label>

              <select
                id="subject"
                name="subject"
                {...fieldProps("subject")}
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Selecione um assunto
                </option>

                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.subject === "outro" && (
              <div className="feedback-page__field">
                <label htmlFor="subjectOther">
                  Qual assunto?
                </label>

                <input
                  id="subjectOther"
                  name="subjectOther"
                  {...fieldProps("subjectOther")}
                  type="text"
                  placeholder="Conte brevemente sobre o assunto"
                  value={formData.subjectOther}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="feedback-page__field">
              <label htmlFor="message">
                Conta pra gente.
              </label>

              <textarea
                id="message"
                name="message"
                {...fieldProps("message")}
                rows="6"
                placeholder="O que você gostaria que a gente soubesse?"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {Object.entries(fieldErrors).map(([field, message]) => message && (
            <p className="feedback-page__error" id={`feedback-${field}-error`} key={field}>
              {{ name: "Nome", email: "E-mail", subject: "Assunto", subjectOther: "Qual assunto?", message: "Mensagem" }[field]}: {message}
            </p>
          ))}
          {error && <p className="feedback-page__error" role="alert">{error}</p>}
          {isSending && <p className="feedback-page__helper" role="status">Enviando feedback…</p>}
          <div className="feedback-page__actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="feedback-page__submit"
              loading={isSending}
              loadingText="Enviando…"
            >
              Compartilhar feedback
              <Send size={17} strokeWidth={1.8} />
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default FeedbackPage;
