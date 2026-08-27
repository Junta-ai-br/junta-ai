import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import logoIcon from "@/assets/logos/logo-icon.svg";

import miniAva1 from "@/assets/avatares/mini/mini-ava-1.png";
import miniAva2 from "@/assets/avatares/mini/mini-ava-2.png";
import miniAva3 from "@/assets/avatares/mini/mini-ava-3.png";
import miniAva4 from "@/assets/avatares/mini/mini-ava-4.png";
import miniAva5 from "@/assets/avatares/mini/mini-ava-5.png";
import miniAva6 from "@/assets/avatares/mini/mini-ava-6.png";

import "./SobreHero.css";

const orbitPeople = [
  {
    id: 1,
    orbit: "outer",
    image: miniAva1,
    alt: "Avatar abstrato de uma pessoa",
  },
  {
    id: 2,
    orbit: "outer",
    image: miniAva2,
    alt: "Avatar abstrato de uma pessoa",
  },
  {
    id: 3,
    orbit: "outer",
    image: miniAva3,
    alt: "Avatar abstrato de uma pessoa",
  },
  {
    id: 4,
    orbit: "middle",
    image: miniAva4,
    alt: "Avatar abstrato de uma pessoa",
  },
  {
    id: 5,
    orbit: "middle",
    image: miniAva5,
    alt: "Avatar abstrato de uma pessoa",
  },
  {
    id: 6,
    orbit: "middle",
    image: miniAva6,
    alt: "Avatar abstrato de uma pessoa",
  },
];

function SobreHero() {
  return (
    <section className="sobre-hero" id="sobre-hero">
      <div className="sobre-hero__container">
        <div className="sobre-hero__content">
          <span className="sobre-hero__eyebrow">
            Quem somos
          </span>

          <h1 className="sobre-hero__title">
            11 pessoas. Diferentes histórias.
            <br />
            Um mesmo{" "}
            <span className="sobre-hero__title-highlight">
              desafio.
            </span>
          </h1>

          <p className="sobre-hero__paragraph">
            O Junta.ai nasceu de um propósito em comum: ajudar as pessoas a
            desenvolverem uma relação mais consciente e tranquila com o
            próprio dinheiro.
          </p>

          <p className="sobre-hero__paragraph">
            Somos um grupo de estudantes movidos por aprendizado, colaboração
            e vontade de criar algo que realmente faça sentido na vida das
            pessoas.
          </p>

          <Link to="/" className="sobre-hero__back">
            <ArrowLeft size={18} strokeWidth={2} />
            <span>Voltar para a página inicial</span>
          </Link>
        </div>

        <div className="sobre-hero__visual" aria-hidden="true">
          <div className="sobre-hero__glow" />

          <span className="sobre-hero__ring sobre-hero__ring--outer" />
          <span className="sobre-hero__ring sobre-hero__ring--middle" />
          <span className="sobre-hero__ring sobre-hero__ring--inner" />

          <span className="sobre-hero__particle sobre-hero__particle--1" />
          <span className="sobre-hero__particle sobre-hero__particle--2" />
          <span className="sobre-hero__particle sobre-hero__particle--3" />
          <span className="sobre-hero__particle sobre-hero__particle--4" />
          <span className="sobre-hero__particle sobre-hero__particle--5" />

          <div className="sobre-hero__logo">
            <img src={logoIcon} alt="" />
          </div>

          <div className="sobre-hero__people">
            {orbitPeople.map((person) => (
              <div
                key={person.id}
                className={`sobre-hero__avatar sobre-hero__avatar--${person.orbit}`}
              >
                <img
                  src={person.image}
                  alt={person.alt}
                  className="sobre-hero__avatar-image"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SobreHero;