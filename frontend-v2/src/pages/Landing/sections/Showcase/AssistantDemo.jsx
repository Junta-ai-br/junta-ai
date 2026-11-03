import { Activity, MessageCircle, PiggyBank, SendHorizontal, Target, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import logoIcon from "@/assets/logos/logo-icon.svg";
import "./AssistantDemo.css";

// Landing-only fictional data. Never sourced from session, storage or APIs.
const DEMO_MONTH = {
  income: 3200,
  categories: [
    { name: "Moradia", amount: 950, color: "#00d084" },
    { name: "Alimentação", amount: 550, color: "#7c3aed" },
    { name: "Transporte", amount: 350, color: "#f59e0b" },
  ],
};
const demoExpenses = DEMO_MONTH.categories.reduce((total, category) => total + category.amount, 0);
const demoBalance = DEMO_MONTH.income - demoExpenses;
const money = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const DEMO_INDICATORS = [
  { label: "Receitas", value: money(DEMO_MONTH.income), tone: "income", Icon: TrendingUp },
  { label: "Despesas", value: money(demoExpenses), tone: "expense", Icon: TrendingDown },
  { label: "Saldo", value: money(demoBalance), tone: "balance", Icon: WalletCards },
  { label: "Guardado", value: "R$ 200,00", tone: "saved", Icon: PiggyBank },
];
const DEMO_GOAL = { name: "Viagem de férias", saved: 200, target: 2000 };
// Fixed illustrative score, NOT a financial calculation or credit score.
const DEMO_HEALTH = { score: 78, label: "Saudável" };
const DEMO_MESSAGES = [
  { author: "Você", text: "Quanto posso guardar este mês?" },
  { author: "Junta.ai", text: "Seu saldo é de R$ 1.350,00 após as despesas registradas. Você já destinou R$ 200,00 à meta Viagem de férias. Podemos planejar os próximos passos juntos. 💜" },
  { author: "Você", text: "Gostei! Vamos planejar." },
];

function DemoMonthlyOverview() {
  const segments = DEMO_MONTH.categories.map((category, index) => {
    const preceding = DEMO_MONTH.categories.slice(0, index).reduce((sum, item) => sum + item.amount, 0);
    const start = preceding / demoExpenses * 100;
    const end = (preceding + category.amount) / demoExpenses * 100;
    return `${category.color} ${start}% ${end}%`;
  });
  return (
    <section className="assistant-demo__panel assistant-demo__month" aria-label="Visão do mês demonstrativa">
      <div className="assistant-demo__month-heading"><h3>Visão do mês</h3><strong>{money(demoBalance)}</strong></div>
      <div className="assistant-demo__month-overview">
        <div className="assistant-demo__donut" style={{ background: `conic-gradient(${segments.join(", ")})` }} role="img" aria-label="Distribuição das despesas fictícias por categoria; valores e percentuais na legenda">
          <span>{DEMO_MONTH.categories.length}</span>
        </div>
        <ul className="assistant-demo__categories" aria-label="Categorias de despesas fictícias">
          {DEMO_MONTH.categories.map((category) => (
            <li key={category.name}>
              <span className="assistant-demo__category-dot" style={{ background: category.color }} aria-hidden="true" />
              <span>{category.name}<small>{money(category.amount)}</small></span>
              <strong>{(category.amount / demoExpenses * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
            </li>
          ))}
        </ul>
      </div>
      <p className="assistant-demo__month-total">Despesas do mês <strong>{money(demoExpenses)}</strong></p>
    </section>
  );
}

export default function AssistantDemo() {
  const progress = DEMO_GOAL.saved / DEMO_GOAL.target * 100;
  return (
    <figure className="assistant-demo" aria-label="Prévia demonstrativa do assistente Junta.ai">
      <figcaption className="assistant-demo__header">
        <span className="assistant-demo__brand"><img src={logoIcon} alt="" width="30" height="30" /><strong>Junta.ai</strong></span>
        <span className="assistant-demo__active"><MessageCircle size={16} aria-hidden="true" /> Assistente</span>
        <span className="assistant-demo__notice">Prévia demonstrativa · Dados fictícios</span>
      </figcaption>
      <div className="assistant-demo__body">
        <dl className="assistant-demo__indicators" aria-label="Resumo financeiro fictício">
          {DEMO_INDICATORS.map(({ label, value, tone, Icon }) => (
            <div className={`assistant-demo__indicator assistant-demo__indicator--${tone}`} key={label}>
              <dt>{label}<Icon size={20} strokeWidth={1.8} aria-hidden="true" /></dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="assistant-demo__workspace">
          <section className="assistant-demo__conversation" aria-label="Conversa fictícia com o Junta.ai">
            <div className="assistant-demo__conversation-heading"><h3>Converse. Entenda. Planeje.</h3><p>Seu espaço para organizar a vida financeira.</p></div>
            <ol className="assistant-demo__messages">
              {DEMO_MESSAGES.map(({ author, text }, index) => (
                <li key={index} className={`assistant-demo__message${author === "Você" ? " assistant-demo__message--user" : ""}`}>
                  <span className="assistant-demo__author">{author === "Junta.ai" && <img src={logoIcon} alt="" width="20" height="20" />}{author}</span>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <div className="assistant-demo__composer" aria-label="Campo de mensagem ilustrativo, sem interação">
              <span>Digite uma mensagem…</span><span className="assistant-demo__send" aria-hidden="true"><SendHorizontal size={18} /></span>
            </div>
          </section>
          <aside className="assistant-demo__sidebar" aria-label="Planejamento financeiro fictício">
            <section className="assistant-demo__panel" aria-label="Minhas metas demonstrativas">
              <h3><Target size={20} aria-hidden="true" />Minhas metas</h3>
              <strong className="assistant-demo__goal-name">{DEMO_GOAL.name}</strong>
              <progress max="100" value={progress} aria-label="Progresso de Viagem de férias" />
              <div className="assistant-demo__goal-amounts"><span>{money(DEMO_GOAL.saved)} guardados</span><span>de {money(DEMO_GOAL.target)}</span></div>
              <p className="assistant-demo__goal-status">{progress}% concluído · Em andamento</p>
            </section>
            <section className="assistant-demo__panel assistant-demo__health" aria-label="Saúde financeira demonstrativa">
              <h3><Activity size={20} aria-hidden="true" />Saúde financeira</h3>
              <div className="assistant-demo__health-top"><div><span className="assistant-demo__caption">Seu score</span><p><strong>{DEMO_HEALTH.score}</strong> / 100</p></div><span>{DEMO_HEALTH.label}</span></div>
              <progress max="100" value={DEMO_HEALTH.score} aria-label="Score ilustrativo de saúde financeira" />
              <p className="assistant-demo__caption">Exemplo ilustrativo, sem cálculo real. Não é score de crédito.</p>
            </section>
            <DemoMonthlyOverview />
          </aside>
        </div>
      </div>
    </figure>
  );
}
