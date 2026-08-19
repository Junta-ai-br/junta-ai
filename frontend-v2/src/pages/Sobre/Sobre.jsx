import "./Sobre.css";

function Sobre() {
  return (
    <main className="page">
      <div className="page__container">
        <header className="page__header">
          <span className="page__eyebrow">Sobre Nós</span>

          <h1 className="page__title">
            Sobre Nós - Equipe Junta.ai
          </h1>

          <p className="page__description">
            Conteúdo em desenvolvimento.
          </p>
        </header>

        <div className="page__content">
          {/* Conteúdo da política será desenvolvido pela equipe. */}
        </div>
      </div>
    </main>
  );
}

export default Sobre;