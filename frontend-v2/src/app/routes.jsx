import { Routes, Route } from "react-router-dom";

import LandingLayout from "@/layouts/LandingLayout";
import AuthLayout from "@/layouts/AuthLayout";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Assistente from "@/pages/Assistente";
import Relatorios from "@/pages/Relatorios";
import Perfil from "@/pages/Perfil";

function AppRoutes() {
  return (
    <Routes>
      {/* Área pública */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      {/* Área autenticada (futuramente protegida por PrivateRoute) */}
      <Route element={<AuthLayout />}>
        <Route path="/assistente" element={<Assistente />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;