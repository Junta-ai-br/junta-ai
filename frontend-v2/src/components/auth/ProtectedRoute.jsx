import { Navigate, Outlet } from "react-router-dom";

import { useUser } from "@/contexts/useUser";

export default function ProtectedRoute() {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
