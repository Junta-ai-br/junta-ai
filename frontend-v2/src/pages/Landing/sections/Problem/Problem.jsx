import "./Problem.css";
import Bubble from "../../../../components/common/Bubble";

export default function Problem() {
  return (
    <section className="problem">
      <div className="problem__container">

        <header className="problem__header">

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
        </header>

        <div className="problem__conversation">
          <Bubble
            size="md"
            className="bubble--left"
            delay={0}
            floatDelay={0}
          >
            Você sabe quanto gastou.
          </Bubble>

          <Bubble
            size="md"
            className="bubble--left-secondary"
            delay={0.7}
            floatDelay={0.5}
          >
            <strong>Mas sabe por que gastou?</strong>
          </Bubble>

          <Bubble
            size="lg"
            className="bubble--center"
            delay={1.4}
            floatDelay={1}
          >
            Números mostram o que aconteceu.
          </Bubble>

          <Bubble
            size="lg"
            className="bubble--center-secondary"
            delay={2.1}
            floatDelay={0.25}
          >
            <strong>Contexto explica por que aconteceu.</strong>
          </Bubble>

          <Bubble
            size="md"
            className="bubble--right"
            delay={2.8}
            floatDelay={0.75}
          >
            Você não precisa de mais gráficos.
          </Bubble>

          <Bubble
            size="xl"
            className="bubble--right-secondary"
            delay={3.5}
            floatDelay={1.25}
          >
            <strong>
              Você precisa de alguém que converse com você.
            </strong>
          </Bubble>

        </div>

        </div>
      </div>
    </section>
  );
}