import { Mail, ArrowUp } from "lucide-react";

import Logo from "@/components/branding/logo";

import { useTheme } from "@/contexts/ThemeContext";
import { THEMES } from "@/utils/theme";

import footerColumns from "./footerColumns";

import "./Footer.css";

function GithubIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.98 3.23 9.2 7.72 10.69.56.1.77-.24.77-.54 0-.27-.01-1.16-.01-2.11-3.14.68-3.8-1.34-3.8-1.34-.51-1.31-1.25-1.66-1.25-1.66-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.39-1.22.71-1.5-2.51-.28-5.15-1.25-5.15-5.58 0-1.23.44-2.24 1.16-3.03-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.12 1.16a10.9 10.9 0 0 1 5.68 0c2.17-1.46 3.12-1.16 3.12-1.16.61 1.57.23 2.73.11 3.02.72.79 1.16 1.8 1.16 3.03 0 4.34-2.65 5.3-5.17 5.58.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.78.54A11.03 11.03 0 0 0 23.02 11.52C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "GitHub", href: "https://github.com/Junta-ai-br/junta-ai", icon: GithubIcon },
  { label: "E-mail", href: "mailto:contato.junta.ai@gmail.com", icon: Mail },
];

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo
              variant="horizontal"
              wordmark={theme === THEMES.DARK ? "branca" : "preta"}
              width={160}
            />

            <p className="footer__tagline">
              Seu assistente financeiro inteligente que entende você e
              transforma números em tranquilidade.
            </p>

            <div className="footer__socials">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="footer__social-link"
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon size={18} strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          <nav className="footer__columns" aria-label="Links do rodapé">
            {footerColumns.map(({ title, links }) => (
              <div className="footer__column" key={title}>
                <span className="footer__column-title">{title}</span>

                <ul className="footer__column-list">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <a href={href} className="footer__column-link">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            © 2026 Junta.ai. Todos os direitos reservados.
          </p>

          <button
            type="button"
            className="footer__back-to-top"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
          >
            <ArrowUp size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;