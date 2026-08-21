import { Link } from "react-router-dom";

import Logo from "@/components/branding/logo";
import Navbar from "@/components/navigation/Navbar";
import ThemeSwitch from "../ThemeSwitch";

import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";

import "./Header.css";

function Header() {
  const { theme } = useTheme();

  function handleLogoClick() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <header className="header">
      <div className="header__theme">
        <ThemeSwitch />
      </div>

      <div className="header__container">
        <div className="header__brand">
          <button
            type="button"
            className="header__logo-button"
            onClick={handleLogoClick}
            aria-label="Voltar ao topo"
          >
            <Logo
              variant="horizontal"
              wordmark={theme === THEMES.DARK ? "branca" : "preta"}
              width={200}
            />
          </button>
        </div>

        <Navbar />

        <div className="header__actions">
          <a href="/login" className="navbar__link">
            Login
          </a>

          <Link
            to="/assistente"
            className="button button--primary header__cta"
          >
            Começar agora
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
