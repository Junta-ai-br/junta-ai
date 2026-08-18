export type TransactionType = 'expense' | 'income' | 'goal_contribution';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
  goalId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  monthlyIncome?: number;
  objective?: string;
  onboarded: boolean;
}

export interface RecurringMeta {
  // User-confirmed baseline amount (overrides computed median)
  baseline?: number;
  // User confirmed this pattern should be remembered as recurring
  confirmed?: boolean;
  // YYYY-MM when we last surfaced the "save as recurring" prompt
  candidatePromptMonth?: string;
  // YYYY-MM of the last month we surfaced a "register again" suggestion
  suggestedMonth?: string;
  // YYYY-MM when the user dismissed the suggestion (don't reprompt same month)
  dismissed?: string;
  // YYYY-MM when we last asked to update the baseline value
  updatePromptMonth?: string;
}

export interface FinanceState {
  transactions: Transaction[];
  goals: Goal[];
  user: UserProfile;
  // Tracks IDs of pending savings suggestions already shown this month so we don't repeat
  shownSavingsSuggestionMonth?: string;
  // Per-signature recurring memory (see src/lib/recurring.ts)
  recurring?: Record<string, RecurringMeta>;
}

export const CATEGORIES = [
  'Alimentação',
  'Mercado',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Streaming',
  'Compras Online',
  'Apostas',
  'Outros',
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🍔',
  'Mercado': '🛒',
  'Transporte': '🚗',
  'Moradia': '🏠',
  'Lazer': '🎮',
  'Saúde': '💊',
  'Educação': '📚',
  'Assinaturas': '📱',
  'Streaming': '🎬',
  'Compras Online': '📦',
  'Apostas': '🎲',
  'Outros': '📦',
  'Salário': '💰',
  'Renda': '💵',
  'Bônus': '🎁',
  'Reembolso': '↩️',
  'Pix Recebido': '⚡',
  'Renda Extra': '💼',
  'Ganhos Eventuais': '🍀',
  'Outros Ganhos': '✨',
  'Meta': '🎯',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': 'hsl(20, 80%, 55%)',
  'Mercado': 'hsl(95, 55%, 45%)',
  'Transporte': 'hsl(200, 70%, 50%)',
  'Moradia': 'hsl(152, 55%, 45%)',
  'Lazer': 'hsl(280, 60%, 60%)',
  'Saúde': 'hsl(340, 65%, 55%)',
  'Educação': 'hsl(38, 90%, 55%)',
  'Assinaturas': 'hsl(180, 50%, 50%)',
  'Streaming': 'hsl(258, 65%, 60%)',
  'Compras Online': 'hsl(220, 70%, 60%)',
  'Apostas': 'hsl(0, 70%, 55%)',
  'Outros': 'hsl(240, 5%, 50%)',
};

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function getBalance(state: FinanceState): number {
  return state.transactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount;
    // expenses and goal contributions both reduce available balance
    return acc - t.amount;
  }, 0);
}

export function getMonthlyTotals(state: FinanceState) {
  const month = currentMonth();
  const monthTx = state.transactions.filter(t => t.date.startsWith(month));
  const income = monthTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const savings = monthTx.filter(t => t.type === 'goal_contribution').reduce((a, t) => a + t.amount, 0);
  return { income, expenses, savings, balance: income - expenses - savings };
}

export function getCategoryTotals(state: FinanceState) {
  const month = currentMonth();
  const monthExpenses = state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(month));
  const totals: Record<string, number> = {};
  monthExpenses.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  const totalSum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalSum > 0 ? (total / totalSum) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getCategoryTotal(state: FinanceState, category: string): number {
  const month = currentMonth();
  return state.transactions
    .filter(t => t.type === 'expense' && t.category === category && t.date.startsWith(month))
    .reduce((a, t) => a + t.amount, 0);
}

// ---- Financial Health Score (deterministic) ----
export interface HealthScore {
  score: number;
  status: 'healthy' | 'attention' | 'critical';
  label: string;
  emoji: string;
  message: string;
}

export function computeHealthScore(state: FinanceState): HealthScore {
  const month = currentMonth();
  const monthTx = state.transactions.filter(t => t.date.startsWith(month));
  const income = monthTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = monthTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const savings = monthTx.filter(t => t.type === 'goal_contribution').reduce((a, t) => a + t.amount, 0);
  const balance = income - expenses - savings;
  const activeGoals = state.goals.filter(g => g.currentAmount < g.targetAmount).length;
  const ratio = income > 0 ? expenses / income : expenses > 0 ? 1.5 : 0;

  const gamblingRegex = /\b(aposta|apostei|apostar|bet|bets|cassino|loteria|raspadinha)\b/i;
  const gamblingCount = monthTx.filter(
    t => t.type === 'expense' && gamblingRegex.test(t.description),
  ).length;

  const nonEssential = monthTx
    .filter(t => t.type === 'expense' && (t.category === 'Lazer' || t.category === 'Compras Online'))
    .reduce((a, t) => a + t.amount, 0);
  const nonEssentialRatio = expenses > 0 ? nonEssential / expenses : 0;

  let score = 50;
  if (balance > 0) score += 15;
  if (savings > 0) score += 15;
  if (activeGoals > 0) score += 10;
  if (income > 0 && ratio < 0.7) score += 20;
  if (income > 0 && ratio > 0.9) score -= 20;
  if (gamblingCount >= 2) score -= 15;
  if (nonEssentialRatio > 0.4) score -= 10;
  if (balance < 0) score -= 25;

  score = Math.max(0, Math.min(100, score));

  let status: HealthScore['status'];
  let label: string;
  let emoji: string;
  if (score >= 70) { status = 'healthy'; label = 'Saudável'; emoji = '🟢'; }
  else if (score >= 40) { status = 'attention'; label = 'Atenção'; emoji = '🟠'; }
  else { status = 'critical'; label = 'Crítica'; emoji = '🔴'; }

  // Dynamic message based on dominant signal
  const topCategory = (() => {
    const totals: Record<string, number> = {};
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const total = sorted.reduce((a, [, v]) => a + v, 0);
    return { category: sorted[0][0], amount: sorted[0][1], share: total > 0 ? sorted[0][1] / total : 0 };
  })();

  let message: string;
  if (monthTx.length === 0) {
    message = 'Registre suas movimentações para acompanhar sua saúde financeira.';
  } else if (balance < 0) {
    message = 'Você gastou mais do que ganhou neste período.';
  } else if (income > 0 && ratio > 0.9) {
    message = 'Despesas já passaram de 90% da sua renda neste mês.';
  } else if (gamblingCount >= 2) {
    message = 'Atividade recorrente em apostas detectada. Vale acompanhar esse comportamento.';
  } else if (topCategory && topCategory.category === 'Moradia' && topCategory.share > 0.4) {
    message = 'Moradia representa uma parte significativa dos custos mensais.';
  } else if (nonEssentialRatio > 0.4) {
    message = 'Gastos não essenciais cresceram neste mês.';
  } else if (savings > 0 && balance > 0) {
    message = 'Despesas sob controle. Continue fortalecendo suas metas.';
  } else if (income > 0 && ratio < 0.7) {
    message = 'Você está mantendo equilíbrio financeiro este mês.';
  } else {
    message = 'Situação estável. Pequenos ajustes podem te levar mais longe.';
  }

  return { score, status, label, emoji, message };
}

