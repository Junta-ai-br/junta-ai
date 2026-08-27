import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import logoIcon from "@/assets/logos/logo-icon.svg";

import miniAva1 from "@/assets/avatares/mini/mini-ava-1.png";
import miniAva2 from "@/assets/avatares/mini/mini-ava-2.png";
import miniAva3 from "@/assets/avatares/mini/mini-ava-3.png";
import miniAva4 from "@/assets/avatares/mini/mini-ava-4.png";
import miniAva5 from "@/assets/avatares/mini/mini-ava-5.png";
import miniAva6 from "@/assets/avatares/mini/mini-ava-6.png";

import {
  OrbitGroup,
  OrbitAvatar,
} from "../../SobreMotion/SobreMotion";

import "./SobreHero.css";

const outerPeople = [
  {
    id: 1,
    image: miniAva1,
    alt: "Avatar abstrato de uma pessoa",
    angle: 0,
  },
  {
    id: 2,
    image: miniAva2,
    alt: "Avatar abstrato de uma pessoa",
    angle: 120,
  },
  {
    id: 3,
    image: miniAva3,
    alt: "Avatar abstrato de uma pessoa",
    angle: 240,
  },
];

const middlePeople = [
  {
    id: 4,
    image: miniAva4,
    alt: "Avatar abstrato de uma pessoa",
    angle: 0,
  },
  {
    id: 5,
    image: miniAva5,
    alt: "Avatar abstrato de uma pessoa",
    angle: 120,
  },
  {
    id: 6,
    image: miniAva6,
    alt: "Avatar abstrato de uma pessoa",
    angle: 240,
  },
];

function SobreHero() {
  return (
    <section className="sobre-hero" id="sobre-hero">
      <div className="sobre-hero__container">
        {/* ================================================================
            Content
            ================================================================ */}

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
            desenvolverem uma relação mais consciente e tranquila com o próprio
            dinheiro.
          </p>

          <p className="sobre-hero__paragraph">
            Somos um grupo de estudantes movidos por aprendizado, colaboração e
            vontade de criar algo que realmente faça sentido na vida das
            pessoas.
          </p>

          <Link to="/" className="sobre-hero__back">
            <ArrowLeft size={18} strokeWidth={2} />
            <span>Voltar para a página inicial</span>
          </Link>
        </div>

        {/* ================================================================
            Visual
            ================================================================ */}

        <div className="sobre-hero__visual" aria-hidden="true">
          <div className="sobre-hero__glow" />

          {/* Orbit rings */}
          <span className="sobre-hero__ring sobre-hero__ring--outer" />
          <span className="sobre-hero__ring sobre-hero__ring--middle" />
          <span className="sobre-hero__ring sobre-hero__ring--inner" />

          {/* Particles */}
          <span className="sobre-hero__particle sobre-hero__particle--1" />
          <span className="sobre-hero__particle sobre-hero__particle--2" />
          <span className="sobre-hero__particle sobre-hero__particle--3" />
          <span className="sobre-hero__particle sobre-hero__particle--4" />
          <span className="sobre-hero__particle sobre-hero__particle--5" />

          {/* Center logo */}
          <div className="sobre-hero__logo">
            <img src={logoIcon} alt="" />
          </div>

          {/* ==============================================================
              Animated People
              ============================================================== */}

          <div className="sobre-hero__people">
            {/* ------------------------------------------------------------
                Outer orbit
                3 avatars · clockwise
                ------------------------------------------------------------ */}

            <OrbitGroup
              duration={36}
              delay={0}
              direction="clockwise"
            >
              {outerPeople.map((person) => (
                <OrbitAvatar
                  key={person.id}
                  angle={person.angle}
                  radius={218}
                >
                  <div className="sobre-hero__avatar sobre-hero__avatar--outer">
                    <img
                      src={person.image}
                      alt={person.alt}
                      className="sobre-hero__avatar-image"
                    />
                  </div>
                </OrbitAvatar>
              ))}
            </OrbitGroup>

            {/* ------------------------------------------------------------
                Middle orbit
                3 avatars · counter-clockwise
                ------------------------------------------------------------ */}

            <OrbitGroup
              duration={28}
              delay={-8}
              direction="counter-clockwise"
            >
              {middlePeople.map((person) => (
                <OrbitAvatar
                  key={person.id}
                  angle={person.angle}
                  radius={166}
                >
                  <div className="sobre-hero__avatar sobre-hero__avatar--middle">
                    <img
                      src={person.image}
                      alt={person.alt}
                      className="sobre-hero__avatar-image"
                    />
                  </div>
                </OrbitAvatar>
              ))}
            </OrbitGroup>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SobreHero;