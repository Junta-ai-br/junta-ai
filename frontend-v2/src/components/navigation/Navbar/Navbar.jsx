import { useState } from "react";
import { Menu, X } from "lucide-react";

import navigationItems from "./navigationItems";

import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  function handleToggle() {
    setIsOpen((current) => !current);
  }

  function handleClose() {
    setIsOpen(false);
  }

  return (
    <nav className="navbar" aria-label="Navegação principal">
      {/* Desktop */}
      <ul className="navbar__list">
        {navigationItems.map(({ href, label }) => (
          <li key={href}>
            <a href={href} className="navbar__link">
              {label}
            </a>
          </li>
        ))}
      </ul>

      {/* Mobile */}
      <button
        type="button"
        className={`navbar__menu-toggle ${
          isOpen ? "navbar__menu-toggle--open" : ""
        }`}
        onClick={handleToggle}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        {isOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
      </button>

      <div
        id="mobile-navigation"
        className={`navbar__mobile ${
          isOpen ? "navbar__mobile--open" : ""
        }`}
      >
        <ul className="navbar__mobile-list">
          {navigationItems.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="navbar__mobile-link"
                onClick={handleClose}
              >
                {label}
              </a>
            </li>
          ))}

          <li className="navbar__mobile-divider" />

          <li>
            <a
              href="/login"
              className="navbar__mobile-link"
              onClick={handleClose}
            >
              Login
            </a>
          </li>

          <li>
            <a
              href="/assistente"
              className="navbar__mobile-cta"
              onClick={handleClose}
            >
              Começar agora
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;