import {
  Activity,
  FileText,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Target,
  Tags,
} from "lucide-react";

import "./Features.css";

export default function Features() {
  return (
    <section className="features" id="features">
    <section className="features" id="recursos">
      <div className="features__container">
        {/* ------------------------------------------------------------------
            Intro
        ------------------------------------------------------------------ */}

        <header className="features__intro">
          <span className="features__eyebrow">Funcionalidades</span>

          <h2 className="features__title">
            Entenda melhor.
            <br />
            Decida com mais <strong>tranquilidade.</strong>
          </h2>
        </header>

        {/* ------------------------------------------------------------------
            Bento Grid
        ------------------------------------------------------------------ */}

        <div className="features__grid">
          {/* ----------------------------------------------------------------
              Conversa
          ---------------------------------------------------------------- */}

          <article className="feature-card">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <MessageCircle size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Conversa</span>

                <h3 className="feature-card__title">
                  Fale sobre seu dinheiro do seu jeito.
                </h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--conversation">
              <div className="conversation__message conversation__message--user">
                Gastei R$ 120 no mercado.
              </div>

              <div className="conversation__message conversation__message--agent">
                Anotei em Alimentação.
              </div>

              <div className="conversation__message conversation__message--agent conversation__message--highlight">
                Seus gastos com alimentação estão em 24% este mês.
              </div>
            </div>
          </article>

          {/* ----------------------------------------------------------------
              Metas
          ---------------------------------------------------------------- */}

          <article className="feature-card">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <Target size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Metas</span>

                <h3 className="feature-card__title">
                  Defina onde você quer chegar.
                </h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--goal">
              <div className="goal__top">
                <div>
                  <span className="goal__name">Reserva de emergência</span>

                  <span className="goal__value">R$ 4.200 de R$ 6.000</span>
                </div>

                <span className="goal__percentage">70%</span>
              </div>

              <div className="goal__progress">
                <span style={{ width: "70%" }} />
              </div>

              <div className="goal__footer">
                <span>R$ 1.800 restantes</span>
                <span>Em andamento</span>
              </div>
            </div>
          </article>

          {/* ----------------------------------------------------------------
              Categorização
          ---------------------------------------------------------------- */}

          <article className="feature-card feature-card--categorization">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <Tags size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Categorização</span>

                <h3 className="feature-card__title">
                  Entenda para onde seu dinheiro vai.
                </h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--categories">
              <div className="categories__chart">
                <div className="categories__donut">
                  <div className="categories__donut-center">
                    <strong>R$ 3.2k</strong>
                    <span>no mês</span>
                  </div>
                </div>
              </div>

              <div className="categories__legend">
                <div className="categories__item">
                  <span className="categories__dot categories__dot--one" />
                  <span>Moradia</span>
                  <strong>32%</strong>
                </div>

                <div className="categories__item">
                  <span className="categories__dot categories__dot--two" />
                  <span>Alimentação</span>
                  <strong>24%</strong>
                </div>

                <div className="categories__item">
                  <span className="categories__dot categories__dot--three" />
                  <span>Lazer</span>
                  <strong>18%</strong>
                </div>

                <div className="categories__item">
                  <span className="categories__dot categories__dot--four" />
                  <span>Outros</span>
                  <strong>26%</strong>
                </div>
              </div>
            </div>
          </article>

          {/* ----------------------------------------------------------------
              Dashboard
          ---------------------------------------------------------------- */}

          <article className="feature-card">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <LayoutDashboard size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Dashboard</span>

                <h3 className="feature-card__title">
                  Veja o que seus números estão dizendo.
                </h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--dashboard">
              <div className="dashboard__summary">
                <div>
                  <span className="dashboard__caption">Gastos no mês</span>

                  <strong className="dashboard__value">R$ 3.240</strong>
                </div>

                <span className="dashboard__variation">↓ 8,4%</span>
              </div>

              <div className="dashboard__chart">
                <span style={{ height: "35%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "42%" }} />
                <span style={{ height: "68%" }} />
                <span style={{ height: "56%" }} />
                <span style={{ height: "78%" }} />
                <span style={{ height: "62%" }} />
              </div>

              <div className="dashboard__months">
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
                <span>Jul</span>
              </div>
            </div>
          </article>

          {/* ----------------------------------------------------------------
              Relatórios
          ---------------------------------------------------------------- */}

          <article className="feature-card">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <FileText size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Relatórios</span>

                <h3 className="feature-card__title">
                  Receba um resumo do que importa.
                </h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--report">
              <div className="report__header">
                <span>Resumo de julho</span>

                <span className="report__status">Pronto</span>
              </div>

              <div className="report__content">
                <strong>Você gastou menos e manteve sua meta em dia.</strong>

                <p>Alimentação foi sua maior categoria no período.</p>
              </div>

              <div className="report__footer">
                <span>3 insights encontrados</span>

                <span className="report__arrow">→</span>
              </div>
            </div>
          </article>

          {/* ----------------------------------------------------------------
    Saúde financeira
---------------------------------------------------------------- */}

          <article className="feature-card">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <Activity size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Saúde financeira</span>

                <h3 className="feature-card__title">Acompanhe sua evolução.</h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--health">
              <div className="health__top">
                <div>
                  <span className="health__caption">Seu score</span>

                  <div className="health__score">
                    <strong>78</strong>
                    <span>/ 100</span>
                  </div>
                </div>

                <div className="health__status">
                  <strong>Boa evolução</strong>
                  <span>+8 pts este mês</span>
                </div>
              </div>

              <div className="health__bar">
                <div className="health__bar-track">
                  <div className="health__bar-fill" style={{ width: "78%" }} />
                </div>

                <div className="health__scale">
                  <span>Precisa de atenção</span>
                  <span>Saudável</span>
                </div>
              </div>
            </div>
          </article>

          {/* ----------------------------------------------------------------
              Privacidade
          ---------------------------------------------------------------- */}

          <article className="feature-card feature-card--privacy">
            <div className="feature-card__header">
              <div className="feature-card__icon">
                <ShieldCheck size={24} strokeWidth={1.8} />
              </div>

              <div className="feature-card__heading">
                <span className="feature-card__label">Privacidade</span>

                <h3 className="feature-card__title">
                  Seus dados continuam sendo seus. Você escolhe o que
                  compartilhar.
                </h3>
              </div>
            </div>

            <div className="feature-widget feature-widget--privacy">
              <div className="privacy__item">
                <ShieldCheck size={18} strokeWidth={1.8} />

                <div>
                  <strong>Seus dados sob seu controle</strong>

                  <span>
                    O Junta.ai trabalha com as informações que você decide
                    compartilhar.
                  </span>
                </div>
              </div>

              <div className="privacy__placeholder">Segurança em evolução</div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
