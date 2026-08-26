import { useState } from "react";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    subjectOther: "",
    message: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Integração com o backend será adicionada posteriormente.
    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <section className="feedback-page">
        <div className="feedback-page__container">
          <div className="feedback-page__success">
            <div className="feedback-page__success-icon">
              <Send size={24} strokeWidth={1.8} />
            </div>

            <span className="feedback-page__eyebrow">
              Feedback enviado
            </span>

            <h1 className="feedback-page__success-title">
              Obrigada por compartilhar.
            </h1>

            <p className="feedback-page__success-description">
              Seu feedback chegou até a gente e faz parte da construção do
              Junta.ai.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="feedback-page__success-button"
              onClick={() => setIsSubmitted(false)}
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

        <form className="feedback-page__form" onSubmit={handleSubmit}>
          <div className="feedback-page__fields">
            <div className="feedback-page__field">
              <label htmlFor="name">Nome</label>

              <input
                id="name"
                name="name"
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
                rows="6"
                placeholder="O que você gostaria que a gente soubesse?"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="feedback-page__actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="feedback-page__submit"
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