import "./Banner.css";
import logoIcon from "../../../../assets/logos/logo-icon.svg";

function Banner() {
  return (
    <section className="sobre-banner">
      <div className="sobre-banner__container">
        <div className="sobre-banner__brand">
          <span className="sobre-banner__icon" aria-hidden="true">
            <img src={logoIcon} alt="" />
          </span>

          <h2 className="sobre-banner__title">
            <span className="sobre-banner__line">
              Construído com{" "}
              <span className="sobre-banner__highlight">propósito</span>,
            </span>

            <span className="sobre-banner__line">
              pensado para{" "}
              <span className="sobre-banner__highlight">transformar</span>.
            </span>
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