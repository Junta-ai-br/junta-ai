import { MessageCircle, Lightbulb, Share2 } from "lucide-react";

import "./Community.css";

const cards = [
  {
    icon: MessageCircle,
    title: "Experimente",
    description:
      "Converse com o Junta.ai, registre seus gastos e descubra uma forma mais simples de acompanhar seu dinheiro.",
  },
  {
    icon: Lightbulb,
    title: "Sugira",
    description:
      "Sentiu falta de alguma coisa? Tem uma ideia para melhorar a experiência? Conte pra gente.",
  },
  {
    icon: Share2,
    title: "Compartilhe",
    description:
      "Conte o que funcionou, o que pode melhorar e o que você gostaria de ver no Junta.ai.",
  },
];

function Community() {
  return (
    <section className="community" id="comunidade">
      <div className="community__container">
        <header className="community__intro">
          <span className="community__eyebrow">
            Sua experiência é o nosso maior valor
          </span>

          <h2 className="community__title">
            Junta.ai também é <strong>feito com você.</strong>
          </h2>

          <p className="community__description">
            Experimente o Junta.ai, descubra o que ele já pode fazer por você
            e conte pra gente como foi.
          </p>
        </header>

        <div className="community__grid">
          {cards.map(({ icon: Icon, title, description }) => (
            <article className="community-card" key={title}>
              <div className="community-card__icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>

              <h3 className="community-card__title">{title}</h3>

              <p className="community-card__description">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Community;