import { ThemeProvider } from "@/contexts/ThemeContext";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}