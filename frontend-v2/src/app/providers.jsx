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
  if (matchPath("/planejador/*", pathname) || matchPath("/relatorios", pathname)) return children;
  if (matchPath("/dashboard", pathname) || matchPath("/visao-mes", pathname) || matchPath("/assistente", pathname)) {
    return isAuthenticated ? <CanonicalFinanceProvider key={matchPath("/assistente", pathname) ? "assistant" : "finance"}>{children}</CanonicalFinanceProvider> : children;
  }
  return <FinanceProvider>{children}</FinanceProvider>;
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
