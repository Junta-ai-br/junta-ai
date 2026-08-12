const CATEGORIES = [
  "Alimenta\xE7\xE3o",
  "Mercado",
  "Transporte",
  "Moradia",
  "Lazer",
  "Sa\xFAde",
  "Educa\xE7\xE3o",
  "Assinaturas",
  "Streaming",
  "Compras Online",
  "Apostas",
  "Outros"
];
const CATEGORY_ICONS = {
  "Alimenta\xE7\xE3o": "\u{1F354}",
  "Mercado": "\u{1F6D2}",
  "Transporte": "\u{1F697}",
  "Moradia": "\u{1F3E0}",
  "Lazer": "\u{1F3AE}",
  "Sa\xFAde": "\u{1F48A}",
  "Educa\xE7\xE3o": "\u{1F4DA}",
  "Assinaturas": "\u{1F4F1}",
  "Streaming": "\u{1F3AC}",
  "Compras Online": "\u{1F4E6}",
  "Apostas": "\u{1F3B2}",
  "Outros": "\u{1F4E6}",
  "Sal\xE1rio": "\u{1F4B0}",
  "Renda": "\u{1F4B5}",
  "B\xF4nus": "\u{1F381}",
  "Reembolso": "\u21A9\uFE0F",
  "Pix Recebido": "\u26A1",
  "Renda Extra": "\u{1F4BC}",
  "Ganhos Eventuais": "\u{1F340}",
  "Outros Ganhos": "\u2728",
  "Meta": "\u{1F3AF}"
};
const CATEGORY_COLORS = {
  "Alimenta\xE7\xE3o": "hsl(20, 80%, 55%)",
  "Mercado": "hsl(95, 55%, 45%)",
  "Transporte": "hsl(200, 70%, 50%)",
  "Moradia": "hsl(152, 55%, 45%)",
  "Lazer": "hsl(280, 60%, 60%)",
  "Sa\xFAde": "hsl(340, 65%, 55%)",
  "Educa\xE7\xE3o": "hsl(38, 90%, 55%)",
  "Assinaturas": "hsl(180, 50%, 50%)",
  "Streaming": "hsl(258, 65%, 60%)",
  "Compras Online": "hsl(220, 70%, 60%)",
  "Apostas": "hsl(0, 70%, 55%)",
  "Outros": "hsl(240, 5%, 50%)"
};
const currentMonth = () => {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
function getBalance(state) {
  return state.transactions.reduce((acc, t) => {
    if (t.type === "income") return acc + t.amount;
    return acc - t.amount;
  }, 0);
}
function getMonthlyTotals(state) {
  const month = currentMonth();
  const monthTx = state.transactions.filter((t) => t.date.startsWith(month));
  const income = monthTx.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = monthTx.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const savings = monthTx.filter((t) => t.type === "goal_contribution").reduce((a, t) => a + t.amount, 0);
  return { income, expenses, savings, balance: income - expenses - savings };
}
function getCategoryTotals(state) {
  const month = currentMonth();
  const monthExpenses = state.transactions.filter((t) => t.type === "expense" && t.date.startsWith(month));
  const totals = {};
  monthExpenses.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  const totalSum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals).map(([category, total]) => ({
    category,
    total,
    percentage: totalSum > 0 ? total / totalSum * 100 : 0
  })).sort((a, b) => b.total - a.total);
}
function getCategoryTotal(state, category) {
  const month = currentMonth();
  return state.transactions.filter((t) => t.type === "expense" && t.category === category && t.date.startsWith(month)).reduce((a, t) => a + t.amount, 0);
}
function computeHealthScore(state) {
  const month = currentMonth();
  const monthTx = state.transactions.filter((t) => t.date.startsWith(month));
  const income = monthTx.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = monthTx.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const savings = monthTx.filter((t) => t.type === "goal_contribution").reduce((a, t) => a + t.amount, 0);
  const balance = income - expenses - savings;
  const activeGoals = state.goals.filter((g) => g.currentAmount < g.targetAmount).length;
  const ratio = income > 0 ? expenses / income : expenses > 0 ? 1.5 : 0;
  const gamblingRegex = /\b(aposta|apostei|apostar|bet|bets|cassino|loteria|raspadinha)\b/i;
  const gamblingCount = monthTx.filter(
    (t) => t.type === "expense" && gamblingRegex.test(t.description)
  ).length;
  const nonEssential = monthTx.filter((t) => t.type === "expense" && (t.category === "Lazer" || t.category === "Compras Online")).reduce((a, t) => a + t.amount, 0);
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
  let status;
  let label;
  let emoji;
  if (score >= 70) {
    status = "healthy";
    label = "Saud\xE1vel";
    emoji = "\u{1F7E2}";
  } else if (score >= 40) {
    status = "attention";
    label = "Aten\xE7\xE3o";
    emoji = "\u{1F7E0}";
  } else {
    status = "critical";
    label = "Cr\xEDtica";
    emoji = "\u{1F534}";
  }
  const topCategory = (() => {
    const totals = {};
    monthTx.filter((t) => t.type === "expense").forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const total = sorted.reduce((a, [, v]) => a + v, 0);
    return { category: sorted[0][0], amount: sorted[0][1], share: total > 0 ? sorted[0][1] / total : 0 };
  })();
  let message;
  if (monthTx.length === 0) {
    message = "Registre suas movimenta\xE7\xF5es para acompanhar sua sa\xFAde financeira.";
  } else if (balance < 0) {
    message = "Voc\xEA gastou mais do que ganhou neste per\xEDodo.";
  } else if (income > 0 && ratio > 0.9) {
    message = "Despesas j\xE1 passaram de 90% da sua renda neste m\xEAs.";
  } else if (gamblingCount >= 2) {
    message = "Atividade recorrente em apostas detectada. Vale acompanhar esse comportamento.";
  } else if (topCategory && topCategory.category === "Moradia" && topCategory.share > 0.4) {
    message = "Moradia representa uma parte significativa dos custos mensais.";
  } else if (nonEssentialRatio > 0.4) {
    message = "Gastos n\xE3o essenciais cresceram neste m\xEAs.";
  } else if (savings > 0 && balance > 0) {
    message = "Despesas sob controle. Continue fortalecendo suas metas.";
  } else if (income > 0 && ratio < 0.7) {
    message = "Voc\xEA est\xE1 mantendo equil\xEDbrio financeiro este m\xEAs.";
  } else {
    message = "Situa\xE7\xE3o est\xE1vel. Pequenos ajustes podem te levar mais longe.";
  }
  return { score, status, label, emoji, message };
}
function explainFinancialHealth(state) {
  const hs = computeHealthScore(state);
  const { income, expenses, savings } = getMonthlyTotals(state);
  const balance = income - expenses - savings;
  const ratio = income > 0 ? expenses / income : 0;
  const cats = getCategoryTotals(state);
  const top = cats[0];
  const monthTx = state.transactions.filter((t) => t.date.startsWith(currentMonth()));
  const gambling = monthTx.filter((t) => t.type === "expense" && /\b(aposta|apostei|bet|cassino|loteria|raspadinha)\b/i.test(t.description)).length;
  if (monthTx.length === 0) {
    return "Ainda n\xE3o tenho movimenta\xE7\xF5es suficientes este m\xEAs para avaliar sua sa\xFAde financeira. Registra alguns gastos e receitas que eu te mostro.";
  }
  let headline;
  if (hs.score >= 80) headline = `Sua sa\xFAde financeira est\xE1 forte (${hs.score}/100).`;
  else if (hs.score >= 60) headline = `Sua sa\xFAde financeira est\xE1 est\xE1vel, mas merece aten\xE7\xE3o (${hs.score}/100).`;
  else if (hs.score >= 40) headline = `Sua sa\xFAde financeira est\xE1 em aten\xE7\xE3o (${hs.score}/100).`;
  else headline = `Sua sa\xFAde financeira precisa de aten\xE7\xE3o imediata (${hs.score}/100).`;
  const reasons = [];
  if (balance < 0) reasons.push(`os gastos superaram a renda em R$${Math.abs(balance).toFixed(2)}`);
  else if (income > 0 && ratio > 0.9) reasons.push(`as despesas consomem ${Math.round(ratio * 100)}% da renda do m\xEAs`);
  else if (income > 0 && ratio < 0.7) reasons.push(`as despesas est\xE3o em ${Math.round(ratio * 100)}% da renda \u2014 boa folga`);
  if (gambling >= 2) reasons.push(`h\xE1 ${gambling} lan\xE7amentos de apostas neste m\xEAs`);
  if (top && top.percentage > 40) reasons.push(`${top.category} concentra ${Math.round(top.percentage)}% dos gastos`);
  if (savings > 0) reasons.push(`voc\xEA j\xE1 guardou R$${savings.toFixed(2)} para metas`);
  const tail = reasons.length > 0 ? ` Isso porque ${reasons.join("; ")}.` : "";
  return `${headline}${tail}`;
}
function explainFinancialHealthByFocus(state, focus) {
  const hs = computeHealthScore(state);
  const { income, expenses, savings } = getMonthlyTotals(state);
  const balance = income - expenses - savings;
  const ratio = income > 0 ? expenses / income : 0;
  const cats = getCategoryTotals(state);
  const top = cats[0];
  const monthTx = state.transactions.filter((t) => t.date.startsWith(currentMonth()));
  if (monthTx.length === 0) {
    return "Ainda n\xE3o tenho movimenta\xE7\xF5es suficientes este m\xEAs pra avaliar. Registra alguns gastos e receitas que eu te respondo com base nos seus n\xFAmeros.";
  }
  if (focus === "spending") {
    const lines = [];
    if (income > 0) {
      const pct = Math.round(ratio * 100);
      if (ratio > 0.9) lines.push(`Sim \u2014 suas despesas j\xE1 consomem ${pct}% da sua renda deste m\xEAs.`);
      else if (ratio > 0.7) lines.push(`Voc\xEA est\xE1 num ritmo moderado: ${pct}% da renda j\xE1 foi pra gastos.`);
      else lines.push(`N\xE3o, no momento seus gastos est\xE3o em ${pct}% da renda \u2014 ainda h\xE1 folga.`);
    } else {
      lines.push(`Voc\xEA gastou R$${expenses.toFixed(2)} este m\xEAs. Sem receita registrada ainda, fica dif\xEDcil dizer se \xE9 muito.`);
    }
    if (top && top.percentage > 35) {
      lines.push(`O peso maior est\xE1 em ${top.category} (${Math.round(top.percentage)}% dos gastos).`);
    }
    return lines.join(" ");
  }
  if (focus === "overall") {
    const headline = hs.score >= 80 ? `Sua sa\xFAde financeira est\xE1 forte: ${hs.score}/100.` : hs.score >= 60 ? `Sua sa\xFAde financeira est\xE1 est\xE1vel: ${hs.score}/100.` : hs.score >= 40 ? `Sua sa\xFAde financeira est\xE1 em aten\xE7\xE3o: ${hs.score}/100.` : `Sua sa\xFAde financeira precisa de cuidado: ${hs.score}/100.`;
    const detail = balance < 0 ? `Os gastos superaram a renda em R$${Math.abs(balance).toFixed(2)}.` : income > 0 && ratio > 0.9 ? `Despesas em ${Math.round(ratio * 100)}% da renda do m\xEAs.` : savings > 0 ? `Voc\xEA j\xE1 guardou R$${savings.toFixed(2)} pra metas neste m\xEAs.` : income > 0 ? `Renda R$${income.toFixed(2)} e despesas R$${expenses.toFixed(2)}.` : `Despesas registradas: R$${expenses.toFixed(2)}.`;
    return `${headline} ${detail}`;
  }
  const summary = balance >= 0 ? `Este m\xEAs voc\xEA tem R$${income.toFixed(2)} de entradas e R$${expenses.toFixed(2)} de sa\xEDdas, com saldo positivo de R$${balance.toFixed(2)}.` : `Este m\xEAs as sa\xEDdas (R$${expenses.toFixed(2)}) superaram as entradas (R$${income.toFixed(2)}).`;
  let next;
  if (balance < 0) next = "Pr\xF3ximo passo: identificar 1 ou 2 gastos n\xE3o essenciais pra cortar nas pr\xF3ximas semanas.";
  else if (top && top.percentage > 40) next = `Pr\xF3ximo passo: revisar ${top.category}, que concentra ${Math.round(top.percentage)}% dos gastos.`;
  else if (savings === 0 && state.goals.length > 0) next = "Pr\xF3ximo passo: separar um valor pequeno pra alguma meta antes do fim do m\xEAs.";
  else next = "Continua firme \u2014 segue acompanhando seus gastos por categoria.";
  return `${summary} ${next}`;
}
const CATEGORY_KEYWORDS = [
  { category: "Streaming", keywords: [
    "netflix",
    "amazon prime",
    "prime video",
    "spotify",
    "disney+",
    "disney plus",
    "hbo max",
    "hbo",
    "globoplay",
    "deezer",
    "youtube premium",
    "apple music",
    "paramount",
    "crunchyroll",
    " max "
  ] },
  { category: "Moradia", keywords: [
    "aluguel",
    "condom\xEDnio",
    "condominio",
    "conta de luz",
    "conta de \xE1gua",
    "conta de agua",
    "luz",
    "\xE1gua",
    "agua",
    "energia",
    "internet",
    "wi-fi",
    "wifi",
    "vivo fibra",
    "claro fibra",
    "tim fibra",
    "oi fibra",
    "g\xE1s",
    "gas",
    "iptu"
  ] },
  { category: "Sa\xFAde", keywords: [
    "farm\xE1cia",
    "farmacia",
    "rem\xE9dio",
    "remedio",
    "m\xE9dico",
    "medico",
    "consulta",
    "dentista",
    "psic\xF3logo",
    "psicologo",
    "academia",
    "exame",
    "plano de sa\xFAde",
    "drogasil",
    "pague menos",
    "drogaria"
  ] },
  { category: "Apostas", keywords: [
    "aposta esportiva",
    "aposta",
    "apostei",
    "bet365",
    "betano",
    "sportingbet",
    "pixbet",
    "blaze",
    "cassino",
    " bet ",
    "na bet",
    "loteria",
    "raspadinha"
  ] },
  { category: "Mercado", keywords: [
    "supermercado",
    "mercado livre",
    "hortifruti",
    "a\xE7ougue",
    "acougue",
    "feira",
    "mercearia",
    "carrefour",
    "extra",
    "assa\xED",
    "assai",
    "atacad\xE3o",
    "atacadao",
    "guanabara",
    "prezunic",
    "p\xE3o de a\xE7\xFAcar",
    "pao de acucar",
    "mercado"
  ] },
  { category: "Alimenta\xE7\xE3o", keywords: [
    "99 food",
    "99food",
    "ifood",
    "rappi",
    "delivery",
    "restaurante",
    "sushi",
    "pizzaria",
    "pizza",
    "hamburgueria",
    "hamburguer",
    "hamb\xFArguer",
    "burger",
    "lanchonete",
    "lanche",
    "pastelaria",
    "pastel",
    "cafeteria",
    "caf\xE9",
    "cafe",
    "padaria",
    "conveni\xEAncia",
    "conveniencia",
    "a\xE7a\xED",
    "acai",
    "a\xE7ai",
    "sorveteria",
    "marmita",
    "self service",
    "almo\xE7o",
    "almoco",
    "jantar",
    "comida",
    "refei\xE7\xE3o",
    "refeicao",
    "fast food",
    "mc donald's",
    "mc donalds",
    "mcdonalds",
    "mc donald",
    "burger king",
    " bk ",
    "subway",
    "bob's",
    "bobs",
    "habibs",
    "habib's"
  ] },
  { category: "Educa\xE7\xE3o", keywords: [
    "faculdade",
    "mensalidade",
    "udemy",
    "alura",
    " dio ",
    "livro",
    "ebook",
    "treinamento",
    "bootcamp",
    "certificado",
    "curso",
    "aula",
    "escola"
  ] },
  { category: "Transporte", keywords: [
    "mototaxi",
    "moto taxi",
    "uber",
    "t\xE1xi",
    "taxi",
    "99pop",
    "corrida",
    "\xF4nibus",
    "onibus",
    "metr\xF4",
    "metro",
    "trem",
    "ped\xE1gio",
    "pedagio",
    "estacionamento",
    "posto",
    "gasolina",
    "\xE1lcool",
    "alcool",
    "etanol",
    "diesel",
    "gnv",
    "abasteci",
    "abastecimento",
    "combust\xEDvel",
    "combustivel",
    "shell",
    "ipiranga",
    "petrobras"
  ] },
  { category: "Compras Online", keywords: [
    "shopee",
    "shein",
    "aliexpress",
    "magalu",
    "magazine luiza",
    "amazon",
    "compra online",
    "shopping"
  ] },
  { category: "Lazer", keywords: [
    "cinema",
    "bar",
    "balada",
    "show",
    "jogo",
    "passeio",
    "festa",
    "parque"
  ] },
  { category: "Assinaturas", keywords: ["assinatura", "plano"] }
];
function detectCategory(text) {
  const lower = ` ${text.toLowerCase()} `;
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  if (/\b99\b/.test(lower) && !/99\s?food/.test(lower)) {
    if (/\b99\b(?!\s*[,\.]\d)/.test(lower)) return "Transporte";
  }
  return null;
}
const SUGGESTED_PICK_CATEGORIES = [
  "Alimenta\xE7\xE3o",
  "Mercado",
  "Moradia",
  "Transporte",
  "Sa\xFAde",
  "Streaming",
  "Educa\xE7\xE3o",
  "Compras Online",
  "Lazer",
  "Apostas",
  "Outros"
];
function resolveCategoryFromText(text) {
  const lower = text.toLowerCase().trim();
  if (!lower) return null;
  const stripped = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const cat of SUGGESTED_PICK_CATEGORIES) {
    const c = cat.toLowerCase();
    const cs = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower === c || stripped === cs || lower.includes(c) || stripped.includes(cs)) {
      return cat;
    }
  }
  const detected = detectCategory(lower);
  if (detected && SUGGESTED_PICK_CATEGORIES.includes(detected)) return detected;
  return null;
}
const CORRECTION_ALIAS_MAP = {
  // Alimentação
  "alimentacao": "Alimenta\xE7\xE3o",
  "alimenta\xE7\xE3o": "Alimenta\xE7\xE3o",
  "comida": "Alimenta\xE7\xE3o",
  "mercado": "Alimenta\xE7\xE3o",
  "mercadinho": "Alimenta\xE7\xE3o",
  "supermercado": "Alimenta\xE7\xE3o",
  "padaria": "Alimenta\xE7\xE3o",
  "cafeteria": "Alimenta\xE7\xE3o",
  "lanchonete": "Alimenta\xE7\xE3o",
  "pizzaria": "Alimenta\xE7\xE3o",
  "pizza": "Alimenta\xE7\xE3o",
  "sushi": "Alimenta\xE7\xE3o",
  "restaurante": "Alimenta\xE7\xE3o",
  "hamburgueria": "Alimenta\xE7\xE3o",
  "pastelaria": "Alimenta\xE7\xE3o",
  "conveniencia": "Alimenta\xE7\xE3o",
  "conveni\xEAncia": "Alimenta\xE7\xE3o",
  "99 food": "Alimenta\xE7\xE3o",
  "ifood": "Alimenta\xE7\xE3o",
  "delivery": "Alimenta\xE7\xE3o",
  // Transporte
  "transporte": "Transporte",
  "uber": "Transporte",
  "99": "Transporte",
  "gasolina": "Transporte",
  "combustivel": "Transporte",
  "combust\xEDvel": "Transporte",
  "abastecimento": "Transporte",
  "posto": "Transporte",
  "gnv": "Transporte",
  "moto taxi": "Transporte",
  "mototaxi": "Transporte",
  "onibus": "Transporte",
  "\xF4nibus": "Transporte",
  // Moradia
  "moradia": "Moradia",
  "internet": "Moradia",
  "aluguel": "Moradia",
  "condominio": "Moradia",
  "condom\xEDnio": "Moradia",
  "agua": "Moradia",
  "\xE1gua": "Moradia",
  "energia": "Moradia",
  "luz": "Moradia",
  // Saúde
  "saude": "Sa\xFAde",
  "sa\xFAde": "Sa\xFAde",
  "farmacia": "Sa\xFAde",
  "farm\xE1cia": "Sa\xFAde",
  "remedio": "Sa\xFAde",
  "rem\xE9dio": "Sa\xFAde",
  "consulta": "Sa\xFAde",
  "exame": "Sa\xFAde",
  // Streaming
  "streaming": "Streaming",
  "netflix": "Streaming",
  "amazon prime": "Streaming",
  "prime video": "Streaming",
  "spotify": "Streaming",
  "disney+": "Streaming",
  "disney plus": "Streaming",
  "hbo": "Streaming",
  "max": "Streaming",
  "hbo max": "Streaming",
  // Educação / Compras / Lazer / Outros
  "educacao": "Educa\xE7\xE3o",
  "educa\xE7\xE3o": "Educa\xE7\xE3o",
  "compras online": "Compras Online",
  "compras": "Compras Online",
  "lazer": "Lazer",
  "assinaturas": "Streaming",
  "outros": "Outros"
};
function normalizeCorrectionCategory(text) {
  const lower = text.toLowerCase().trim().replace(/[.!?]+$/g, "");
  if (!lower) return null;
  const stripped = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (CORRECTION_ALIAS_MAP[lower]) return CORRECTION_ALIAS_MAP[lower];
  if (CORRECTION_ALIAS_MAP[stripped]) return CORRECTION_ALIAS_MAP[stripped];
  const aliases = Object.keys(CORRECTION_ALIAS_MAP).sort((a, b) => b.length - a.length);
  for (const a of aliases) {
    if (lower.includes(a) || stripped.includes(a)) return CORRECTION_ALIAS_MAP[a];
  }
  return null;
}
function resolveCategoryStrict(text) {
  const lower = text.toLowerCase().trim().replace(/[.!?]+$/g, "");
  if (!lower) return null;
  if (lower.split(/\s+/).length > 3) return null;
  return normalizeCorrectionCategory(lower);
}
function hasCategoryKeyword(lower) {
  return detectCategory(lower) !== null;
}
const SAVE_VERBS = [
  "guardei",
  "guardar",
  "guarda",
  "salvei",
  "salvar",
  "salva ",
  "separei",
  "separar",
  "poupei",
  "poupar",
  "reservei",
  "reservar",
  "aportei",
  "aportar",
  "aporte",
  "depositei",
  "depositar na meta",
  "aloquei",
  "alocar",
  "alocar na meta",
  "coloquei na meta",
  "colocar na meta",
  "colocar pra meta",
  "investir na meta",
  "investi na meta",
  "guardar para meta",
  "guardar pra meta",
  "guardar para a meta",
  "guardar pra a meta"
];
const SAVE_PHRASES = ["para a meta", "pra meta", "para minha meta", "pra minha meta", "na minha meta", "na meta de", "pra reserva", "para reserva", "para a reserva"];
const CREATE_GOAL_VERBS = ["quero economizar", "quero juntar", "quero poupar", "minha meta \xE9", "meta de", "objetivo de", "criar meta"];
function parseInput(text) {
  const lower = text.toLowerCase().trim();
  const amountMatch = lower.match(/r?\$?\s?(\d[\d.,]*)/);
  if (!amountMatch) return null;
  const amount = parseAmount(amountMatch[1]);
  if (amount <= 0) return null;
  const description = text;
  const isCreateGoal = CREATE_GOAL_VERBS.some((v) => lower.includes(v));
  if (isCreateGoal) {
    const nameMatch = lower.match(/(?:para|pra|pro)\s+([a-záéíóúâêôãõç\s]+?)(?:\s|$|\.)/);
    const goalName = nameMatch ? capitalize(nameMatch[1].trim()) : `Economizar R$${amount.toFixed(0)}`;
    return { kind: "create_goal", amount, goalName, description };
  }
  const isContribution = SAVE_VERBS.some((v) => lower.includes(v));
  if (isContribution) {
    let goalHint = null;
    const hintMatch = lower.match(/(?:para|pra|pro)\s+(?:a\s+)?(?:minha\s+)?(?:meta(?:\s+de|\s+do|\s+da)?\s+)?([a-záéíóúâêôãõç0-9\s]+?)(?:\s|$|\.)/);
    if (hintMatch) {
      goalHint = hintMatch[1].trim();
    } else if (lower.includes("meta")) {
      goalHint = null;
    }
    return { kind: "goal_contribution", amount, goalHint, description };
  }
  const isContribution2 = SAVE_PHRASES.some((p) => lower.includes(p));
  if (isContribution2) {
    let goalHint = null;
    const hintMatch = lower.match(/(?:para|pra|pro|na)\s+(?:a\s+)?(?:minha\s+)?(?:meta(?:\s+de|\s+do|\s+da)?\s+)?([a-záéíóúâêôãõç0-9\s]+?)(?:\s|$|\.)/);
    if (hintMatch) goalHint = hintMatch[1].trim();
    return { kind: "goal_contribution", amount, goalHint, description };
  }
  const isExplicitExpense = EXPENSE_VERBS.some((v) => lower.includes(v));
  const incomeCategory = isExplicitExpense ? null : detectIncomeCategory(lower);
  const isIncome = incomeCategory !== null;
  if (!isIncome && !hasCategoryKeyword(lower)) {
    if (isExplicitExpense) {
      return { kind: "transaction_pending_category", amount, description };
    }
    return null;
  }
  const category = isIncome ? incomeCategory : detectCategory(text) ?? "Outros";
  return { kind: "transaction", type: isIncome ? "income" : "expense", amount, category, description };
}
const EXPENSE_VERBS = [
  "gastei",
  "gastar",
  "paguei",
  "pagar",
  "comprei",
  "comprar",
  "perdi",
  "apostei",
  "fiz uma aposta",
  "fiz aposta",
  "joguei na",
  "torrei",
  "desembolsei",
  "investi em",
  "banquei"
];
const INCOME_KEYWORDS = [
  { category: "B\xF4nus", keywords: ["b\xF4nus", "bonus", "bonifica\xE7\xE3o", "bonificacao", "comiss\xE3o", "comissao", "pr\xEAmio do trabalho", "premio do trabalho", "extra do trabalho"] },
  { category: "Reembolso", keywords: ["reembolso", "devolu\xE7\xE3o", "devolucao", "estorno"] },
  { category: "Pix Recebido", keywords: ["pix recebido", "recebi pix", "recebi um pix", "pix de", "um pix", "transfer\xEAncia recebida", "transferencia recebida", "recebi transfer\xEAncia", "recebi transferencia", "pix"] },
  { category: "Renda Extra", keywords: ["freelance", "freela", "trabalho extra", "venda", "vendi", "fiz uma venda", "bico"] },
  { category: "Ganhos Eventuais", keywords: ["pr\xEAmio", "premio", "sorteio", "aposta", " bet", "na bet", "cashback", "ganhei na", "ganhei no"] },
  { category: "Sal\xE1rio", keywords: ["sal\xE1rio", "salario", "folha", "pagamento mensal", "pagamento do trabalho", "meu sal\xE1rio", "meu salario"] }
];
const GENERIC_INCOME_VERBS = ["recebi", "ganhei", "caiu na conta", "caiu", "entrou", "pagamento recebido", "renda"];
function detectIncomeCategory(lower) {
  for (const { category, keywords } of INCOME_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  if (GENERIC_INCOME_VERBS.some((v) => lower.includes(v))) return "Outros Ganhos";
  return null;
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function parseAmount(raw) {
  let cleaned = raw.replace(/\s/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  return parseFloat(cleaned) || 0;
}
function findMatchingGoal(goals, hint) {
  if (goals.length === 0) return null;
  const active = goals.filter((g) => g.currentAmount < g.targetAmount);
  const pool = active.length > 0 ? active : goals;
  if (hint) {
    const h = hint.toLowerCase();
    const exact = pool.find((g) => g.name.toLowerCase() === h);
    if (exact) return exact;
    const partial = pool.find((g) => g.name.toLowerCase().includes(h) || h.includes(g.name.toLowerCase()));
    if (partial) return partial;
  }
  return [...pool].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
}
const BET_KEYWORDS = ["bet", "aposta", "apostei", "cassino", "loteria", "raspadinha"];
function isBetTransaction(t) {
  const d = t.description.toLowerCase();
  return BET_KEYWORDS.some((k) => d.includes(k));
}
const EXPENSE_RESPONSES = {
  "Moradia": [
    "Registrado. Seus gastos fixos continuam representando uma parte importante do seu or\xE7amento.",
    "Anotado. Moradia costuma pesar \u2014 vale acompanhar o quanto consome da sua renda.",
    "Registrado. Contas de casa entram no grupo dos gastos essenciais, mas d\xE1 pra revisar de tempos em tempos."
  ],
  "Alimenta\xE7\xE3o": [
    "Anotado. Alimenta\xE7\xE3o segue sendo uma categoria relevante este m\xEAs.",
    "Registrado. Vale observar quanto vai pra mercado e quanto pra delivery \u2014 costuma fazer diferen\xE7a.",
    "Anotado. Comida \xE9 essencial, mas pequenos h\xE1bitos aqui podem render uma boa economia."
  ],
  "Compras Online": [
    "Registrado. Compras online aumentaram um pouco. Vale acompanhar.",
    "Anotado. Esse tipo de gasto some r\xE1pido do radar \u2014 bom acompanhar de perto.",
    "Registrado. Se poss\xEDvel, pensa 24h antes de finalizar a pr\xF3xima compra n\xE3o essencial."
  ],
  "Sa\xFAde": [
    "Registrado. Cuidar da sa\xFAde tamb\xE9m faz parte do equil\xEDbrio financeiro.",
    "Anotado. Sa\xFAde \xE9 prioridade \u2014 e ainda assim vale comparar pre\xE7os de rem\xE9dios e exames."
  ],
  "Lazer": [
    "Registrado. Lazer faz bem \u2014 s\xF3 vale ficar de olho pra n\xE3o pesar no fim do m\xEAs.",
    "Anotado. Equil\xEDbrio \xE9 tudo: se divertir sem comprometer o or\xE7amento."
  ],
  "Transporte": [
    "Registrado. Transporte costuma ser um gasto recorrente \u2014 vale observar o total no fim do m\xEAs.",
    "Anotado. Pequenas otimiza\xE7\xF5es de rota ou meio podem reduzir bem essa categoria."
  ],
  "Streaming": [
    "Registrado. Vale revisar quais assinaturas voc\xEA realmente usa.",
    "Anotado. Streaming acumula r\xE1pido \u2014 checa se tem algo que d\xE1 pra cortar."
  ],
  "Assinaturas": [
    "Registrado. Assinaturas s\xE3o gastos invis\xEDveis \u2014 bom revisar de tempos em tempos."
  ],
  "Educa\xE7\xE3o": [
    "Registrado. Investir em educa\xE7\xE3o costuma valer a pena no longo prazo."
  ],
  "Outros": [
    "Registrado. Anotei aqui no seu controle.",
    "Anotado. Vou acompanhar junto com os outros gastos do m\xEAs."
  ]
};
const INCOME_RESPONSES = {
  "B\xF4nus": [
    "Boa. Entrou um valor extra. Pode ser uma boa oportunidade para fortalecer sua meta.",
    "\xD3timo. B\xF4nus \xE9 uma chance perfeita pra acelerar uma meta sem mexer na rotina."
  ],
  "Reembolso": [
    "\xD3timo. Esse reembolso pode ajudar a recompor seu saldo.",
    "Registrado. Reembolso \xE9 dinheiro que voltou \u2014 bom momento pra direcionar pra algo importante."
  ],
  "Pix Recebido": [
    "Registrado. Pix recebido entrou no seu saldo.",
    "Anotado. Se n\xE3o tem destino certo, vale considerar guardar uma parte."
  ],
  "Renda Extra": [
    "Boa. Renda extra \xE9 sempre bem-vinda \u2014 uma parte aqui pode acelerar suas metas.",
    "Registrado. Trabalho extra rendendo bem \u2014 considera separar uma fatia pra poupar."
  ],
  "Ganhos Eventuais": [
    "Registrado. Entrou um ganho eventual. Se quiser, parte desse valor pode fortalecer sua reserva.",
    "Anotado. Ganhos assim s\xE3o imprevis\xEDveis \u2014 vale aproveitar pra refor\xE7ar uma meta."
  ],
  "Sal\xE1rio": [
    "Registrado. Sal\xE1rio no caixa \u2014 bom momento pra separar o que vai pra metas antes de come\xE7ar a gastar.",
    "Anotado. Com o sal\xE1rio entrando, vale planejar o m\xEAs com calma."
  ],
  "Outros Ganhos": [
    "Registrado. Anotei essa entrada no seu saldo."
  ]
};
function pickDifferent(options, avoid) {
  if (options.length === 0) return "";
  if (options.length === 1) return options[0];
  const filtered = avoid ? options.filter((o) => o !== avoid) : options;
  const pool = filtered.length > 0 ? filtered : options;
  return pool[Math.floor(Math.random() * pool.length)];
}
function generateContextualResponse(state, parsed, lastResponse) {
  const { income, expenses } = getMonthlyTotals(state);
  const userIncome = state.user.monthlyIncome || income;
  const activeGoal = state.goals.find((g) => g.currentAmount < g.targetAmount);
  const lower = parsed.description.toLowerCase();
  if (parsed.type === "income") {
    const isBetWin = BET_KEYWORDS.some((k) => lower.includes(k));
    let base;
    if (isBetWin) {
      base = "Registrado. Entrou um ganho eventual. Se quiser, parte desse valor pode fortalecer sua reserva.";
    } else {
      const pool2 = INCOME_RESPONSES[parsed.category] || INCOME_RESPONSES["Outros Ganhos"];
      base = pickDifferent(pool2, lastResponse);
    }
    if (activeGoal && parsed.amount >= 20 && parsed.category !== "Sal\xE1rio" && !isBetWin) {
      base += ` Esses R$${parsed.amount.toFixed(2)} j\xE1 podem representar um avan\xE7o na sua meta "${activeGoal.name}".`;
    }
    return base;
  }
  const isBetExpense = BET_KEYWORDS.some((k) => lower.includes(k));
  if (isBetExpense) {
    const recentBets = state.transactions.filter((t) => t.type === "expense" && isBetTransaction(t));
    if (recentBets.length >= 2) {
      return "Percebi perdas recentes com apostas. Talvez seja um bom momento para definir um limite.";
    }
    return "Registrado. Vale acompanhar para apostas n\xE3o come\xE7arem a impactar seu or\xE7amento.";
  }
  if (userIncome > 0 && expenses > userIncome) {
    const msg = "Voc\xEA j\xE1 gastou mais do que recebe este m\xEAs. Bora reorganizar?";
    if (msg !== lastResponse) return msg;
  }
  if (userIncome > 0 && expenses > userIncome * 0.9) {
    const msg = "Seus gastos j\xE1 passaram de 90% da sua renda este m\xEAs. Hora de pisar no freio.";
    if (msg !== lastResponse) return msg;
  }
  const pool = EXPENSE_RESPONSES[parsed.category] || EXPENSE_RESPONSES["Outros"];
  return pickDifferent(pool, lastResponse);
}
function generateInsight(_state, _justAddedCategory) {
  return null;
}
function computeSavingsSuggestion(state) {
  const { income, expenses } = getMonthlyTotals(state);
  const userIncome = state.user.monthlyIncome || income;
  if (userIncome <= 0) return null;
  if (expenses >= userIncome * 0.85) return null;
  const safety = userIncome * 0.1;
  const surplus = userIncome - expenses - safety;
  if (surplus <= 100) return null;
  const activeGoal = state.goals.find((g) => g.currentAmount < g.targetAmount);
  if (!activeGoal) return null;
  const amount = Math.round(surplus * 0.3 / 10) * 10;
  if (amount < 50) return null;
  return { amount, goal: activeGoal, surplus };
}
function generateConfirmation(state, parsed, goal) {
  if (parsed.kind === "transaction") {
    if (parsed.type === "income") {
      return `Registrei R$${parsed.amount.toFixed(2)} como receita em ${parsed.category}.`;
    }
    return `Registrei R$${parsed.amount.toFixed(2)} como despesa em ${parsed.category}.`;
  }
  if (parsed.kind === "goal_contribution" && goal) {
    return `Adicionei R$${parsed.amount.toFixed(2)} \xE0 sua meta "${goal.name}".`;
  }
  if (parsed.kind === "create_goal") {
    return `Meta "${parsed.goalName}" criada \u2014 R$${parsed.amount.toFixed(2)}.`;
  }
  return "";
}
function createTransaction(parsed) {
  return {
    id: crypto.randomUUID(),
    type: parsed.type,
    amount: parsed.amount,
    category: parsed.category,
    description: parsed.description,
    date: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createGoalContribution(amount, goal, description) {
  return {
    id: crypto.randomUUID(),
    type: "goal_contribution",
    amount,
    category: "Meta",
    description,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    goalId: goal.id
  };
}
const ADVICE_TRIGGERS = [
  "como economizar",
  "como guardar",
  "como poupar",
  "como juntar",
  "guardar dinheiro",
  "juntar dinheiro",
  "poupar dinheiro",
  "dicas",
  "dica de",
  "dica pra",
  "dica para",
  "alguma dica",
  "me ajuda a",
  "me ajude a",
  "como fa\xE7o para",
  "como fa\xE7o pra",
  "como posso",
  "como gastar",
  "como organizar",
  "como controlar",
  "como come\xE7ar",
  "como investir",
  "como melhorar",
  "como aproveitar",
  "aproveitar melhor",
  "melhorar meus gastos",
  "melhorar meu dinheiro",
  "o que fa\xE7o",
  "o que eu fa\xE7o",
  "sugest\xE3o",
  "sugest\xF5es",
  "conselho",
  "conselhos",
  "me da uma dica",
  "me d\xE1 uma dica",
  "me da dicas",
  "me d\xE1 dicas",
  "finan\xE7as",
  "financas"
];
const CORRECTION_TRIGGERS = [
  "corrigir",
  "corrige",
  "corrija",
  "mudar",
  "muda ",
  "mude",
  "alterar",
  "altera ",
  "altere",
  "trocar",
  "troca ",
  "troque",
  "categoria errada",
  "t\xE1 errado",
  "ta errado",
  "est\xE1 errado",
  "errei a categoria",
  "isso n\xE3o \xE9",
  "isso nao e",
  "n\xE3o \xE9 ",
  "nao e "
];
const CATEGORY_ALIASES = {
  "moradia": "Moradia",
  "casa": "Moradia",
  "alimenta\xE7\xE3o": "Alimenta\xE7\xE3o",
  "alimentacao": "Alimenta\xE7\xE3o",
  "transporte": "Transporte",
  "streaming": "Streaming",
  "sa\xFAde": "Sa\xFAde",
  "saude": "Sa\xFAde",
  "educa\xE7\xE3o": "Educa\xE7\xE3o",
  "educacao": "Educa\xE7\xE3o",
  "assinaturas": "Assinaturas",
  "assinatura": "Assinaturas",
  "compras online": "Compras Online",
  "shopping": "Compras Online",
  "compras": "Compras Online",
  "lazer": "Lazer",
  "outros": "Outros"
};
function detectTargetCategory(lower) {
  const entries = Object.entries(CATEGORY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, cat] of entries) {
    if (lower.includes(alias)) return cat;
  }
  return null;
}
function findKeywordCategory(lower) {
  const all = [];
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    for (const kw of keywords) all.push({ keyword: kw, category });
  }
  all.sort((a, b) => b.keyword.length - a.keyword.length);
  for (const e of all) {
    if (lower.includes(e.keyword)) return e;
  }
  return null;
}
function detectConversationalIntent(text) {
  const lower = text.toLowerCase().trim();
  if (/^(oi|olá|ola|opa|eai|e aí|bom dia|boa tarde|boa noite|hey|hello)\b/.test(lower)) {
    return { kind: "greeting" };
  }
  if (/(obrigad|valeu|brigad|thanks|tmj)/.test(lower)) {
    return { kind: "thanks" };
  }
  if (!/\d/.test(lower) && /\s(é|e|eh)\s/.test(` ${lower} `)) {
    const newCategory = detectTargetCategory(lower);
    const found = findKeywordCategory(lower);
    if (newCategory && found && found.category !== newCategory) {
      return { kind: "correction", targetHint: found.keyword, newCategory };
    }
  }
  if (!/\d/.test(lower)) {
    const natural = lower.match(
      /^(?:isso\s+|esse\s+|essa\s+)?(?:era|foi|n[ãa]o\s+(?:é|e|eh)|na\s+verdade\s+(?:era|foi|é|e|eh))\s+(.+?)[\s.!?]*$/
    );
    if (natural) {
      const tail = natural[1].trim();
      const normalized = normalizeCorrectionCategory(tail);
      const direct = !normalized ? detectTargetCategory(tail) : null;
      const viaKeyword = !normalized && !direct ? detectCategory(tail) : null;
      const newCategory = normalized ?? direct ?? viaKeyword;
      if (newCategory) {
        return { kind: "correction", targetHint: null, newCategory };
      }
    }
  }
  const flipToSavings = /(era|virou|na verdade(?:\s+é)?)\s+(meta|reserva|poupança|poupanca)|(isso|esse)\s+(não|nao)\s+(é|e)\s+(gasto|despesa)|isso era pra (meta|guardar|poupar)|era pra meta|era pra reserva/.test(lower);
  if (flipToSavings) {
    let goalHint = null;
    const hintMatch = lower.match(/(?:meta(?:\s+de|\s+do|\s+da)?\s+)([a-záéíóúâêôãõç0-9\s]+?)(?:\s|$|\.)/);
    if (hintMatch) goalHint = hintMatch[1].trim();
    return { kind: "correction", targetHint: null, newCategory: null, newType: "goal_contribution", goalHint };
  }
  const flipToExpense = /(é|e|virou|na verdade)\s+(despesa|gasto|saída|saida)|despesa,?\s+não|despesa,?\s+nao|aposta é despesa|isso é gasto/.test(lower);
  const flipToIncome = /(é|e|virou|na verdade)\s+(receita|ganho|renda|entrada)|receita,?\s+não|receita,?\s+nao|reembolso é receita|isso é ganho/.test(lower);
  if (flipToExpense || flipToIncome) {
    let targetHint = null;
    for (const { keywords } of CATEGORY_KEYWORDS) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          targetHint = kw;
          break;
        }
      }
      if (targetHint) break;
    }
    return {
      kind: "correction",
      targetHint,
      newCategory: detectTargetCategory(lower),
      newType: flipToExpense ? "expense" : "income"
    };
  }
  const isCorrection = CORRECTION_TRIGGERS.some((t) => lower.includes(t));
  if (isCorrection) {
    const newCategory = normalizeCorrectionCategory(lower) ?? detectTargetCategory(lower);
    let targetHint = null;
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
      if (category === newCategory) continue;
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          targetHint = kw;
          break;
        }
      }
      if (targetHint) break;
    }
    return { kind: "correction", targetHint, newCategory };
  }
  if (/(saúde financeira|saude financeira|minhas finanças|minhas financas|meu financeiro|situação financeira|situacao financeira|score financeiro|estou indo bem financeiramente|como estou financeiramente|estou gastando muito|gastando demais|gastando bastante|gastei demais|financial health|finance status|how am i doing financially)/.test(lower) || /como estão minhas finanças|como estao minhas financas|como está meu financeiro|como esta meu financeiro/.test(lower)) {
    const focus = /(gastando|gastei demais|gasto demais|gastando muito|gastando demais|gastando bastante)/.test(lower) ? "spending" : /(saúde financeira|saude financeira|score|saudavel|saudável)/.test(lower) ? "overall" : "situation";
    return { kind: "financial_health", focus };
  }
  const isAdvice = ADVICE_TRIGGERS.some((t) => lower.includes(t));
  if (isAdvice) {
    if (/(invest|render|aplica)/.test(lower)) return { kind: "advice", topic: "invest" };
    if (/(gast|control|organiz|orçament|orcament|limit|aproveitar|melhorar)/.test(lower)) return { kind: "advice", topic: "budget" };
    if (/(economi|guard|poup|junt)/.test(lower)) return { kind: "advice", topic: "save" };
    if (/(gastar melhor|gastar bem|reduzir)/.test(lower)) return { kind: "advice", topic: "spend" };
    return { kind: "advice", topic: "general" };
  }
  if (/(saldo|quanto tenho|quanto sobrou|quanto sobra)/.test(lower)) return { kind: "balance" };
  if (/(gasto|gastei|despesa|gastos do mês|gastos do mes)/.test(lower) && /(quanto|qual|meus|meu)/.test(lower)) {
    return { kind: "expenses_query" };
  }
  if (/(meta|metas|poupei|poupanç|poupanc)/.test(lower) && /(quanto|qual|minhas|tenho)/.test(lower)) {
    return { kind: "goals_query" };
  }
  if (/(o que (você|voce) faz|como funciona|para que serve|pra que serve|me explica)/.test(lower)) {
    return { kind: "help_general" };
  }
  return { kind: "unclear" };
}
const ADVICE_RESPONSES = {
  save: [
    "Boa pergunta. Algumas formas simples de come\xE7ar:\n\n- definir um valor fixo para guardar todo m\xEAs\n- revisar gastos recorrentes como assinaturas\n- acompanhar seus gastos por categoria",
    "Se voc\xEA quiser come\xE7ar simples:\n\n- tenta guardar uma pequena porcentagem do que entra\n- evita gastar antes de separar esse valor\n- come\xE7a com metas pequenas e realistas",
    "Uma boa estrat\xE9gia \xE9:\n\n- separar o valor pra poupar logo que o dinheiro entra\n- automatizar essa transfer\xEAncia se poss\xEDvel\n- acompanhar o progresso ao longo do m\xEAs"
  ],
  spend: [
    "Pra gastar melhor, vale tentar:\n\n- reduzir gastos invis\xEDveis (streaming, compras online)\n- definir limites por categoria\n- pensar 24h antes de compras n\xE3o essenciais",
    "Algumas ideias pr\xE1ticas:\n\n- listar os gastos fixos do m\xEAs\n- identificar o que d\xE1 pra cortar sem dor\n- priorizar o que realmente traz valor pra voc\xEA"
  ],
  invest: [
    "Antes de investir, o ideal \xE9:\n\n- ter uma reserva de emerg\xEAncia (3 a 6 meses de gastos)\n- quitar d\xEDvidas caras primeiro\n- estudar op\xE7\xF5es simples como Tesouro Direto e CDBs",
    "Pra come\xE7ar a investir bem:\n\n- entenda seu perfil (conservador, moderado, arrojado)\n- comece com pouco e aumente aos poucos\n- diversifique conforme for aprendendo"
  ],
  budget: [
    "Pra organizar o or\xE7amento:\n\n- anote tudo que entra e sai por algumas semanas\n- agrupe os gastos em categorias\n- defina um teto por categoria e acompanhe",
    "Uma boa estrat\xE9gia \xE9:\n\n- reduzir gastos invis\xEDveis (streaming, compras online)\n- definir limites por categoria\n- acompanhar seu progresso ao longo do m\xEAs"
  ],
  general: [
    "Algumas dicas que costumam funcionar:\n\n- guarde um valor fixo todo m\xEAs, mesmo que pequeno\n- revise assinaturas e gastos recorrentes\n- acompanhe seus gastos por categoria pra enxergar padr\xF5es",
    "No geral, o que mais ajuda \xE9:\n\n- ter clareza de quanto entra e sai\n- separar o que vai poupar antes de gastar\n- ter metas concretas pra se motivar"
  ]
};
function getAdviceResponse(topic) {
  const opts = ADVICE_RESPONSES[topic];
  return opts[Math.floor(Math.random() * opts.length)];
}
function getContextualAdvice(state, topic) {
  const { income, expenses } = getMonthlyTotals(state);
  const cats = getCategoryTotals(state);
  const top = cats[0];
  const userIncome = state.user.monthlyIncome || income;
  const activeGoal = state.goals.find((g) => g.currentAmount < g.targetAmount);
  const lines = [];
  if (top && top.total > 0) {
    lines.push(`Olhando seus dados, **${top.category}** concentra a maior parte dos seus gastos este m\xEAs (R$${top.total.toFixed(2)}).`);
    if (top.percentage > 40) {
      const cut = Math.max(20, Math.round(top.total * 0.15 / 10) * 10);
      const goalLine = activeGoal ? ` e direcionar pra sua meta "${activeGoal.name}"` : "";
      lines.push(`Se conseguir reduzir uns R$${cut} a\xED${goalLine}, j\xE1 faz diferen\xE7a.`);
    }
  }
  if (userIncome > 0 && expenses > 0 && expenses > userIncome * 0.85) {
    lines.push(`Seus gastos j\xE1 representam ${Math.round(expenses / userIncome * 100)}% da sua renda. Vale segurar um pouco nas pr\xF3ximas semanas.`);
  }
  if (lines.length === 0) {
    return getAdviceResponse(topic);
  }
  const tip = {
    save: "Uma boa pr\xE1tica \xE9 separar o valor pra poupar logo que o dinheiro entra.",
    spend: "Tenta listar os gastos invis\xEDveis (streaming, delivery) e cortar 1 ou 2.",
    invest: "Antes de investir, garante uma reserva de 3 a 6 meses de gastos.",
    budget: "Define um teto mensal por categoria e acompanha aqui no app.",
    general: "Acompanhar os gastos por categoria j\xE1 ajuda a tomar decis\xF5es melhores."
  };
  lines.push(tip[topic]);
  return lines.join("\n\n");
}
function findRecentExpenseToCorrect(state, hint) {
  return findRecentTransactionToCorrect(state, hint, "expense");
}
function findRecentTransactionToCorrect(state, hint, preferType) {
  const all = state.transactions.filter((t) => t.type === "expense" || t.type === "income").sort((a, b) => b.date.localeCompare(a.date));
  if (all.length === 0) return null;
  if (hint) {
    const h = hint.toLowerCase();
    const match = all.find((t) => t.description.toLowerCase().includes(h));
    if (match) return match;
  }
  if (preferType) {
    const preferred = all.find((t) => t.type === preferType);
    if (preferred) return preferred;
  }
  return all[0];
}
function createGoal(name, amount) {
  return {
    id: crypto.randomUUID(),
    name,
    targetAmount: amount,
    currentAmount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
export {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_KEYWORDS,
  INCOME_KEYWORDS,
  SUGGESTED_PICK_CATEGORIES,
  computeHealthScore,
  computeSavingsSuggestion,
  createGoal,
  createGoalContribution,
  createTransaction,
  currentMonth,
  detectConversationalIntent,
  explainFinancialHealth,
  explainFinancialHealthByFocus,
  findMatchingGoal,
  findRecentExpenseToCorrect,
  findRecentTransactionToCorrect,
  generateConfirmation,
  generateContextualResponse,
  generateInsight,
  getAdviceResponse,
  getBalance,
  getCategoryTotal,
  getCategoryTotals,
  getContextualAdvice,
  getMonthlyTotals,
  normalizeCorrectionCategory,
  parseInput,
  resolveCategoryFromText,
  resolveCategoryStrict
};
