import "./PlanosHero.css";

function PlanosHero() {
  return (
    <section className="planos-hero" id="planos-hero">
      <div className="planos-hero__container">
        <div className="planos-hero__content">
          <span className="planos-hero__eyebrow">Planos</span>

          <h1 className="planos-hero__title">
            <span>Teste do</span>
            <span className="planos-hero__title-highlight">seu jeito.</span>
          </h1>

          <p className="planos-hero__description">
            Conheça o Junta.ai, explore a experiência e descubra como ele pode
            ajudar na sua relação com o dinheiro.
          </p>
        </div>

        <div className="planos-hero__preview" aria-hidden="true">
          <div className="planos-hero__phone">
            <div className="planos-hero__phone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 4 4 9M4 9l5 5M4 9h9a6 6 0 0 1 0 12h-1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="planos-hero__bubble planos-hero__bubble--user">
              Quanto gastei com transporte esse mês?
            </div>

            <div className="planos-hero__bubble planos-hero__bubble--agent">
              Você gastou R$ 320,00 com transporte neste mês.
            </div>

            <div className="planos-hero__summary">
              <div className="planos-hero__summary-header">
                <span>Resumo do mês</span>
                <span>Maio</span>
              </div>

              <div className="planos-hero__summary-row">
                <span className="planos-hero__summary-dot planos-hero__summary-dot--income" />
                <span>Receitas</span>
                <strong>R$ 4.250,00</strong>
              </div>

              <div className="planos-hero__summary-row">
                <span className="planos-hero__summary-dot planos-hero__summary-dot--expense" />
                <span>Despesas</span>
                <strong>R$ 2.980,00</strong>
              </div>

              <div className="planos-hero__summary-row">
                <span className="planos-hero__summary-dot planos-hero__summary-dot--balance" />
                <span>Saldo</span>
                <strong>R$ 1.270,00</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlanosHero;
