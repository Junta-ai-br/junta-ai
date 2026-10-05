import { lazy, Suspense } from "react";

import AssistantConversation from "@/components/chat/AssistantConversation";
import Spinner from "@/components/feedback/Spinner";
import useFinanceData from "@/contexts/useFinanceData";
import useAssistantConversation from "@/hooks/useAssistantConversation";
const VisaoMes = lazy(() => import("@/pages/VisaoMes/VisaoMes"));

import "@/pages/Assistente/Assistente.css";
import "./Dashboard.css";

export default function Dashboard() {
  const { categories, addTransaction } = useFinanceData();
  const conversation = useAssistantConversation({ addTransaction });

  return (
    <>
      <Suspense fallback={<Spinner />}>
        <VisaoMes title="Dashboard" variant="all" />
      </Suspense>
      <section className="dashboard-chat" aria-labelledby="dashboard-chat-title">
        <h2 id="dashboard-chat-title" className="dashboard-chat__title">Converse com o Assistente</h2>
        <AssistantConversation
          {...conversation}
          categories={categories}
        />
      </section>
    </>
  );
}