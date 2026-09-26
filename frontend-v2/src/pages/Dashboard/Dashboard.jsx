import VisaoMes from "@/pages/VisaoMes/VisaoMes";
import Assistente from "@/pages/Assistente/Assistente";

import "./Dashboard.css";

export default function Dashboard() {
  return (
    <>
      <VisaoMes
        title="Dashboard"
        variant="all"
      />
      <section className="dashboard-chat" aria-labelledby="dashboard-chat-title">
        <h2 id="dashboard-chat-title" className="dashboard-chat__title">Converse com o Assistente</h2>
        <Assistente variant="embedded" height={360} width="100%" />
      </section>
    </>
  );
}