import "./Banner.css";

function Banner() {
  return (
    <section className="planos-banner">
      <div className="planos-banner__container">
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