import "./Solution.css";

export default function Solution() {
  return (
    <section className="solution" id="solution">
      <div className="solution__container">
        <header className="solution__intro">
          <span className="solution__eyebrow">
            Como funciona
          </span>

          <h2 className="solution__title">
            Clareza por <strong>conversa.</strong>
          </h2>

          <p className="solution__description">
            O Junta.ai transforma o que você conta sobre sua vida financeira
            em contexto, decisões e caminhos que fazem sentido para você.
          </p>
        </header>

        <div className="solution__steps">
          <article className="solution__step">
            <div className="solution__step-number">
              01
            </div>

            <div className="solution__step-content">
              <h3 className="solution__step-title">
                Conte do seu jeito
              </h3>

              <p className="solution__step-description">
                Fale sobre seus gastos, planos ou dúvidas como falaria com
                alguém. O Junta.ai entende a conversa e organiza o que importa.
              </p>
            </div>
          </article>

          <article className="solution__step">
            <div className="solution__step-number">
              02
            </div>

            <div className="solution__step-content">
              <h3 className="solution__step-title">
                Entenda o que está por trás
              </h3>

              <p className="solution__step-description">
                Seus números ganham contexto. O Junta.ai ajuda você a perceber
                padrões, relações e comportamentos que podem passar despercebidos.
              </p>
            </div>
          </article>

          <article className="solution__step">
            <div className="solution__step-number">
              03
            </div>

            <div className="solution__step-content">
              <h3 className="solution__step-title">
                Decida com mais clareza
              </h3>

              <p className="solution__step-description">
                Com uma visão mais clara da sua situação, você consegue tomar
                decisões mais conscientes — de acordo com o que realmente
                importa para você.
              </p>
            </div>
          </article>

          <article className="solution__step">
            <div className="solution__step-number">
              04
            </div>

            <div className="solution__step-content">
              <h3 className="solution__step-title">
                Evolua com orientação
              </h3>

              <p className="solution__step-description">
                A partir do que aprende sobre seus movimentos e objetivos,
                o Junta.ai pode sugerir caminhos e pequenas mudanças que façam
                sentido para o seu momento.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}