import {
  Code2,
  Lightbulb,
  PenTool,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import "./Collab.css";

const pillars = [
  {
    title: "Ideia",
    description: "Entendemos o problema e criamos soluções com empatia.",
    icon: Lightbulb,
  },
  {
    title: "Design",
    description: "Criamos experiências simples, claras e que fazem sentido.",
    icon: PenTool,
  },
  {
    title: "Desenvolvimento",
    description: "Transformamos ideias em código com qualidade e propósito.",
    icon: Code2,
  },
  {
    title: "Segurança",
    description:
      "Pensamos em segurança desde o desenvolvimento para proteger pessoas e dados.",
    icon: ShieldCheck,
  },
  {
    title: "Inteligência",
    description:
      "Usamos IA para tornar as conversas mais úteis e personalizadas.",
    icon: Sparkles,
  },
  {
    title: "Colaboração",
    description:
      "Aprendemos juntos e crescemos como time e como pessoas.",
    icon: Users,
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
            tecnologia, experiência e segurança para transformar a relação com
            o dinheiro.
          </p>
        </div>

        <div className="collab__pillars">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article className="collab__pillar" key={title}>
              <div className="collab__pillar-icon">
                <Icon aria-hidden="true" />
              </div>

              <h3 className="collab__pillar-title">{title}</h3>

              <p className="collab__pillar-description">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Collab;