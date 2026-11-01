import ProblemIllustration from "./ProblemIllustration";
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
        <div className="problem__composition">
          <div className="problem__story">
            <div className="problem__pair">
              <p>Você sabe quanto gastou.</p>
              <p><strong>Mas sabe por que gastou?</strong></p>
            </div>
            <div className="problem__pair">
              <p>Números mostram o que aconteceu.</p>
              <p><strong>Contexto explica por que aconteceu.</strong></p>
            </div>
            <div className="problem__pair problem__pair--conclusion">
              <p>Você não precisa de mais gráficos.</p>
              <p><strong>Você precisa de alguém que converse com você.</strong></p>
            </div>
          </div>
          <ProblemIllustration />
        </div>
      </div>
    </section>
  );
}
