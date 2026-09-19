import "./PlanosHero.css";
import ProductMockup from "@/components/ProductMockup";

function PlanosHero() {
  return (
    <section className="planos-hero" id="planos-hero">
      <div className="planos-hero__container">
        <div className="planos-hero__content">
          <span className="planos-hero__eyebrow">Planos</span>

          <h1 className="planos-hero__title">
            Teste do{" "}
            <span className="planos-hero__title-highlight">
              seu jeito.
            </span>
          </h1>

          <p className="planos-hero__description">
            Converse com o Junta.ai, explore seus recursos e veja na prática
            como ele pode ajudar você a entender melhor sua vida financeira.
          </p>

          <span className="planos-hero__support">
            Comece sem compromisso.
          </span>
        </div>

        <div className="planos-hero__preview">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}

export default PlanosHero;