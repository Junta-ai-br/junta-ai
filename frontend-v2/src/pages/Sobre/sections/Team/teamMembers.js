// Avatares gerados automaticamente (DiceBear) — sem fotos reais.
// Troque a "seed" se quiser gerar uma variação diferente para a mesma pessoa.
function avatarUrl(seed) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundType=gradientLinear`;
}

const teamMembers = [
  {
    name: "Danieli Dutra",
    role: "Liderança • PO • UX/UI • IA • Docs",
    avatar: avatarUrl("Danieli Dutra"),
    linkedin: "https://www.linkedin.com/in/danieli-dutra",
    github: "https://github.com/danieli-dutra",
  },
  {
    name: "Artur Alejandro",
    role: "Desenvolvimento",
    avatar: avatarUrl("Artur Alejandro"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Caio Firmino",
    role: "Desenvolvimento",
    avatar: avatarUrl("Caio Firmino"),
    linkedin: "https://www.linkedin.com/in/caio-firmino-115344236/",
    github: "https://github.com/ocaiofirmino",
  },
  {
    name: "Daniel Ferreira",
    role: "MCP • Agentes • Integração",
    avatar: avatarUrl("Daniel Ferreira"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Jordan Fischer",
    role: "Back-end",
    avatar: avatarUrl("Jordan Fischer"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Larissa Gama",
    role: "Segurança • Consultoria • Docs",
    avatar: avatarUrl("Larissa Gama"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Maria Eduarda",
    role: "Design",
    avatar: avatarUrl("Maria Eduarda"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Renan Estrela",
    role: "Front-end",
    avatar: avatarUrl("Renan Estrela"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Robert Melo",
    role: "Back-end",
    avatar: avatarUrl("Robert Melo"),
    linkedin: "#",
    github: "#",
  },
  {
    name: "Thais Rodrigues",
    role: "Dashboards • Dados",
    avatar: avatarUrl("Thais Rodrigues"),
    linkedin: "#",
    github: "#",
  },
];

export default teamMembers;
