import { ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";

import "./SobreHero.css";

function SobreHero() {
  return (
    <section className="sobre-hero" id="sobre-hero">
      <div className="sobre-hero__container">
        <div className="sobre-hero__content">
          <span className="sobre-hero__eyebrow">Quem somos</span>

          <h1 className="sobre-hero__title">
            10 pessoas. Diferentes histórias.
            <br />
            Um mesmo <span className="sobre-hero__title-highlight">desafio.</span>
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
            Voltar para a página inicial
          </Link>
        </div>

        <div className="sobre-hero__illustration" aria-hidden="true">
          <span className="sobre-hero__ring sobre-hero__ring--outer" />
          <span className="sobre-hero__ring sobre-hero__ring--inner" />

          <div className="sobre-hero__logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 4 4 9M4 9l5 5M4 9h9a6 6 0 0 1 0 12h-1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <span className="sobre-hero__avatar sobre-hero__avatar--1">
            <User size={18} strokeWidth={1.8} />
          </span>
          <span className="sobre-hero__avatar sobre-hero__avatar--2">
            <User size={18} strokeWidth={1.8} />
          </span>
          <span className="sobre-hero__avatar sobre-hero__avatar--3">
            <User size={18} strokeWidth={1.8} />
          </span>
          <span className="sobre-hero__avatar sobre-hero__avatar--4">
            <User size={18} strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </section>
  );
}

export default SobreHero;