export function explainFinancialHealth(state: FinanceState): string {
  const hs = computeHealthScore(state);
  const { income, expenses, savings } = getMonthlyTotals(state);
  const balance = income - expenses - savings;
  const ratio = income > 0 ? expenses / income : 0;
  const cats = getCategoryTotals(state);
  const top = cats[0];
  const monthTx = state.transactions.filter(t => t.date.startsWith(currentMonth()));
  const gambling = monthTx.filter(t => t.type === 'expense' && /\b(aposta|apostei|bet|cassino|loteria|raspadinha)\b/i.test(t.description)).length;

  if (monthTx.length === 0) {
    return 'Ainda não tenho movimentações suficientes este mês para avaliar sua saúde financeira. Registra alguns gastos e receitas que eu te mostro.';
  }

  let headline: string;
  if (hs.score >= 80) headline = `Sua saúde financeira está forte (${hs.score}/100).`;
  else if (hs.score >= 60) headline = `Sua saúde financeira está estável, mas merece atenção (${hs.score}/100).`;
  else if (hs.score >= 40) headline = `Sua saúde financeira está em atenção (${hs.score}/100).`;
  else headline = `Sua saúde financeira precisa de atenção imediata (${hs.score}/100).`;

  const reasons: string[] = [];
  if (balance < 0) reasons.push(`os gastos superaram a renda em R$${Math.abs(balance).toFixed(2)}`);
  else if (income > 0 && ratio > 0.9) reasons.push(`as despesas consomem ${Math.round(ratio * 100)}% da renda do mês`);
  else if (income > 0 && ratio < 0.7) reasons.push(`as despesas estão em ${Math.round(ratio * 100)}% da renda — boa folga`);
  if (gambling >= 2) reasons.push(`há ${gambling} lançamentos de apostas neste mês`);
  if (top && top.percentage > 40) reasons.push(`${top.category} concentra ${Math.round(top.percentage)}% dos gastos`);
  if (savings > 0) reasons.push(`você já guardou R$${savings.toFixed(2)} para metas`);

  const tail = reasons.length > 0 ? ` Isso porque ${reasons.join('; ')}.` : '';
  return `${headline}${tail}`;
}

// Generates a focus-specific health response so the assistant doesn't repeat
// the same wording for "estou gastando muito?", "como estou financeiramente?"
// and "como está minha saúde financeira?". All variants reflect the CURRENT
// MONTH only.
export function explainFinancialHealthByFocus(
  state: FinanceState,
  focus: 'spending' | 'overall' | 'situation',
): string {
  const hs = computeHealthScore(state);
  const { income, expenses, savings } = getMonthlyTotals(state);
  const balance = income - expenses - savings;
  const ratio = income > 0 ? expenses / income : 0;
  const cats = getCategoryTotals(state);
  const top = cats[0];
  const monthTx = state.transactions.filter(t => t.date.startsWith(currentMonth()));

  if (monthTx.length === 0) {
    return 'Ainda não tenho movimentações suficientes este mês pra avaliar. Registra alguns gastos e receitas que eu te respondo com base nos seus números.';
  }

  if (focus === 'spending') {
    const lines: string[] = [];
    if (income > 0) {
      const pct = Math.round(ratio * 100);
      if (ratio > 0.9) lines.push(`Sim — suas despesas já consomem ${pct}% da sua renda deste mês.`);
      else if (ratio > 0.7) lines.push(`Você está num ritmo moderado: ${pct}% da renda já foi pra gastos.`);
      else lines.push(`Não, no momento seus gastos estão em ${pct}% da renda — ainda há folga.`);
    } else {
      lines.push(`Você gastou R$${expenses.toFixed(2)} este mês. Sem receita registrada ainda, fica difícil dizer se é muito.`);
    }
    if (top && top.percentage > 35) {
      lines.push(`O peso maior está em ${top.category} (${Math.round(top.percentage)}% dos gastos).`);
    }
    return lines.join(' ');
  }

  if (focus === 'overall') {
    const headline =
      hs.score >= 80 ? `Sua saúde financeira está forte: ${hs.score}/100.`
      : hs.score >= 60 ? `Sua saúde financeira está estável: ${hs.score}/100.`
      : hs.score >= 40 ? `Sua saúde financeira está em atenção: ${hs.score}/100.`
      : `Sua saúde financeira precisa de cuidado: ${hs.score}/100.`;
    const detail =
      balance < 0 ? `Os gastos superaram a renda em R$${Math.abs(balance).toFixed(2)}.`
      : income > 0 && ratio > 0.9 ? `Despesas em ${Math.round(ratio * 100)}% da renda do mês.`
      : savings > 0 ? `Você já guardou R$${savings.toFixed(2)} pra metas neste mês.`
      : income > 0 ? `Renda R$${income.toFixed(2)} e despesas R$${expenses.toFixed(2)}.`
      : `Despesas registradas: R$${expenses.toFixed(2)}.`;
    return `${headline} ${detail}`;
  }

  // 'situation' — current state + a next step
  const summary =
    balance >= 0
      ? `Este mês você tem R$${income.toFixed(2)} de entradas e R$${expenses.toFixed(2)} de saídas, com saldo positivo de R$${balance.toFixed(2)}.`
      : `Este mês as saídas (R$${expenses.toFixed(2)}) superaram as entradas (R$${income.toFixed(2)}).`;
  let next: string;
  if (balance < 0) next = 'Próximo passo: identificar 1 ou 2 gastos não essenciais pra cortar nas próximas semanas.';
  else if (top && top.percentage > 40) next = `Próximo passo: revisar ${top.category}, que concentra ${Math.round(top.percentage)}% dos gastos.`;
  else if (savings === 0 && state.goals.length > 0) next = 'Próximo passo: separar um valor pequeno pra alguma meta antes do fim do mês.';
  else next = 'Continua firme — segue acompanhando seus gastos por categoria.';
  return `${summary} ${next}`;
}


// ---- NLP Parsing ----

export type ParsedIntent =
  | { kind: 'transaction'; type: 'expense' | 'income'; amount: number; category: string; description: string }
  | { kind: 'transaction_pending_category'; amount: number; description: string }
  | { kind: 'goal_contribution'; amount: number; goalHint: string | null; description: string }
  | { kind: 'create_goal'; amount: number; goalName: string; description: string };

