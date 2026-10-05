import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Spinner from "@/components/feedback/Spinner";
import LandingLayout from "@/layouts/LandingLayout";
import AuthLayout from "@/layouts/AuthLayout";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Assistente = lazy(() => import("@/pages/Assistente"));
const Planejador = lazy(() => import("@/pages/Planejador"));
const HistoricoPlanejador = lazy(() => import("@/pages/Planejador/Historico"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const ExcluirConta = lazy(() => import("@/pages/ExcluirConta"));
const Planos = lazy(() => import("@/pages/Planos"));
const Sobre = lazy(() => import("@/pages/Sobre"));
const Contato = lazy(() => import("@/pages/Contato"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));
const Termos = lazy(() => import("@/pages/Termos"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage/FeedbackPage"));
const Login = lazy(() => import("@/pages/Login/Login"));
const Cadastro = lazy(() => import("@/pages/Cadastro/Cadastro"));

const Relatorios = lazy(() => import("@/pages/Relatorios"));
const VisaoMes = lazy(() => import("@/pages/VisaoMes/VisaoMes"));

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Área pública */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>

        {/* Área de autenticação e área interna */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/assistente" element={<Assistente />} />
          <Route path="/planejador" element={<Planejador />} />
          <Route path="/planejador/historico" element={<HistoricoPlanejador />} />
          <Route path="/visao-mes" element={<VisaoMes variant="month" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/excluir-conta" element={<ExcluirConta />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
