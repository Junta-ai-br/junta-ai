import "./Hero.css";

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__container">
        <div className="hero__content">
          <span className="hero__badge">
            <span className="hero__badge-dot" />
            Assistente financeiro conversacional
          </span>

          <h1 className="hero__title">
            Organizar sua vida financeira pode começar com uma conversa.
          </h1>

          <p className="hero__description">
            O Junta.ai transforma conversas em ações práticas para ajudar você a
            criar uma relação mais consciente e tranquila com o seu dinheiro.
            Sem planilhas complicadas, sem termos difíceis e sem julgamentos.
          </p>

          <div className="hero__actions">
            <a href="#" className="button button--primary">
              Experimentar o Junta.ai
            </a>

            <a href="#problem" className="button button--secondary">
              Conhecer a proposta
            </a>
          </div>
        </div>

        <div className="hero__preview">
          <div className="hero__preview-placeholder">
            <span className="hero__preview-label">Prévia da interface</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