// Deterministic merchant + keyword mapping.
// Order matters: first match wins. Place more specific categories first
// so phrases like "internet 99,90" map to Moradia (not Transporte) and
// "99 food" maps to Alimentação (not Transporte).
export const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'Streaming', keywords: [
    'netflix', 'amazon prime', 'prime video', 'spotify', 'disney+', 'disney plus',
    'hbo max', 'hbo', 'globoplay', 'deezer', 'youtube premium', 'apple music',
    'paramount', 'crunchyroll', ' max ',
  ]},
  { category: 'Moradia', keywords: [
    'aluguel', 'condomínio', 'condominio', 'conta de luz', 'conta de água', 'conta de agua',
    'luz', 'água', 'agua', 'energia', 'internet', 'wi-fi', 'wifi',
    'vivo fibra', 'claro fibra', 'tim fibra', 'oi fibra',
    'gás', 'gas', 'iptu',
  ]},
  { category: 'Saúde', keywords: [
    'farmácia', 'farmacia', 'remédio', 'remedio', 'médico', 'medico', 'consulta',
    'dentista', 'psicólogo', 'psicologo', 'academia', 'exame',
    'plano de saúde', 'drogasil', 'pague menos', 'drogaria',
  ]},
  { category: 'Apostas', keywords: [
    'aposta esportiva', 'aposta', 'apostei', 'bet365', 'betano', 'sportingbet',
    'pixbet', 'blaze', 'cassino', ' bet ', 'na bet', 'loteria', 'raspadinha',
  ]},
  { category: 'Mercado', keywords: [
    'supermercado', 'mercado livre', 'hortifruti', 'açougue', 'acougue', 'feira',
    'mercearia', 'carrefour', 'extra', 'assaí', 'assai', 'atacadão', 'atacadao',
    'guanabara', 'prezunic', 'pão de açúcar', 'pao de acucar', 'mercado',
  ]},
  { category: 'Alimentação', keywords: [
    '99 food', '99food', 'ifood', 'rappi', 'delivery',
    'restaurante', 'sushi', 'pizzaria', 'pizza', 'hamburgueria', 'hamburguer', 'hambúrguer', 'burger',
    'lanchonete', 'lanche', 'pastelaria', 'pastel', 'cafeteria', 'café', 'cafe',
    'padaria', 'conveniência', 'conveniencia', 'açaí', 'acai', 'açai', 'sorveteria',
    'marmita', 'self service', 'almoço', 'almoco', 'jantar', 'comida',
    'refeição', 'refeicao', 'fast food',
    "mc donald's", 'mc donalds', 'mcdonalds', "mc donald", 'burger king', ' bk ',
    'subway', "bob's", 'bobs', 'habibs', "habib's",
  ]},
  { category: 'Educação', keywords: [
    'faculdade', 'mensalidade', 'udemy', 'alura', ' dio ', 'livro', 'ebook',
    'treinamento', 'bootcamp', 'certificado', 'curso', 'aula', 'escola',
  ]},
  { category: 'Transporte', keywords: [
    'mototaxi', 'moto taxi', 'uber', 'táxi', 'taxi', '99pop',
    'corrida', 'ônibus', 'onibus', 'metrô', 'metro', 'trem',
    'pedágio', 'pedagio', 'estacionamento', 'posto', 'gasolina',
    'álcool', 'alcool', 'etanol', 'diesel', 'gnv',
    'abasteci', 'abastecimento', 'combustível', 'combustivel',
    'shell', 'ipiranga', 'petrobras',
  ]},
  { category: 'Compras Online', keywords: [
    'shopee', 'shein', 'aliexpress', 'magalu', 'magazine luiza', 'amazon',
    'compra online', 'shopping',
  ]},
  { category: 'Lazer', keywords: [
    'cinema', 'bar', 'balada', 'show', 'jogo', 'passeio', 'festa', 'parque',
  ]},
  { category: 'Assinaturas', keywords: ['assinatura', 'plano'] },
];

function detectCategory(text: string): string | null {
  const lower = ` ${text.toLowerCase()} `;
  // Special case: standalone "99" → Transporte ride, but only if "99 food"/"99food"
  // is NOT present (handled via Alimentação keyword first below).
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  // Bare "99" as a standalone token → Transporte (e.g., "peguei um 99")
  if (/\b99\b/.test(lower) && !/99\s?food/.test(lower)) {
    // Only when "99" looks like the ride app, not part of an amount like 99,90
    if (/\b99\b(?!\s*[,\.]\d)/.test(lower)) return 'Transporte';
  }
  return null;
}

// Categories suggested when we ask the user (low confidence)
export const SUGGESTED_PICK_CATEGORIES = [
  'Alimentação', 'Mercado', 'Moradia', 'Transporte', 'Saúde',
  'Streaming', 'Educação', 'Compras Online', 'Lazer', 'Apostas', 'Outros',
];

// Resolve a free-text user reply (e.g. "alimentação", "mercado", "internet")
// into one of the SUGGESTED_PICK_CATEGORIES. Used when answering a pending
// category clarification with plain text rather than a quick-action button.
export function resolveCategoryFromText(text: string): string | null {
  const lower = text.toLowerCase().trim();
  if (!lower) return null;
  const stripped = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // 1) Direct match against suggested categories (with/without accents)
  for (const cat of SUGGESTED_PICK_CATEGORIES) {
    const c = cat.toLowerCase();
    const cs = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower === c || stripped === cs || lower.includes(c) || stripped.includes(cs)) {
      return cat;
    }
  }
  // 2) Keyword alias (mercado→Alimentação? No: Mercado is its own. farmácia→Saúde, internet→Moradia)
  const detected = detectCategory(lower);
  if (detected && SUGGESTED_PICK_CATEGORIES.includes(detected)) return detected;
  return null;
}

// Merchant/keyword → canonical category map used during CORRECTIONS.
// Critical: merchant names like "mercado" must normalize to "Alimentação"
// and never be saved raw as a category.
const CORRECTION_ALIAS_MAP: Record<string, string> = {
  // Alimentação
  'alimentacao': 'Alimentação', 'alimentação': 'Alimentação', 'comida': 'Alimentação',
  'mercado': 'Alimentação', 'mercadinho': 'Alimentação', 'supermercado': 'Alimentação',
  'padaria': 'Alimentação', 'cafeteria': 'Alimentação', 'lanchonete': 'Alimentação',
  'pizzaria': 'Alimentação', 'pizza': 'Alimentação', 'sushi': 'Alimentação',
  'restaurante': 'Alimentação', 'hamburgueria': 'Alimentação', 'pastelaria': 'Alimentação',
  'conveniencia': 'Alimentação', 'conveniência': 'Alimentação',
  '99 food': 'Alimentação', 'ifood': 'Alimentação', 'delivery': 'Alimentação',
  // Transporte
  'transporte': 'Transporte', 'uber': 'Transporte', '99': 'Transporte',
  'gasolina': 'Transporte', 'combustivel': 'Transporte', 'combustível': 'Transporte',
  'abastecimento': 'Transporte', 'posto': 'Transporte', 'gnv': 'Transporte',
  'moto taxi': 'Transporte', 'mototaxi': 'Transporte', 'onibus': 'Transporte', 'ônibus': 'Transporte',
  // Moradia
  'moradia': 'Moradia', 'internet': 'Moradia', 'aluguel': 'Moradia',
  'condominio': 'Moradia', 'condomínio': 'Moradia',
  'agua': 'Moradia', 'água': 'Moradia', 'energia': 'Moradia', 'luz': 'Moradia',
  // Saúde
  'saude': 'Saúde', 'saúde': 'Saúde', 'farmacia': 'Saúde', 'farmácia': 'Saúde',
  'remedio': 'Saúde', 'remédio': 'Saúde', 'consulta': 'Saúde', 'exame': 'Saúde',
  // Streaming
  'streaming': 'Streaming', 'netflix': 'Streaming', 'amazon prime': 'Streaming',
  'prime video': 'Streaming', 'spotify': 'Streaming', 'disney+': 'Streaming',
  'disney plus': 'Streaming', 'hbo': 'Streaming', 'max': 'Streaming', 'hbo max': 'Streaming',
  // Educação / Compras / Lazer / Outros
  'educacao': 'Educação', 'educação': 'Educação',
  'compras online': 'Compras Online', 'compras': 'Compras Online',
  'lazer': 'Lazer', 'assinaturas': 'Streaming', 'outros': 'Outros',
};

