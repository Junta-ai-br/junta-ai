import "./ProductMockup.css";

import logoHorizontalBranca from "@/assets/logos/logo-horizontal-branca.svg";
import logoHorizontalPreta from "@/assets/logos/logo-horizontal-preta.svg";

function ProductMockup() {
  return (
    <div className="product-mockup" aria-hidden="true">
      <div className="product-mockup__phone">
        <div className="product-mockup__notch" />

        <div className="product-mockup__screen">
          <header className="product-mockup__header">
            <div className="product-mockup__brand">
              <img
                src={logoHorizontalBranca}
                alt=""
                className="product-mockup__logo product-mockup__logo--dark"
              />

              <img
                src={logoHorizontalPreta}
                alt=""
                className="product-mockup__logo product-mockup__logo--light"
              />
            </div>

            <span className="product-mockup__status" />
          </header>

          <div className="product-mockup__content">
            <div className="product-mockup__intro">
              <span>Olá! 👋</span>
              <strong>Como posso ajudar?</strong>
            </div>

            <div className="product-mockup__chat">
              <div className="product-mockup__message product-mockup__message--user">
                Quanto gastei com transporte esse mês?
              </div>

              <div className="product-mockup__typing">
                <span />
                <span />
                <span />
              </div>

              <div className="product-mockup__message product-mockup__message--agent">
                Você gastou <strong>R$ 320,00</strong> com transporte neste mês.
              </div>
            </div>

            <div className="product-mockup__summary">
              <div className="product-mockup__summary-header">
                <span>Resumo do mês</span>
                <small>Maio</small>
              </div>

              <div className="product-mockup__summary-row">
                <span className="product-mockup__dot product-mockup__dot--income" />
                <span>Receitas</span>
                <strong>R$ 3.250</strong>
              </div>

              <div className="product-mockup__summary-row">
                <span className="product-mockup__dot product-mockup__dot--expense" />
                <span>Despesas</span>
                <strong>R$ 1.980</strong>
              </div>

              <div className="product-mockup__summary-row product-mockup__summary-row--balance">
                <span>Saldo</span>
                <strong>R$ 1.270</strong>
              </div>
            </div>
          </div>

          <div className="product-mockup__input">
            <span>Converse com o Junta.ai...</span>

            <span className="product-mockup__send">
              ↑
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductMockup;