import { Accordion } from "radix-ui";

import "./FAQ.css";

const questions = [
  {
    id: "what-is",
    question: "O que é o Junta.ai?",
    answer:
      "O Junta.ai é um assistente financeiro conversacional que ajuda você a entender melhor sua relação com o dinheiro. Você pode conversar sobre gastos, metas e dúvidas, enquanto o sistema organiza suas informações e ajuda a encontrar padrões e possibilidades.",
  },
  {
    id: "financial-knowledge",
    question: "Preciso entender de finanças para usar o Junta.ai?",
    answer:
      "Não. Você não precisa dominar planilhas, categorias ou termos financeiros. A ideia é poder falar sobre seu dinheiro de forma natural e receber informações organizadas de um jeito que faça sentido para você.",
  },
  {
    id: "how-it-works",
    question: "Como o Junta.ai entende o que eu falo?",
    answer:
      "O Junta.ai utiliza inteligência artificial para interpretar suas mensagens, identificar informações relevantes e organizar seus movimentos financeiros. A conversa é transformada em dados estruturados que podem ser usados para acompanhar sua situação e seus objetivos.",
  },
  {
    id: "bank-connection",
    question: "Preciso conectar minha conta bancária ou meu cartão?",
    answer:
      "Não. O Junta.ai não depende de conexões com bancos ou cartões de crédito para funcionar. Você também não precisa informar número de cartão, senha, código de segurança ou outros dados bancários no chat. Evite compartilhar esse tipo de informação.",
  },
  {
    id: "security",
    question: "Como o Junta.ai protege meus dados?",
    answer:
      "Segurança e privacidade fazem parte da arquitetura do Junta.ai desde o desenvolvimento do produto. As decisões de segurança estão sendo definidas considerando os riscos específicos de aplicações com inteligência artificial e serão evoluídas conforme o produto avançar.",
  },
  {
    id: "recommendations",
    question: "O Junta.ai dá recomendações financeiras?",
    answer:
      "O Junta.ai pode ajudar você a perceber padrões e sugerir caminhos com base nas informações que você compartilha. Essas sugestões têm o objetivo de apoiar sua tomada de decisão, não substituir sua autonomia ou oferecer aconselhamento financeiro profissional.",
  },
  {
    id: "goals",
    question: "Posso definir metas e acompanhar meu progresso?",
    answer:
      "Sim. Você pode definir objetivos financeiros e acompanhar sua evolução ao longo do tempo. O Junta.ai pode usar essas metas como contexto para ajudar você a entender seu progresso e pensar nos próximos passos.",
  },
];

export default function FAQ() {
  return (
    <section className="faq" id="duvidas">
      <div className="faq__container">
        <div className="faq__divider" />

        <header className="faq__header">
          <span className="faq__eyebrow">
            Transparência
          </span>

          <h2 className="faq__title">
            Antes de usar, vale
            <span>
              saber <strong>como funciona.</strong>
            </span>
          </h2>
        </header>

        <Accordion.Root
          className="faq__accordion"
          type="single"
          collapsible
        >
          {questions.map((item) => (
            <Accordion.Item
              key={item.id}
              className="faq__item"
              value={item.id}
            >
              <Accordion.Header className="faq__header-item">
                <Accordion.Trigger className="faq__trigger">
                  <span className="faq__question">
                    {item.question}
                  </span>

                  <span
                    className="faq__icon"
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>

              <Accordion.Content className="faq__content">
                <div className="faq__answer">
                  {item.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        <div className="faq__contact">
          <span className="faq__contact-text">
            Ainda ficou alguma dúvida?
          </span>

          <span className="faq__contact-link">
            Entre em contato
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </section>
  );
}