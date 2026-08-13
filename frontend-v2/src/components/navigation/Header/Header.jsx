import Button from "@/components/common/Button";
import Logo from "@/components/branding/logo";
import Navbar from "@/components/navigation/Navbar";
import ThemeSwitch from "../ThemeSwitch";

import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/utils/theme";

import "./Header.css";

function Header() {
  const { theme } = useTheme();

  return (
    <header className="header">
      <div className="header__theme">
        <ThemeSwitch />
      </div>

      <div className="header__container">
        <div className="header__brand">
          <Logo
            variant="horizontal"
            wordmark={theme === THEMES.DARK ? "branca" : "preta"}
            width={200}
          />
        </div>

        <Navbar />

        <div className="header__actions">
          <a href="/login" className="navbar__link">
            Login
          </a>
          <Button variant="primary">Começar agora</Button>
        </div>
      </div>
    </header>
  );
}

export default Header;