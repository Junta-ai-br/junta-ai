import "./Showcase.css";

export default function Showcase() {
  return (
    <section className="showcase" id="como-funciona">
      <div className="showcase__container">

        <header className="showcase__header">
          <span className="showcase__eyebrow">
            Como funciona
          </span>

          <h2 className="showcase__title">
            Uma conversa que
            <span>faz sentido para você.</span>
          </h2>
        </header>

        <div className="showcase__demo">
          <div className="showcase__placeholder">
            <span className="showcase__placeholder-label">
              Chat preview
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}