import { Link } from "react-router-dom";

import "./Atualizacoes.css";

export default function Atualizacoes() {
  return (
    <article className="updates-page" aria-labelledby="updates-title">
      <div className="updates-page__container">
        <div className="updates-page__header">
          <p className="updates-page__eyebrow">TEM NOVIDADE VINDO AÍ</p>
          <h1 className="updates-page__title" id="updates-title">
            A gente <span className="updates-page__brand">evolui</span>. Você ganha novas <span className="updates-page__brand">possibilidades</span>.
          </h1>
        </div>

        <div className="updates-page__body">
          <p className="updates-page__intro">
            Sabe quando você olha para os seus gastos e pensa:{" "}
            <br />
            <strong>&quot;Tá, mas o que eu faço com essa informação?&quot;</strong>
          </p>
          <p className="updates-page__paragraph">É justamente aí que queremos chegar.</p>
          <p className="updates-page__paragraph">
            Estamos preparando o Junta.ai para ir além dos números: ajudar você a entender melhor seus hábitos, tirar dúvidas e descobrir possibilidades que façam sentido para o seu momento.
          </p>

          <p className="updates-page__highlight">
            Sem fórmulas mágicas, sem sermão e sem fingir que todo mundo vive a mesma realidade.
          </p>

          <p className="updates-page__paragraph">
            E isso é só o começo. Tem muita coisa que a gente ainda quer construir por aqui.
          </p>
          <p className="updates-page__paragraph">
            Tem alguma ideia que gostaria de ver no Junta.ai?
          </p>
          <p className="updates-page__paragraph">
            Conta pra gente! Afinal, ninguém melhor do que você para dizer o que faz <span className="updates-page__closing-tail">falta. 😉</span>
          </p>

          <Link to="/feedback" className="button button--primary button--md updates-page__cta">
            Compartilhar uma ideia
          </Link>
        </div>
      </div>
    </article>
  );
}
