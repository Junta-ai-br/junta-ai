import { useEffect, useRef, useState } from "react";
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
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { theme } = useTheme();
  const { profile } = useUser();
  const user = {
    name: profile?.nome || profile?.email?.split("@")[0] || "Usuário",
    avatar: profile?.avatarUrl || null,
  };
  const logo = theme === THEMES.DARK ? logoHorizontalBranca : logoHorizontalPreta;
  const isFinanceVariant = variant === "finance";
  const financeTokens = {
    surface: theme === THEMES.DARK ? "#111827" : "#ffffff",
    border: theme === THEMES.DARK ? "#2d3748" : "#e5e7eb",
    text: theme === THEMES.DARK ? "#f3f4f6" : "#111827",
    textMuted: theme === THEMES.DARK ? "#cbd5e1" : "#4b5563",
    inputBg: theme === THEMES.DARK ? "#0f172a" : "#f3f4f6",
  };

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
  const linkClass = (path) => `${styles.navLink}${activePath === path ? ` ${styles.navLinkActive}` : ""}`;

  return (
    <header className={styles.navbar}>
      <div className={styles.navbarInner}>
        <Link to="/assistente" className={styles.logo} aria-label="Junta.ai - Assistente" onClick={closeMenu}>
          <img src={logo} alt="Junta.ai" />
        </Link>

        <nav className={`${styles.navigation}${isMenuOpen ? ` ${styles.navigationOpen}` : ""}`} aria-label="Navegação principal">
          <Link to="/assistente" className={linkClass("/assistente")} onClick={closeMenu}>Assistente</Link>
          <Link to="/dashboard" className={linkClass("/dashboard")} onClick={closeMenu}>Dashboard</Link>
          <Link to="/relatorios" className={linkClass("/relatorios")} onClick={closeMenu}>Relatórios</Link>
          <Link to="/perfil" className={`${styles.navLink} ${styles.navLinkMobileOnly}`} onClick={closeMenu}>Perfil</Link>
          <Link to="/" className={`${styles.logout} ${styles.logoutMobileOnly}`} onClick={handleLogout}><LogOut size={16} /><span>Sair</span></Link>
        </nav>

        <div className={styles.navbarActions}>
          {isFinanceVariant && (
            <div className={styles.financeActions}>
              {onAddCategory && (
                <button
                  type="button"
                  onClick={onAddCategory}
                  className={styles.categoryButton}
                  style={{ "--finance-border": financeTokens.border, "--finance-text": financeTokens.text }}
                >
                  ＋ Categoria
                </button>
              )}

              {onDateRangeChange && (
                <DateRangeFilter value={dateRange} onChange={onDateRangeChange} tokens={financeTokens} />
              )}
            </div>
          )}

          <ThemeSwitch />

          <div className={styles.userMenu} ref={userMenuRef}>
            <button type="button" className={`${styles.user}${isUserMenuOpen ? ` ${styles.userOpen}` : ""}`} aria-label={`Menu de ${user.name}`} aria-expanded={isUserMenuOpen} aria-haspopup="menu" onClick={() => setIsUserMenuOpen((current) => !current)}>
              {user.avatar ? <img src={user.avatar} alt="" className={styles.userAvatar} referrerPolicy="no-referrer" /> : <span className={`${styles.userAvatar} ${styles.userAvatarPlaceholder}`}>{user.name.charAt(0)}</span>}
              <span className={styles.userName}>{user.name}</span>
              <ChevronDown size={16} />
            </button>
            {isUserMenuOpen && <div className={styles.userDropdown} role="menu" aria-label={`Opções de ${user.name}`}>
              <Link to="/perfil" className={styles.userDropdownItem} role="menuitem" onClick={() => setIsUserMenuOpen(false)}>Perfil</Link>
              <Link to="/configuracoes" className={styles.userDropdownItem} role="menuitem" onClick={() => setIsUserMenuOpen(false)}>Configurações</Link>
              <div className={styles.userDropdownDivider} />
              <Link to="/" className={`${styles.userDropdownItem} ${styles.userDropdownLogout}`} role="menuitem" onClick={handleLogout}><LogOut size={16} /><span>Sair</span></Link>
            </div>}
          </div>

          <button type="button" className={styles.menuToggle} aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((current) => !current)}>
            {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}
