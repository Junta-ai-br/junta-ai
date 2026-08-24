import "./Banner.css";

function Banner() {
  return (
    <section className="sobre-banner">
      <div className="sobre-banner__container">
        <div className="sobre-banner__brand">
          <span className="sobre-banner__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 4 4 9M4 9l5 5M4 9h9a6 6 0 0 1 0 12h-1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <h2 className="sobre-banner__title">
            Construído por pessoas,
            <br />
            pensado para pessoas.
          </h2>
        </div>

        <p className="sobre-banner__description">
          Acreditamos que cuidar do dinheiro também pode ser uma experiência
          mais simples, humana e leve.
        </p>

        <a href="/planos" className="sobre-banner__button">
          <span>Conheça o Junta.ai</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

export default Banner;
