import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/useUser";
import { THEMES } from "@/utils/theme";
import logoHorizontalBranca from "@/assets/logos/logo-horizontal-branca.svg";
import logoHorizontalPreta from "@/assets/logos/logo-horizontal-preta.svg";
import ThemeSwitch from "@/components/navigation/ThemeSwitch";
import "@/pages/Assistente/Assistente.css";

export default function AuthHeader({ activePath = "/assistente" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { theme } = useTheme();
  const { profile } = useUser();
  const user = {
    name: profile.nome || profile.email?.split("@")[0] || "Usuário",
    avatar: profile.avatarUrl || null,
  };
  const logo = theme === THEMES.DARK ? logoHorizontalBranca : logoHorizontalPreta;

  useEffect(() => {
    const closeUserMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", closeUserMenu);
    return () => document.removeEventListener("mousedown", closeUserMenu);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };
  const linkClass = (path) => `assistant__nav-link${activePath === path ? " assistant__nav-link--active" : ""}`;

  return (
    <header className="assistant__navbar">
      <div className="assistant__navbar-inner">
        <Link to="/assistente" className="assistant__logo" aria-label="Junta.ai - Assistente" onClick={closeMenu}>
          <img src={logo} alt="Junta.ai" />
        </Link>
        <nav className={`assistant__navigation${isMenuOpen ? " assistant__navigation--open" : ""}`} aria-label="Navegação principal">
          <Link to="/assistente" className={linkClass("/assistente")} onClick={closeMenu}>Assistente</Link>
          <Link to="/dashboard" className={linkClass("/dashboard")} onClick={closeMenu}>Dashboard</Link>
          <Link to="/relatorios" className={linkClass("/relatorios")} onClick={closeMenu}>Relatórios</Link>
          <Link to="/perfil" className="assistant__nav-link assistant__nav-link--mobile-only" onClick={closeMenu}>Perfil</Link>
          <Link to="/" className="assistant__logout assistant__logout--mobile-only" onClick={handleLogout}><LogOut size={16} /><span>Sair</span></Link>
        </nav>
        <div className="assistant__navbar-actions">
          <ThemeSwitch />
          <div className="assistant__user-menu" ref={userMenuRef}>
            <button type="button" className={`assistant__user${isUserMenuOpen ? " assistant__user--open" : ""}`} aria-label={`Menu de ${user.name}`} aria-expanded={isUserMenuOpen} aria-haspopup="menu" onClick={() => setIsUserMenuOpen((current) => !current)}>
              {user.avatar ? <img src={user.avatar} alt="" className="assistant__user-avatar" referrerPolicy="no-referrer" /> : <span className="assistant__user-avatar assistant__user-avatar--placeholder">{user.name.charAt(0)}</span>}
              <span className="assistant__user-name">{user.name}</span>
              <ChevronDown size={16} />
            </button>
            {isUserMenuOpen && <div className="assistant__user-dropdown" role="menu" aria-label={`Opções de ${user.name}`}>
              <Link to="/perfil" className="assistant__user-dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>Perfil</Link>
              <Link to="/configuracoes" className="assistant__user-dropdown-item" role="menuitem" onClick={() => setIsUserMenuOpen(false)}>Configurações</Link>
              <div className="assistant__user-dropdown-divider" />
              <Link to="/" className="assistant__user-dropdown-item assistant__user-dropdown-item--logout" role="menuitem" onClick={handleLogout}><LogOut size={16} /><span>Sair</span></Link>
            </div>}
          </div>
          <button type="button" className="assistant__menu-toggle" aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((current) => !current)}>
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
