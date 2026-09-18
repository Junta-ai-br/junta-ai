import { Heart, User } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

import "./Feedback.css";

function Feedback() {
  return (
    <section className="feedback" id="feedback">
      <div className="feedback__container">
        <div className="feedback__chat">
          <div className="feedback__message">
            <span className="feedback__avatar">
              <User size={16} strokeWidth={1.8} />
            </span>

            <span className="feedback__bubble">
              Amei a categorização automática!
            </span>
          </div>

          <span className="feedback__heart">
            <Heart size={16} strokeWidth={1.8} fill="currentColor" />
          </span>

          <div className="feedback__message">
            <span className="feedback__avatar">
              <User size={16} strokeWidth={1.8} />
            </span>

            <span className="feedback__bubble">
              Seria incrível ter relatórios semanais.
            </span>
          </div>
        </div>

        <div className="feedback__content">
          <span className="feedback__eyebrow">
            O Junta.ai cresce com você
          </span>

          <h2 className="feedback__title">
            Cada feedback nos ajuda a evoluir juntos.
          </h2>

          <p className="feedback__description">
            Quanto mais a gente entende sua experiência, melhor conseguimos
            cuidar do que realmente importa.
          </p>

          <Link to="/feedback">
            <Button variant="secondary" className="feedback__button">
              Enviar um feedback →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Feedback;