import { Link } from "react-router-dom";
import VisaoMes from "@/pages/VisaoMes/VisaoMes";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <>
      <VisaoMes title="Dashboard" variant="all" />
      <section className="dashboard-chat" aria-labelledby="dashboard-chat-title">
        <div>
          <h2 id="dashboard-chat-title" className="dashboard-chat__title">Converse com o Assistente</h2>
          <p>Para registrar e consultar suas finanças pelo chat, acesse o Assistente.</p>
        </div>
        <Link to="/assistente" className="dashboard-chat__link">Abrir Assistente <span aria-hidden="true">↗</span></Link>
      </section>
    </>
  );
}
