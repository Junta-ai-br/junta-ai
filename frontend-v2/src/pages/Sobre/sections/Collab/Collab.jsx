import {
  Lightbulb,
  PenTool,
  Code2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import "./Collab.css";

const pillars = [
  {
    icon: Lightbulb,
    title: "Ideia",
    description: "Entendemos o problema e cocriamos soluções com empatia.",
  },
  {
    icon: PenTool,
    title: "Design",
    description: "Criamos experiências simples, claras e que fazem sentido.",
  },
  {
    icon: Code2,
    title: "Desenvolvimento",
    description: "Transformamos ideias em código com qualidade e propósito.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    description:
      "Pensamos em segurança desde o desenvolvimento para proteger pessoas e dados.",
  },
  {
    icon: Sparkles,
    title: "Inteligência",
    description: "Usamos IA para tornar as conversas mais úteis e personalizadas.",
  },
  {
    icon: UsersRound,
    title: "Colaboração",
    description: "Aprendemos juntos e crescemos como time e como pessoas.",
  },
];

function Collab() {
  return (
    <section className="collab" id="colaboracao">
      <div className="collab__container">
        <div className="collab__intro">
          <h2 className="collab__title">
            Um projeto
            <br />
            feito em conjunto
          </h2>

          <p className="collab__description">
            Diferentes talentos, uma mesma missão: criar um produto que une
            tecnologia, experiência e segurança para transformar a relação
            com o dinheiro.
          </p>
        </div>

        <div className="collab__pillars">
          {pillars.map(({ icon: Icon, title, description }, index) => (
            <div className="collab__pillar-wrapper" key={title}>
              {index > 0 && (
                <span className="collab__plus" aria-hidden="true">
                  +
                </span>
              )}

              <article className="collab__pillar">
                <div className="collab__pillar-icon">
                  <Icon size={24} strokeWidth={1.6} />
                </div>

                <h3 className="collab__pillar-title">{title}</h3>
                <p className="collab__pillar-description">{description}</p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Collab;
