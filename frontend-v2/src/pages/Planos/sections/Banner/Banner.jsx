import "./Banner.css";

function Banner() {
  return (
    <section className="planos-banner">
      <div className="planos-banner__container">
        <div className="planos-banner__brand">
          <span className="planos-banner__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 4 4 9M4 9l5 5M4 9h9a6 6 0 0 1 0 12h-1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <div>
            <h2 className="planos-banner__title">
              Converse. Entenda. Planeje.
            </h2>

            <p className="planos-banner__subtitle">Seu dinheiro. Do seu jeito.</p>
          </div>
        </div>

        <a href="#planos-hero" className="planos-banner__button">
          <span>Conheça o Junta.ai</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

export default Banner;
