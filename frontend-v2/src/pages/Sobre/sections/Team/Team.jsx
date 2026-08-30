import teamMembers from "./teamMembers";

import "./Team.css";

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.98 3.23 9.2 7.72 10.69.56.1.77-.24.77-.54 0-.27-.01-1.16-.01-2.11-3.14.68-3.8-1.34-3.8-1.34-.51-1.31-1.25-1.66-1.25-1.66-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.94.1-.73.39-1.22.71-1.5-2.51-.28-5.15-1.25-5.15-5.58 0-1.23.44-2.24 1.16-3.03-.12-.29-.5-1.45.11-3.02 0 0 .95-.3 3.12 1.16a10.9 10.9 0 0 1 5.68 0c2.17-1.46 3.12-1.16 3.12-1.16.61 1.57.23 2.73.11 3.02.72.79 1.16 1.8 1.16 3.03 0 4.34-2.65 5.3-5.17 5.58.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.78.54A11.03 11.03 0 0 0 23.02 11.52C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}

function TeamCard({ member, featured = false }) {
  const { name, role, avatar, linkedin, github } = member;

  return (
    <article
      className={`team-card${featured ? " team-card--featured" : ""}`}
    >
      <div className="team-card__avatar-wrapper">
        <img
          className="team-card__avatar"
          src={avatar}
          alt={`Avatar de ${name}`}
          width={112}
          height={112}
          loading="lazy"
        />
      </div>

      <div className="team-card__content">
        <h3 className="team-card__name">{name}</h3>

        <p className="team-card__role">{role}</p>
      </div>

      <div className="team-card__links">
        <a
          href={linkedin}
          className="team-card__link"
          aria-label={`LinkedIn de ${name}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LinkedinIcon width={16} height={16} aria-hidden="true" />
        </a>

        <a
          href={github}
          className="team-card__link"
          aria-label={`GitHub de ${name}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubIcon width={16} height={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function Team() {
  const featuredMembers = teamMembers.slice(0, 3);

  const regularMembers = [...teamMembers.slice(3)].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", {
      sensitivity: "base",
    }),
  );

  return (
    <section className="team" id="equipe">
      <div className="team__container">
        <header className="team__intro">
          <span className="team__eyebrow">Nossa equipe</span>

          <h2 className="team__title">Quem faz o Junta.ai acontecer</h2>

          <p className="team__description">
            Cada pessoa contribui com diferentes habilidades para transformar
            a ideia em produto.
          </p>
        </header>

        <div className="team__featured">
          {featuredMembers.map((member) => (
            <TeamCard
              key={member.name}
              member={member}
              featured
            />
          ))}
        </div>

        <div className="team__members">
          {regularMembers.map((member) => (
            <TeamCard
              key={member.name}
              member={member}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Team;