const STORAGE_KEY = "junta_planner_simulations";

export function loadPlannerSimulations() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const simulations = JSON.parse(raw);
  if (!Array.isArray(simulations)) {
    throw new Error("O histórico de simulações armazenado é inválido.");
  }
  return simulations;
}

// Falhas de leitura/escrita são propagadas: nunca sobrescrever dados ilegíveis.
export function savePlannerSimulation(simulation) {
  const simulations = loadPlannerSimulations();
  if (simulations.some((item) => item.id === simulation.id)) return simulation;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...simulations, simulation]));
  return simulation;
}
