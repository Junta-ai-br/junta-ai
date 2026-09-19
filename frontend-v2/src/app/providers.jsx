import { GoogleOAuthProvider } from "@react-oauth/google";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function AppProviders({ children }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <UserProvider>{children}</UserProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}