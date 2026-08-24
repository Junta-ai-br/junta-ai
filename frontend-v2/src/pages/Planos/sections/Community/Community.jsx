import { MessageCircle, Lightbulb, Users } from "lucide-react";

import "./Community.css";

const cards = [
  {
    icon: MessageCircle,
    title: "Experimente",
    description:
      "Use o Junta.ai no seu ritmo e conheça o que ele já oferece.",
  },
  {
    icon: Lightbulb,
    title: "Sugira",
    description:
      "Encontrou algo que poderia ser melhor? Tem uma ideia? Conta pra gente.",
  },
  {
    icon: Users,
    title: "Contribua",
    description:
      "Seu feedback ajuda a gente a entender o que realmente importa para quem usa o produto.",
  },
];

function Community() {
  return (
    <section className="community" id="comunidade">
      <div className="community__container">
        <header className="community__intro">
          <span className="community__eyebrow">
            Sua experiência também conta
          </span>

          <h2 className="community__title">
            Junta.ai também é <strong>feito com você.</strong>
          </h2>

          <p className="community__description">
            Use, experimente e conte pra gente o que você acha. Suas
            sugestões e feedbacks ajudam a gente a entender o que realmente
            importa para você.
          </p>
        </header>

        <div className="community__grid">
          {cards.map(({ icon: Icon, title, description }) => (
            <article className="community-card" key={title}>
              <div className="community-card__icon">
                <Icon size={22} strokeWidth={1.8} />
              </div>

              <h3 className="community-card__title">{title}</h3>
              <p className="community-card__description">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Community;
