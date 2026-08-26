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
            Converse com o Junta.ai, explore a experiência e veja como organizar
            sua vida financeira pode ser mais simples.
          </p>
        </div>

        <div className="planos-hero__preview">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}

export default PlanosHero;