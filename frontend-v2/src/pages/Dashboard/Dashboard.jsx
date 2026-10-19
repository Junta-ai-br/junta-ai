import VisaoMes from "@/pages/VisaoMes/VisaoMes";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <>
      <VisaoMes title="Dashboard" variant="all" />
      <section className="dashboard-chat" aria-labelledby="dashboard-chat-title">
        <h2 id="dashboard-chat-title" className="dashboard-chat__title">Converse com o Assistente</h2>
        <p>O chat deste painel ainda não está conectado aos lançamentos reais. Use “＋ Lançamento” para registrar receitas e despesas.</p>
      </section>
    </>
  );
}
