import { motion, useReducedMotion } from "motion/react";

import "./Banner.css";

function Banner() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="planos-banner">
      <div className="planos-banner__container">
        <motion.div
          className="planos-banner__animated-border"
          animate={{ rotate: reduceMotion ? 0 : 360 }}
          transition={reduceMotion
            ? { duration: 0 }
            : { duration: 12, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        />
        <div className="planos-banner__brand">
          <div>
            <h2 className="planos-banner__title">
              Converse. Entenda. Planeje.
            </h2>

            <p className="planos-banner__subtitle">
              Seu dinheiro. Do seu jeito.
            </p>
          </div>
        </div>

        <a href="/cadastro" className="planos-banner__button">
          <span>Teste o Junta.ai</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

export default Banner;
