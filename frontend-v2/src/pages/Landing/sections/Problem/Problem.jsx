import "./Problem.css";

export default function Problem() {
  return (
    <section className="problem" id="problem">
      <div className="problem__container">

        <header className="problem__header">

          <div className="problem__divider" />

          <span className="problem__eyebrow">
            O verdadeiro problema
          </span>

          <h2 className="problem__title">
            Você não precisa ser melhor com dinheiro.
            <span>
              Você precisa de mais <strong>clareza.</strong>
            </span>
          </h2>

          <p className="problem__description">
            Planilhas, gráficos e aplicativos mostram números.
            Poucos ajudam você a entender o que eles realmente significam
            para a sua vida.
          </p>

        </header>

        <div className="problem__conversation">

          <article className="bubble bubble--left">
            <p className="bubble__text">
              Você sabe quanto gastou.
            </p>
          </article>

          <article className="bubble bubble--left-secondary">
            <p className="bubble__text bubble__text--highlight">
              Mas sabe por que gastou?
            </p>
          </article>

          <article className="bubble bubble--center">
            <p className="bubble__text">
              Números mostram o que aconteceu.
            </p>
          </article>

          <article className="bubble bubble--center-secondary">
            <p className="bubble__text bubble__text--highlight">
              Contexto explica por que aconteceu.
            </p>
          </article>

          <article className="bubble bubble--right">
            <p className="bubble__text">
              Você não precisa de mais gráficos.
            </p>
          </article>

          <article className="bubble bubble--right-secondary">
            <p className="bubble__text bubble__text--highlight">
              Você precisa de alguém que converse com você.
            </p>
          </article>

        </div>

      </div>
    </section>
  );
}