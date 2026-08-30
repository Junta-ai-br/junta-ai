import { Routes, Route } from "react-router-dom";

import LandingLayout from "@/layouts/LandingLayout";
import AuthLayout from "@/layouts/AuthLayout";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Assistente from "@/pages/Assistente";
import Relatorios from "@/pages/Relatorios";
import Perfil from "@/pages/Perfil";
import Planos from "@/pages/Planos";
import Sobre from "@/pages/Sobre";
import Contato from "@/pages/Contato";
import Privacidade from "@/pages/Privacidade";
import Termos from "@/pages/Termos";
import FeedbackPage from "@/pages/FeedbackPage/FeedbackPage";

import Login from "@/pages/Login/Login";
import Cadastro from "@/pages/Cadastro/Cadastro";

function AppRoutes() {
  return (
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;