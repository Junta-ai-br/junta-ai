import Logo from "@/components/branding/Logo";

import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/utils/theme";

import "./Footer.css";

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="footer">
      <div className="footer__container">
        <Logo
          variant="horizontal"
          wordmark={theme === THEMES.DARK ? "branca" : "preta"}
        />

        <p className="footer__copyright">
          © 2026 Junta.ai. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;