// Normalize a raw fragment to a canonical category. Used by every
// correction path so merchant names are NEVER saved as categories.
export function normalizeCorrectionCategory(text: string): string | null {
  const lower = text.toLowerCase().trim().replace(/[.!?]+$/g, '');
  if (!lower) return null;
  const stripped = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (CORRECTION_ALIAS_MAP[lower]) return CORRECTION_ALIAS_MAP[lower];
  if (CORRECTION_ALIAS_MAP[stripped]) return CORRECTION_ALIAS_MAP[stripped];
  // Substring match — longest alias first to avoid partial overlaps
  const aliases = Object.keys(CORRECTION_ALIAS_MAP).sort((a, b) => b.length - a.length);
  for (const a of aliases) {
    if (lower.includes(a) || stripped.includes(a)) return CORRECTION_ALIAS_MAP[a];
  }
  return null;
}

export function resolveCategoryStrict(text: string): string | null {
  const lower = text.toLowerCase().trim().replace(/[.!?]+$/g, '');
  if (!lower) return null;
  // Must be short — corrections are single words/short phrases
  if (lower.split(/\s+/).length > 3) return null;
  return normalizeCorrectionCategory(lower);
}

// Returns true if the message clearly maps to a known category by keyword.
function hasCategoryKeyword(lower: string): boolean {
  return detectCategory(lower) !== null;
}

// Words/phrases signaling the user is *saving / contributing* money (not spending).
// These have MAXIMUM priority over expense/income detection.
const SAVE_VERBS = [
  'guardei', 'guardar', 'guarda',
  'salvei', 'salvar', 'salva ',
  'separei', 'separar',
  'poupei', 'poupar',
  'reservei', 'reservar',
  'aportei', 'aportar', 'aporte',
  'depositei', 'depositar na meta',
  'aloquei', 'alocar', 'alocar na meta',
  'coloquei na meta', 'colocar na meta', 'colocar pra meta',
  'investir na meta', 'investi na meta',
  'guardar para meta', 'guardar pra meta', 'guardar para a meta', 'guardar pra a meta',
];
// Phrases that strongly indicate savings even without a "save verb"
const SAVE_PHRASES = ['para a meta', 'pra meta', 'para minha meta', 'pra minha meta', 'na minha meta', 'na meta de', 'pra reserva', 'para reserva', 'para a reserva'];
// Words signaling the user wants to *create* a savings target
const CREATE_GOAL_VERBS = ['quero economizar', 'quero juntar', 'quero poupar', 'minha meta é', 'meta de', 'objetivo de', 'criar meta'];

export function parseInput(text: string): ParsedIntent | null {
  const lower = text.toLowerCase().trim();

  // Amount extraction first (we need it for any intent)
  const amountMatch = lower.match(/r?\$?\s?(\d[\d.,]*)/);
  if (!amountMatch) return null;
  const amount = parseAmount(amountMatch[1]);
  if (amount <= 0) return null;

  const description = text;

  // 1) Create goal intent
  const isCreateGoal = CREATE_GOAL_VERBS.some(v => lower.includes(v));
  if (isCreateGoal) {
    const nameMatch = lower.match(/(?:para|pra|pro)\s+([a-záéíóúâêôãõç\s]+?)(?:\s|$|\.)/);
    const goalName = nameMatch ? capitalize(nameMatch[1].trim()) : `Economizar R$${amount.toFixed(0)}`;
    return { kind: 'create_goal', amount, goalName, description };
  }

  // 2) Goal contribution intent: verbs like "guardei", "separei" + valor (+ optional "para X" / "minha meta")
  const isContribution = SAVE_VERBS.some(v => lower.includes(v));
  if (isContribution) {
    // Try extract a goal hint after "para/pra/pro/na minha meta de/para a meta"
    let goalHint: string | null = null;
    const hintMatch = lower.match(/(?:para|pra|pro)\s+(?:a\s+)?(?:minha\s+)?(?:meta(?:\s+de|\s+do|\s+da)?\s+)?([a-záéíóúâêôãõç0-9\s]+?)(?:\s|$|\.)/);
    if (hintMatch) {
      goalHint = hintMatch[1].trim();
    } else if (lower.includes('meta')) {
      goalHint = null; // generic — will use first/most-recent active goal
    }
    return { kind: 'goal_contribution', amount, goalHint, description };
  }

  // 2.b) Goal contribution intent: explicit savings phrases (no verb required)
  const isContribution2 = SAVE_PHRASES.some(p => lower.includes(p));
  if (isContribution2) {
    let goalHint: string | null = null;
    const hintMatch = lower.match(/(?:para|pra|pro|na)\s+(?:a\s+)?(?:minha\s+)?(?:meta(?:\s+de|\s+do|\s+da)?\s+)?([a-záéíóúâêôãõç0-9\s]+?)(?:\s|$|\.)/);
    if (hintMatch) goalHint = hintMatch[1].trim();
    return { kind: 'goal_contribution', amount, goalHint, description };
  }

  // 3) Transaction (income / expense)
  // Explicit expense verbs always win over income heuristics ("perdi na bet", "apostei", "paguei")
  const isExplicitExpense = EXPENSE_VERBS.some(v => lower.includes(v));
  const incomeCategory = isExplicitExpense ? null : detectIncomeCategory(lower);
  const isIncome = incomeCategory !== null;

  // Low-confidence expense: no category keyword detected → ask the user
  // instead of guessing (covers "comprei 50" and any vague spend).
  if (!isIncome && !hasCategoryKeyword(lower)) {
    if (isExplicitExpense) {
      return { kind: 'transaction_pending_category', amount, description };
    }
    return null;
  }

  const category = isIncome ? incomeCategory! : (detectCategory(text) ?? 'Outros');
  return { kind: 'transaction', type: isIncome ? 'income' : 'expense', amount, category, description };
}

