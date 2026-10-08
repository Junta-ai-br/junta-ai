import usePublicForm from "@/hooks/usePublicForm";
import { Send } from "lucide-react";

import Button from "@/components/common/Button";

import "./Contato.css";

const subjectOptions = [
  {
    value: "faq",
    label: "Não encontrei minha dúvida na FAQ",
  },
  {
    value: "junta",
    label: "Dúvida sobre o Junta.ai",
  },
  {
    value: "sugestao",
    label: "Sugestão ou ideia",
  },
  {
    value: "parceria",
    label: "Parceria ou colaboração",
  },
  {
    value: "imprensa",
    label: "Imprensa",
  },
  {
    value: "outro",
    label: "Outro",
  },
];

function Contato() {
  const { formData, isSubmitted, isSending, error, fieldErrors, fieldProps, handleChange, handleSubmit, handleNewMessage } = usePublicForm("contact");

  if (isSubmitted) {
    return (
      <main className="page">
        <div className="page__container">
          <div className="page__success" role="status">
            <div className="page__success-icon">
              <Send size={24} strokeWidth={1.8} />
            </div>

            <span className="page__eyebrow">
              Mensagem recebida
            </span>

            <h1 className="page__success-title">
              Obrigado pelo contato.
            </h1>

            <p className="page__success-description">
              Sua mensagem foi encaminhada para a equipe do Junta.ai responsável.
            </p>

            <p className="page__success-description">
              Vamos analisar com atenção e, se necessário, retornaremos o
              contato pelo e-mail informado.
            </p>

            <Button
              variant="primary"
              size="lg"
              className="page__success-button"
              onClick={handleNewMessage}
            >
              Enviar outra mensagem
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page__container">
        <header className="page__header">
          <span className="page__eyebrow">
            Ainda ficou com alguma dúvida?
          </span>

          <h1 className="page__title">
            Conte no que podemos te ajudar.
          </h1>

          <p className="page__description">
            Se você não encontrou sua resposta na sessão de Dúvidas ou quer
            falar com a equipe do Junta.ai sobre algo específico, envie uma
            mensagem.
          </p>
        </header>

        <form className="page__form" onSubmit={handleSubmit} noValidate aria-busy={isSending}>
          <div className="page__fields">
            <div className="page__field">
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

            <div className="page__field">
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

              <span className="page__helper">
                Usaremos seu e-mail apenas para responder à sua mensagem,
                quando necessário.
              </span>
            </div>

            <div className="page__field">
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
              <div className="page__field">
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

            <div className="page__field">
              <label htmlFor="message">
                Mensagem
              </label>

              <textarea
                id="message"
                name="message"
                {...fieldProps("message")}
                rows="6"
                placeholder="Conte pra gente o que você gostaria de saber."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {Object.entries(fieldErrors).map(([field, message]) => message && (
            <p className="page__error" id={`contact-${field}-error`} key={field}>
              {{ name: "Nome", email: "E-mail", subject: "Assunto", subjectOther: "Qual assunto?", message: "Mensagem" }[field]}: {message}
            </p>
          ))}
          {error && <p className="page__error" role="alert">{error}</p>}
          {isSending && <p className="page__helper" role="status">Enviando mensagem…</p>}
          <div className="page__actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="page__submit"
              loading={isSending}
              loadingText="Enviando…"
            >
              Enviar mensagem
              <Send size={17} strokeWidth={1.8} />
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Contato;
