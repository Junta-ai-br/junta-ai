// Fictional, presentation-only examples. Never sent to product services.
export const DEMO_SCENES = [
  {
    id: "transport",
    label: "Consulta financeira",
    user: "Quanto gastei com transporte este mês?",
    assistant: "Você gastou R$ 320,00 com transporte neste mês. 🚗 Quer comparar com o mês passado?",
    card: "Transporte — R$ 320,00",
  },
  {
    id: "lunch",
    label: "Registro de despesa",
    user: "Gastei R$ 28,50 no almoço hoje.",
    assistant: "Prontinho! Registrei R$ 28,50 em alimentação. 🍽️",
    card: "Despesa registrada — Alimentação — R$ 28,50",
  },
];

// Window, user message, typing, response, reading pause, scene exit.
export const DEMO_PHASE_MS = [500, 800, 1300, 650, 6500, 400];
