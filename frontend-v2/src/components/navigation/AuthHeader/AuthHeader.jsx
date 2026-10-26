import { revokeRefreshToken } from "@/services/auth/logout";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

import { useTheme } from "@/contexts/useTheme";
import { useUser } from "@/contexts/useUser";
import { THEMES } from "@/utils/theme";
import logoHorizontalBranca from "@/assets/logos/logo-horizontal-branca.svg";
import logoHorizontalPreta from "@/assets/logos/logo-horizontal-preta.svg";
import ThemeSwitch from "@/components/navigation/ThemeSwitch";
import DateRangeFilter from "@/pages/VisaoMes/DateRangeFilter";
import styles from "./AuthHeader.module.css";

export default function AuthHeader({
  activePath = "/assistente",
  variant = "default",
  dateRange = null,
  onDateRangeChange = null,
  onAddCategory = null,
  allowAllPeriod = true,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const menuToggleRef = useRef(null);
  const navigationId = useId();
  const { theme } = useTheme();
  const { profile, endSession } = useUser();
  const user = {
    name: profile?.nome || profile?.email?.split("@")[0] || "Usuário",
    avatar: profile?.avatarUrl || null,
  };
  const logo = theme === THEMES.DARK ? logoHorizontalBranca : logoHorizontalPreta;
  const isFinanceVariant = variant === "finance";
  const financeTokens = {
    surface: "var(--surface)",
    border: "var(--border)",
    text: "var(--text-primary)",
    textMuted: "var(--text-secondary)",
    inputBg: "var(--surface-elevated)",
  };

  useEffect(() => {
    const closeUserMenu = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        if (menuToggleRef.current?.getAttribute("aria-expanded") === "true") menuToggleRef.current.focus();
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeUserMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeUserMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    revokeRefreshToken();
    endSession();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };
  const linkClass = (path) => `${styles.navLink}${activePath === path ? ` ${styles.navLinkActive}` : ""}`;

  return (
    <header className={`${styles.navbar}${isFinanceVariant ? ` ${styles.navbarFinance}` : ""}`}>
      <div className={styles.navbarInner}>
        <Link to="/assistente" className={styles.logo} aria-label="Junta.ai - Assistente" onClick={closeMenu}>
          <img src={logo} alt="Junta.ai" />
        </Link>

        <nav id={navigationId} className={`${styles.navigation}${isMenuOpen ? ` ${styles.navigationOpen}` : ""}`} aria-label="Navegação principal">
          <Link to="/assistente" className={linkClass("/assistente")} aria-current={activePath === "/assistente" ? "page" : undefined} onClick={closeMenu}>Assistente</Link>
          <Link to="/dashboard" className={linkClass("/dashboard")} aria-current={activePath === "/dashboard" ? "page" : undefined} onClick={closeMenu}>Dashboard</Link>
          <Link to="/planejador" className={linkClass("/planejador")} aria-current={activePath === "/planejador" ? "page" : undefined} onClick={closeMenu}>Planejador</Link>
          <Link to="/relatorios" className={linkClass("/relatorios")} aria-current={activePath === "/relatorios" ? "page" : undefined} onClick={closeMenu}>Relatórios</Link>
          <Link to="/perfil" className={`${styles.navLink} ${styles.navLinkMobileOnly}`} onClick={closeMenu}>Perfil</Link>
          <Link to="/" className={`${styles.logout} ${styles.logoutMobileOnly}`} onClick={handleLogout}><LogOut size={16} /><span>Sair</span></Link>
        </nav>

        {isFinanceVariant && (
            <div className={styles.financeActions}>
              {onAddCategory && (
                <button
                  type="button"
                  onClick={onAddCategory}
                  className={styles.categoryButton}
                >
                  ＋ Categoria
                </button>
              )}

              {onDateRangeChange && (
                <DateRangeFilter value={dateRange} onChange={onDateRangeChange} tokens={financeTokens} allowAllPeriod={allowAllPeriod} />
              )}
            </div>
          )}

        <div className={styles.navbarActions}>
          <ThemeSwitch />

          <div className={styles.userMenu} ref={userMenuRef}>
            <button type="button" className={`${styles.user}${isUserMenuOpen ? ` ${styles.userOpen}` : ""}`} aria-label={`Menu de ${user.name}`} aria-expanded={isUserMenuOpen} aria-haspopup="menu" onClick={() => setIsUserMenuOpen((current) => !current)}>
              {user.avatar ? <img src={user.avatar} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" /> : <span className={`${styles.userAvatar} ${styles.userAvatarPlaceholder}`}>{user.name.charAt(0)}</span>}
              <span className={styles.userName}>{user.name}</span>
              <ChevronDown size={16} />
            </button>
            {isUserMenuOpen && <div className={styles.userDropdown} role="menu" aria-label={`Opções de ${user.name}`}>
              <Link to="/perfil" className={styles.userDropdownItem} role="menuitem" onClick={() => setIsUserMenuOpen(false)}>Perfil</Link>
              <div className={styles.userDropdownDivider} />
              <Link to="/" className={`${styles.userDropdownItem} ${styles.userDropdownLogout}`} role="menuitem" onClick={handleLogout}><LogOut size={16} /><span>Sair</span></Link>
            </div>}
          </div>

          <button type="button" ref={menuToggleRef} className={styles.menuToggle} aria-controls={navigationId} aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((current) => !current)}>
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
