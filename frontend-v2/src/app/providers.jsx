import { GoogleOAuthProvider } from "@react-oauth/google";
import { matchPath, useLocation } from "react-router-dom";

import { FinanceProvider } from "@/contexts/FinanceContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { CanonicalFinanceProvider } from "@/contexts/CanonicalFinanceProvider";
import { useUser } from "@/contexts/useUser";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function FinancialScope({ children }) {
  const { pathname } = useLocation();
  const { isAuthenticated } = useUser();
  if (matchPath("/dashboard", pathname) || matchPath("/visao-mes", pathname)) {
    return isAuthenticated ? <CanonicalFinanceProvider>{children}</CanonicalFinanceProvider> : children;
  }
  const legacyArea = matchPath("/assistente", pathname) || matchPath("/planejador/*", pathname) || matchPath("/relatorios", pathname);
  return <FinanceProvider>
    {isAuthenticated && legacyArea && <aside role="status" style={{ padding: "12px 5vw", background: "var(--surface)", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}>
      Esta área ainda usa dados locais de demonstração, separados dos lançamentos reais do Dashboard e da Visão do mês.
    </aside>}
    {children}
  </FinanceProvider>;
}

export default function AppProviders({ children }) {
  const content = (
    <ThemeProvider>
      <UserProvider>
        <FinancialScope>{children}</FinancialScope>
      </UserProvider>
    </ThemeProvider>
  );

  if (!GOOGLE_CLIENT_ID) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
}