const EXPENSE_VERBS = [
  'gastei', 'gastar', 'paguei', 'pagar', 'comprei', 'comprar',
  'perdi', 'apostei', 'fiz uma aposta', 'fiz aposta', 'joguei na',
  'torrei', 'desembolsei', 'investi em', 'banquei',
];

export const INCOME_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'Bônus', keywords: ['bônus', 'bonus', 'bonificação', 'bonificacao', 'comissão', 'comissao', 'prêmio do trabalho', 'premio do trabalho', 'extra do trabalho'] },
  { category: 'Reembolso', keywords: ['reembolso', 'devolução', 'devolucao', 'estorno'] },
  { category: 'Pix Recebido', keywords: ['pix recebido', 'recebi pix', 'recebi um pix', 'pix de', 'um pix', 'transferência recebida', 'transferencia recebida', 'recebi transferência', 'recebi transferencia', 'pix'] },
  { category: 'Renda Extra', keywords: ['freelance', 'freela', 'trabalho extra', 'venda', 'vendi', 'fiz uma venda', 'bico'] },
  { category: 'Ganhos Eventuais', keywords: ['prêmio', 'premio', 'sorteio', 'aposta', ' bet', 'na bet', 'cashback', 'ganhei na', 'ganhei no'] },
  { category: 'Salário', keywords: ['salário', 'salario', 'folha', 'pagamento mensal', 'pagamento do trabalho', 'meu salário', 'meu salario'] },
];

const GENERIC_INCOME_VERBS = ['recebi', 'ganhei', 'caiu na conta', 'caiu', 'entrou', 'pagamento recebido', 'renda'];

