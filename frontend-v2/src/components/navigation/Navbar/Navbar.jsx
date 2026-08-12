import navigationItems from "./navigationItems";

import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar" aria-label="Navegação principal">
      <ul className="navbar__list">
        {navigationItems.map(({ href, label }) => (
          <li key={href}>
            <a href={href} className="navbar__link">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;