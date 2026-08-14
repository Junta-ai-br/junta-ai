import "./CTA.css";

export default function CTA() {
  return (
    <section className="cta">
      <div className="cta__container">
        <div
          className="cta__status"
          aria-label="Disponível para começar"
        >
          <span
            className="cta__status-dot"
            aria-hidden="true"
          />
          <span>Disponível — comece grátis</span>
        </div>

        <header className="cta__header">
          <h2 className="cta__title">
            <span>
              Pare de só olhar para os{" "}
              <strong>números.</strong>
            </span>

            <span>
              Comece a entender o que eles{" "}
              <strong>dizem.</strong>
            </span>
          </h2>

          <p className="cta__description">
            Seu dinheiro faz parte da sua história.
            <br />
            Veja o que ele está contando.
          </p>
        </header>

        <a
          className="cta__button"
          href="#assistente"
        >
          <span>Começar uma conversa</span>

          <span
            className="cta__button-arrow"
            aria-hidden="true"
          >
            →
          </span>
        </a>

        <p className="cta__microcopy">
          Sem planilhas. Sem complicação. No seu ritmo.
        </p>
      </div>
    </section>
  );
}