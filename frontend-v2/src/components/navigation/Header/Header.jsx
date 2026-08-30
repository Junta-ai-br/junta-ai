import { Link, useNavigate } from "react-router-dom";

import Logo from "@/components/branding/logo";
import Navbar from "@/components/navigation/Navbar";
import ThemeSwitch from "../ThemeSwitch";

import { useTheme } from "@/contexts/useTheme";
import { THEMES } from "@/utils/theme";

import "./Header.css";

function Header() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  function handleLogoClick() {
    if (window.location.pathname === "/") {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });

      return;
    }

    navigate("/");
  }

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__brand">
          <button
            type="button"
            className="header__logo-button"
            onClick={handleLogoClick}
            aria-label="Voltar para o início"
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
          <ThemeSwitch />

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