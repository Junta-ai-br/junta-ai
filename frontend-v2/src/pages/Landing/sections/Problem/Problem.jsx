import "./Problem.css";
import Bubble from "../../../../components/common/Bubble";

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
            A gente aprende a ganhar dinheiro.
            <span>
              Mas nem sempre entende e sabe o que faz com ele.
            </span>
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

          <Bubble
            size="md"
            className="bubble--left"
          >
            Você sabe quanto gastou.
          </Bubble>

          <Bubble
            size="md"
            className="bubble--left-secondary"
          >
            <strong>Mas sabe por que gastou?</strong>
          </Bubble>

          <Bubble
            size="lg"
            className="bubble--center"
          >
            Números mostram o que aconteceu.
          </Bubble>

          <Bubble
            size="lg"
            className="bubble--center-secondary"
          >
            <strong>Contexto explica por que aconteceu.</strong>
          </Bubble>

          <Bubble
            size="md"
            className="bubble--right"
          >
            Você não precisa de mais gráficos.
          </Bubble>

          <Bubble
            size="xl"
            className="bubble--right-secondary"
          >
            <strong>
              Você precisa de alguém que converse com você.
            </strong>
          </Bubble>

        </div>

      </div>
    </section>
  );
}