function detectIncomeCategory(lower: string): string | null {
  for (const { category, keywords } of INCOME_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  if (GENERIC_INCOME_VERBS.some(v => lower.includes(v))) return 'Outros Ganhos';
  return null;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseAmount(raw: string): number {
  let cleaned = raw.replace(/\s/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  return parseFloat(cleaned) || 0;
}

// ---- Goal matching ----

export function findMatchingGoal(goals: Goal[], hint: string | null): Goal | null {
  if (goals.length === 0) return null;
  const active = goals.filter(g => g.currentAmount < g.targetAmount);
  const pool = active.length > 0 ? active : goals;

  if (hint) {
    const h = hint.toLowerCase();
    const exact = pool.find(g => g.name.toLowerCase() === h);
    if (exact) return exact;
    const partial = pool.find(g => g.name.toLowerCase().includes(h) || h.includes(g.name.toLowerCase()));
    if (partial) return partial;
  }
  // Fallback to most-recent active goal
  return [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
}

// ---- Insights (chat) ----

const BET_KEYWORDS = ['bet', 'aposta', 'apostei', 'cassino', 'loteria', 'raspadinha'];

function isBetTransaction(t: Transaction): boolean {
  const d = t.description.toLowerCase();
  return BET_KEYWORDS.some(k => d.includes(k));
}

const EXPENSE_RESPONSES: Record<string, string[]> = {
  'Moradia': [
    'Registrado. Seus gastos fixos continuam representando uma parte importante do seu orçamento.',
    'Anotado. Moradia costuma pesar — vale acompanhar o quanto consome da sua renda.',
    'Registrado. Contas de casa entram no grupo dos gastos essenciais, mas dá pra revisar de tempos em tempos.',
  ],
  'Alimentação': [
    'Anotado. Alimentação segue sendo uma categoria relevante este mês.',
    'Registrado. Vale observar quanto vai pra mercado e quanto pra delivery — costuma fazer diferença.',
    'Anotado. Comida é essencial, mas pequenos hábitos aqui podem render uma boa economia.',
  ],
  'Compras Online': [
    'Registrado. Compras online aumentaram um pouco. Vale acompanhar.',
    'Anotado. Esse tipo de gasto some rápido do radar — bom acompanhar de perto.',
    'Registrado. Se possível, pensa 24h antes de finalizar a próxima compra não essencial.',
  ],
  'Saúde': [
    'Registrado. Cuidar da saúde também faz parte do equilíbrio financeiro.',
    'Anotado. Saúde é prioridade — e ainda assim vale comparar preços de remédios e exames.',
  ],
  'Lazer': [
    'Registrado. Lazer faz bem — só vale ficar de olho pra não pesar no fim do mês.',
    'Anotado. Equilíbrio é tudo: se divertir sem comprometer o orçamento.',
  ],
  'Transporte': [
    'Registrado. Transporte costuma ser um gasto recorrente — vale observar o total no fim do mês.',
    'Anotado. Pequenas otimizações de rota ou meio podem reduzir bem essa categoria.',
  ],
  'Streaming': [
    'Registrado. Vale revisar quais assinaturas você realmente usa.',
    'Anotado. Streaming acumula rápido — checa se tem algo que dá pra cortar.',
  ],
  'Assinaturas': [
    'Registrado. Assinaturas são gastos invisíveis — bom revisar de tempos em tempos.',
  ],
  'Educação': [
    'Registrado. Investir em educação costuma valer a pena no longo prazo.',
  ],
  'Outros': [
    'Registrado. Anotei aqui no seu controle.',
    'Anotado. Vou acompanhar junto com os outros gastos do mês.',
  ],
};

const INCOME_RESPONSES: Record<string, string[]> = {
  'Bônus': [
    'Boa. Entrou um valor extra. Pode ser uma boa oportunidade para fortalecer sua meta.',
    'Ótimo. Bônus é uma chance perfeita pra acelerar uma meta sem mexer na rotina.',
  ],
  'Reembolso': [
    'Ótimo. Esse reembolso pode ajudar a recompor seu saldo.',
    'Registrado. Reembolso é dinheiro que voltou — bom momento pra direcionar pra algo importante.',
  ],
  'Pix Recebido': [
    'Registrado. Pix recebido entrou no seu saldo.',
    'Anotado. Se não tem destino certo, vale considerar guardar uma parte.',
  ],
  'Renda Extra': [
    'Boa. Renda extra é sempre bem-vinda — uma parte aqui pode acelerar suas metas.',
    'Registrado. Trabalho extra rendendo bem — considera separar uma fatia pra poupar.',
  ],
  'Ganhos Eventuais': [
    'Registrado. Entrou um ganho eventual. Se quiser, parte desse valor pode fortalecer sua reserva.',
    'Anotado. Ganhos assim são imprevisíveis — vale aproveitar pra reforçar uma meta.',
  ],
  'Salário': [
    'Registrado. Salário no caixa — bom momento pra separar o que vai pra metas antes de começar a gastar.',
    'Anotado. Com o salário entrando, vale planejar o mês com calma.',
  ],
  'Outros Ganhos': [
    'Registrado. Anotei essa entrada no seu saldo.',
  ],
};

function pickDifferent(options: string[], avoid?: string | null): string {
  if (options.length === 0) return '';
  if (options.length === 1) return options[0];
  const filtered = avoid ? options.filter(o => o !== avoid) : options;
  const pool = filtered.length > 0 ? filtered : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateContextualResponse(
  state: FinanceState,
  parsed: Extract<ParsedIntent, { kind: 'transaction' }>,
  lastResponse?: string | null,
): string {
  const { income, expenses } = getMonthlyTotals(state);
  const userIncome = state.user.monthlyIncome || income;
  const activeGoal = state.goals.find(g => g.currentAmount < g.targetAmount);
  const lower = parsed.description.toLowerCase();

  // ---- INCOME ----
  if (parsed.type === 'income') {
    const isBetWin = BET_KEYWORDS.some(k => lower.includes(k));
    let base: string;
    if (isBetWin) {
      base = 'Registrado. Entrou um ganho eventual. Se quiser, parte desse valor pode fortalecer sua reserva.';
    } else {
      const pool = INCOME_RESPONSES[parsed.category] || INCOME_RESPONSES['Outros Ganhos'];
      base = pickDifferent(pool, lastResponse);
    }
    if (activeGoal && parsed.amount >= 20 && parsed.category !== 'Salário' && !isBetWin) {
      base += ` Esses R$${parsed.amount.toFixed(2)} já podem representar um avanço na sua meta "${activeGoal.name}".`;
    }
    return base;
  }

  // ---- EXPENSE ----
  // Betting awareness takes priority
  const isBetExpense = BET_KEYWORDS.some(k => lower.includes(k));
  if (isBetExpense) {
    const recentBets = state.transactions.filter(t => t.type === 'expense' && isBetTransaction(t));
    if (recentBets.length >= 2) {
      return 'Percebi perdas recentes com apostas. Talvez seja um bom momento para definir um limite.';
    }
    return 'Registrado. Vale acompanhar para apostas não começarem a impactar seu orçamento.';
  }

  // Hard budget warnings (still avoid repeating)
  if (userIncome > 0 && expenses > userIncome) {
    const msg = 'Você já gastou mais do que recebe este mês. Bora reorganizar?';
    if (msg !== lastResponse) return msg;
  }
  if (userIncome > 0 && expenses > userIncome * 0.9) {
    const msg = 'Seus gastos já passaram de 90% da sua renda este mês. Hora de pisar no freio.';
    if (msg !== lastResponse) return msg;
  }

  const pool = EXPENSE_RESPONSES[parsed.category] || EXPENSE_RESPONSES['Outros'];
  return pickDifferent(pool, lastResponse);
}

// Kept for backward compatibility — no longer used for transaction responses.
export function generateInsight(_state: FinanceState, _justAddedCategory?: string): string | null {
  return null;
}

// ---- Savings suggestion ----

export interface SavingsSuggestion {
  amount: number;
  goal: Goal;
  surplus: number;
}

/**
 * Detects whether the user has surplus this month and we should proactively
 * suggest moving money to a goal.
 *
 * surplus = income - expenses - safety_margin (10% of income)
 * Conditions:
 *  - has at least one active goal
 *  - surplus > 100
 *  - expenses < 85% of income
 * Suggested = 30% of surplus
 */
export function computeSavingsSuggestion(state: FinanceState): SavingsSuggestion | null {
  const { income, expenses } = getMonthlyTotals(state);
  const userIncome = state.user.monthlyIncome || income;
  if (userIncome <= 0) return null;
  if (expenses >= userIncome * 0.85) return null;

  const safety = userIncome * 0.1;
  const surplus = userIncome - expenses - safety;
  if (surplus <= 100) return null;

  const activeGoal = state.goals.find(g => g.currentAmount < g.targetAmount);
  if (!activeGoal) return null;

  const amount = Math.round((surplus * 0.3) / 10) * 10; // round to nearest 10
  if (amount < 50) return null;

  return { amount, goal: activeGoal, surplus };
}

// ---- Confirmations (toast) ----

export function generateConfirmation(state: FinanceState, parsed: ParsedIntent, goal?: Goal): string {
  if (parsed.kind === 'transaction') {
    if (parsed.type === 'income') {
      return `Registrei R$${parsed.amount.toFixed(2)} como receita em ${parsed.category}.`;
    }
    return `Registrei R$${parsed.amount.toFixed(2)} como despesa em ${parsed.category}.`;
  }
  if (parsed.kind === 'goal_contribution' && goal) {
    return `Adicionei R$${parsed.amount.toFixed(2)} à sua meta "${goal.name}".`;
  }
  if (parsed.kind === 'create_goal') {
    return `Meta "${parsed.goalName}" criada — R$${parsed.amount.toFixed(2)}.`;
  }
  return '';
}

export function createTransaction(parsed: Extract<ParsedIntent, { kind: 'transaction' }>): Transaction {
  return {
    id: crypto.randomUUID(),
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    date: new Date().toISOString(),
  };
}

export function createGoalContribution(amount: number, goal: Goal, description: string): Transaction {
  return {
    id: crypto.randomUUID(),
    type: 'goal_contribution',
    amount,
    category: 'Meta',
    description,
    date: new Date().toISOString(),
    goalId: goal.id,
  };
}

// ---- Conversational intents (advice / general questions) ----

export type ConversationalIntent =
  | { kind: 'advice'; topic: 'save' | 'spend' | 'invest' | 'budget' | 'general' }
  | { kind: 'greeting' }
  | { kind: 'thanks' }
  | { kind: 'balance' }
  | { kind: 'expenses_query' }
  | { kind: 'goals_query' }
  | { kind: 'financial_health'; focus: 'spending' | 'overall' | 'situation' }
  | { kind: 'help_general' }
  | { kind: 'correction'; targetHint: string | null; newCategory: string | null; newType?: 'expense' | 'income' | 'goal_contribution'; goalHint?: string | null }
  | { kind: 'unclear' };

const ADVICE_TRIGGERS = [
  'como economizar', 'como guardar', 'como poupar', 'como juntar',
  'guardar dinheiro', 'juntar dinheiro', 'poupar dinheiro',
  'dicas', 'dica de', 'dica pra', 'dica para', 'alguma dica',
  'me ajuda a', 'me ajude a', 'como faço para', 'como faço pra',
  'como posso', 'como gastar', 'como organizar', 'como controlar',
  'como começar', 'como investir', 'como melhorar', 'como aproveitar',
  'aproveitar melhor', 'melhorar meus gastos', 'melhorar meu dinheiro',
  'o que faço', 'o que eu faço', 'sugestão', 'sugestões',
  'conselho', 'conselhos', 'me da uma dica', 'me dá uma dica',
  'me da dicas', 'me dá dicas', 'finanças', 'financas',
];

const CORRECTION_TRIGGERS = [
  'corrigir', 'corrige', 'corrija', 'mudar', 'muda ', 'mude',
  'alterar', 'altera ', 'altere', 'trocar', 'troca ', 'troque',
  'categoria errada', 'tá errado', 'ta errado', 'está errado',
  'errei a categoria', 'isso não é', 'isso nao e', 'não é ', 'nao e ',
];

const CATEGORY_ALIASES: Record<string, string> = {
  'moradia': 'Moradia', 'casa': 'Moradia',
  'alimentação': 'Alimentação', 'alimentacao': 'Alimentação',
  'transporte': 'Transporte',
  'streaming': 'Streaming',
  'saúde': 'Saúde', 'saude': 'Saúde',
  'educação': 'Educação', 'educacao': 'Educação',
  'assinaturas': 'Assinaturas', 'assinatura': 'Assinaturas',
  'compras online': 'Compras Online', 'shopping': 'Compras Online', 'compras': 'Compras Online',
  'lazer': 'Lazer',
  'outros': 'Outros',
};

function detectTargetCategory(lower: string): string | null {
  // longer aliases first to avoid partial matches
  const entries = Object.entries(CATEGORY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, cat] of entries) {
    if (lower.includes(alias)) return cat;
  }
  return null;
}

// Reverse lookup: from any merchant/keyword to the source category.
// Used so "internet é moradia" can find that "internet" was a Moradia item.
function findKeywordCategory(lower: string): { keyword: string; category: string } | null {
  const all: Array<{ keyword: string; category: string }> = [];
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    for (const kw of keywords) all.push({ keyword: kw, category });
  }
  // longest keyword first to avoid partial overlap
  all.sort((a, b) => b.keyword.length - a.keyword.length);
  for (const e of all) {
    if (lower.includes(e.keyword)) return e;
  }
  return null;
}

export function detectConversationalIntent(text: string): ConversationalIntent {
  const lower = text.toLowerCase().trim();

  if (/^(oi|olá|ola|opa|eai|e aí|bom dia|boa tarde|boa noite|hey|hello)\b/.test(lower)) {
    return { kind: 'greeting' };
  }
  if (/(obrigad|valeu|brigad|thanks|tmj)/.test(lower)) {
    return { kind: 'thanks' };
  }

  // Plain "<merchant> é <categoria>" pattern, e.g. "internet é moradia",
  // "amazon prime é streaming", "farmácia é saúde". No explicit correction
  // verb needed — the structure itself is a category correction.
  // Skip if the sentence contains an amount (then it's likely a transaction).
  if (!/\d/.test(lower) && /\s(é|e|eh)\s/.test(` ${lower} `)) {
    const newCategory = detectTargetCategory(lower);
    const found = findKeywordCategory(lower);
    if (newCategory && found && found.category !== newCategory) {
      return { kind: 'correction', targetHint: found.keyword, newCategory };
    }
  }

  // Natural correction: "era mercado", "foi mercado", "isso era saúde",
  // "não é saúde", "nao eh transporte" — applies to the LAST transaction.
  // No digits allowed (otherwise it's a new transaction).
  if (!/\d/.test(lower)) {
    const natural = lower.match(
      /^(?:isso\s+|esse\s+|essa\s+)?(?:era|foi|n[ãa]o\s+(?:é|e|eh)|na\s+verdade\s+(?:era|foi|é|e|eh))\s+(.+?)[\s.!?]*$/
    );
    if (natural) {
      const tail = natural[1].trim();
      // Normalize merchant aliases (e.g. "mercado" → Alimentação) BEFORE
      // falling back to direct category or keyword detection.
      const normalized = normalizeCorrectionCategory(tail);
      const direct = !normalized ? detectTargetCategory(tail) : null;
      const viaKeyword = !normalized && !direct ? detectCategory(tail) : null;
      const newCategory = normalized ?? direct ?? viaKeyword;
      if (newCategory) {
        return { kind: 'correction', targetHint: null, newCategory };
      }
    }
  }

  // Flip to savings/goal: "isso era meta", "isso era reserva", "isso não é gasto, era pra meta"
  const flipToSavings = /(era|virou|na verdade(?:\s+é)?)\s+(meta|reserva|poupança|poupanca)|(isso|esse)\s+(não|nao)\s+(é|e)\s+(gasto|despesa)|isso era pra (meta|guardar|poupar)|era pra meta|era pra reserva/.test(lower);
  if (flipToSavings) {
    let goalHint: string | null = null;
    const hintMatch = lower.match(/(?:meta(?:\s+de|\s+do|\s+da)?\s+)([a-záéíóúâêôãõç0-9\s]+?)(?:\s|$|\.)/);
    if (hintMatch) goalHint = hintMatch[1].trim();
    return { kind: 'correction', targetHint: null, newCategory: null, newType: 'goal_contribution', goalHint };
  }


  const flipToExpense = /(é|e|virou|na verdade)\s+(despesa|gasto|saída|saida)|despesa,?\s+não|despesa,?\s+nao|aposta é despesa|isso é gasto/.test(lower);
  const flipToIncome = /(é|e|virou|na verdade)\s+(receita|ganho|renda|entrada)|receita,?\s+não|receita,?\s+nao|reembolso é receita|isso é ganho/.test(lower);
  if (flipToExpense || flipToIncome) {
    let targetHint: string | null = null;
    for (const { keywords } of CATEGORY_KEYWORDS) {
      for (const kw of keywords) {
        if (lower.includes(kw)) { targetHint = kw; break; }
      }
      if (targetHint) break;
    }
    return {
      kind: 'correction',
      targetHint,
      newCategory: detectTargetCategory(lower),
      newType: flipToExpense ? 'expense' : 'income',
    };
  }

  // Correction commands — must come before advice/transaction parsing
  const isCorrection = CORRECTION_TRIGGERS.some(t => lower.includes(t));
  if (isCorrection) {
    // Normalize merchant aliases first so e.g. "muda para mercado" → Alimentação
    const newCategory = normalizeCorrectionCategory(lower) ?? detectTargetCategory(lower);
    let targetHint: string | null = null;
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
      if (category === newCategory) continue;
      for (const kw of keywords) {
        if (lower.includes(kw)) { targetHint = kw; break; }
      }
      if (targetHint) break;
    }
    // Return correction even without category (we'll ask the user)
    return { kind: 'correction', targetHint, newCategory };
  }

  // Financial health intent (must come before generic advice)
  if (
    /(saúde financeira|saude financeira|minhas finanças|minhas financas|meu financeiro|situação financeira|situacao financeira|score financeiro|estou indo bem financeiramente|como estou financeiramente|estou gastando muito|gastando demais|gastando bastante|gastei demais|financial health|finance status|how am i doing financially)/.test(lower)
    || /como estão minhas finanças|como estao minhas financas|como está meu financeiro|como esta meu financeiro/.test(lower)
  ) {
    const focus: 'spending' | 'overall' | 'situation' =
      /(gastando|gastei demais|gasto demais|gastando muito|gastando demais|gastando bastante)/.test(lower)
        ? 'spending'
        : /(saúde financeira|saude financeira|score|saudavel|saudável)/.test(lower)
          ? 'overall'
          : 'situation';
    return { kind: 'financial_health', focus };
  }

  // Advice / help requests
  const isAdvice = ADVICE_TRIGGERS.some(t => lower.includes(t));
  if (isAdvice) {
    if (/(invest|render|aplica)/.test(lower)) return { kind: 'advice', topic: 'invest' };
    if (/(gast|control|organiz|orçament|orcament|limit|aproveitar|melhorar)/.test(lower)) return { kind: 'advice', topic: 'budget' };
    if (/(economi|guard|poup|junt)/.test(lower)) return { kind: 'advice', topic: 'save' };
    if (/(gastar melhor|gastar bem|reduzir)/.test(lower)) return { kind: 'advice', topic: 'spend' };
    return { kind: 'advice', topic: 'general' };
  }

  if (/(saldo|quanto tenho|quanto sobrou|quanto sobra)/.test(lower)) return { kind: 'balance' };
  if (/(gasto|gastei|despesa|gastos do mês|gastos do mes)/.test(lower) && /(quanto|qual|meus|meu)/.test(lower)) {
    return { kind: 'expenses_query' };
  }
  if (/(meta|metas|poupei|poupanç|poupanc)/.test(lower) && /(quanto|qual|minhas|tenho)/.test(lower)) {
    return { kind: 'goals_query' };
  }
  if (/(o que (você|voce) faz|como funciona|para que serve|pra que serve|me explica)/.test(lower)) {
    return { kind: 'help_general' };
  }

  return { kind: 'unclear' };
}


const ADVICE_RESPONSES: Record<'save' | 'spend' | 'invest' | 'budget' | 'general', string[]> = {
  save: [
    'Boa pergunta. Algumas formas simples de começar:\n\n- definir um valor fixo para guardar todo mês\n- revisar gastos recorrentes como assinaturas\n- acompanhar seus gastos por categoria',
    'Se você quiser começar simples:\n\n- tenta guardar uma pequena porcentagem do que entra\n- evita gastar antes de separar esse valor\n- começa com metas pequenas e realistas',
    'Uma boa estratégia é:\n\n- separar o valor pra poupar logo que o dinheiro entra\n- automatizar essa transferência se possível\n- acompanhar o progresso ao longo do mês',
  ],
  spend: [
    'Pra gastar melhor, vale tentar:\n\n- reduzir gastos invisíveis (streaming, compras online)\n- definir limites por categoria\n- pensar 24h antes de compras não essenciais',
    'Algumas ideias práticas:\n\n- listar os gastos fixos do mês\n- identificar o que dá pra cortar sem dor\n- priorizar o que realmente traz valor pra você',
  ],
  invest: [
    'Antes de investir, o ideal é:\n\n- ter uma reserva de emergência (3 a 6 meses de gastos)\n- quitar dívidas caras primeiro\n- estudar opções simples como Tesouro Direto e CDBs',
    'Pra começar a investir bem:\n\n- entenda seu perfil (conservador, moderado, arrojado)\n- comece com pouco e aumente aos poucos\n- diversifique conforme for aprendendo',
  ],
  budget: [
    'Pra organizar o orçamento:\n\n- anote tudo que entra e sai por algumas semanas\n- agrupe os gastos em categorias\n- defina um teto por categoria e acompanhe',
    'Uma boa estratégia é:\n\n- reduzir gastos invisíveis (streaming, compras online)\n- definir limites por categoria\n- acompanhar seu progresso ao longo do mês',
  ],
  general: [
    'Algumas dicas que costumam funcionar:\n\n- guarde um valor fixo todo mês, mesmo que pequeno\n- revise assinaturas e gastos recorrentes\n- acompanhe seus gastos por categoria pra enxergar padrões',
    'No geral, o que mais ajuda é:\n\n- ter clareza de quanto entra e sai\n- separar o que vai poupar antes de gastar\n- ter metas concretas pra se motivar',
  ],
};

export function getAdviceResponse(topic: 'save' | 'spend' | 'invest' | 'budget' | 'general'): string {
  const opts = ADVICE_RESPONSES[topic];
  return opts[Math.floor(Math.random() * opts.length)];
}

/**
 * Contextual advice that uses the user's actual financial data when available.
 */
export function getContextualAdvice(state: FinanceState, topic: 'save' | 'spend' | 'invest' | 'budget' | 'general'): string {
  const { income, expenses } = getMonthlyTotals(state);
  const cats = getCategoryTotals(state);
  const top = cats[0];
  const userIncome = state.user.monthlyIncome || income;
  const activeGoal = state.goals.find(g => g.currentAmount < g.targetAmount);

  const lines: string[] = [];

  if (top && top.total > 0) {
    lines.push(`Olhando seus dados, **${top.category}** concentra a maior parte dos seus gastos este mês (R$${top.total.toFixed(2)}).`);
    if (top.percentage > 40) {
      const cut = Math.max(20, Math.round(top.total * 0.15 / 10) * 10);
      const goalLine = activeGoal ? ` e direcionar pra sua meta "${activeGoal.name}"` : '';
      lines.push(`Se conseguir reduzir uns R$${cut} aí${goalLine}, já faz diferença.`);
    }
  }

  if (userIncome > 0 && expenses > 0 && expenses > userIncome * 0.85) {
    lines.push(`Seus gastos já representam ${Math.round((expenses / userIncome) * 100)}% da sua renda. Vale segurar um pouco nas próximas semanas.`);
  }

  if (lines.length === 0) {
    return getAdviceResponse(topic);
  }

  const tip: Record<'save' | 'spend' | 'invest' | 'budget' | 'general', string> = {
    save: 'Uma boa prática é separar o valor pra poupar logo que o dinheiro entra.',
    spend: 'Tenta listar os gastos invisíveis (streaming, delivery) e cortar 1 ou 2.',
    invest: 'Antes de investir, garante uma reserva de 3 a 6 meses de gastos.',
    budget: 'Define um teto mensal por categoria e acompanha aqui no app.',
    general: 'Acompanhar os gastos por categoria já ajuda a tomar decisões melhores.',
  };
  lines.push(tip[topic]);

  return lines.join('\n\n');
}

// ---- Corrections ----

export function findRecentExpenseToCorrect(state: FinanceState, hint: string | null): Transaction | null {
  return findRecentTransactionToCorrect(state, hint, 'expense');
}

export function findRecentTransactionToCorrect(
  state: FinanceState,
  hint: string | null,
  preferType?: 'expense' | 'income'
): Transaction | null {
  const all = state.transactions
    .filter(t => t.type === 'expense' || t.type === 'income')
    .sort((a, b) => b.date.localeCompare(a.date));
  if (all.length === 0) return null;

  if (hint) {
    const h = hint.toLowerCase();
    const match = all.find(t => t.description.toLowerCase().includes(h));
    if (match) return match;
  }
  if (preferType) {
    const preferred = all.find(t => t.type === preferType);
    if (preferred) return preferred;
  }
  return all[0];
}


export function createGoal(name: string, amount: number): Goal {
  return {
    id: crypto.randomUUID(),
    name,
    targetAmount: amount,
    currentAmount: 0,
    createdAt: new Date().toISOString(),
  };
}
