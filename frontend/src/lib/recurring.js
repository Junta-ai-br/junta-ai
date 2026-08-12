import {
  CATEGORY_KEYWORDS,
  INCOME_KEYWORDS,
  currentMonth
} from "./finance";
const ALL_KEYWORDS = (() => {
  const out = [];
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    for (const k of keywords) out.push({ category, keyword: k.trim() });
  }
  for (const { category, keywords } of INCOME_KEYWORDS) {
    for (const k of keywords) out.push({ category, keyword: k.trim() });
  }
  return out.sort((a, b) => b.keyword.length - a.keyword.length);
})();
const STOPWORDS = /* @__PURE__ */ new Set([
  "paguei",
  "pagar",
  "gastei",
  "gastar",
  "comprei",
  "comprar",
  "recebi",
  "ganhei",
  "cai",
  "caiu",
  "entrou",
  "recebido",
  "meu",
  "minha",
  "um",
  "uma",
  "de",
  "do",
  "da",
  "no",
  "na",
  "em",
  "para",
  "pra",
  "pro",
  "com",
  "sem",
  "reais",
  "real",
  "pix",
  "hoje",
  "ontem",
  "esse",
  "essa",
  "este",
  "esta",
  "mes",
  "m\xEAs",
  "agora",
  "rs",
  "r$"
]);
function normalize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\d+[,.]?\d*/g, " ").replace(/\s+/g, " ").trim();
}
function extractMerchantKey(description) {
  const norm = normalize(description);
  if (!norm) return null;
  for (const { keyword } of ALL_KEYWORDS) {
    const k = normalize(keyword);
    if (!k) continue;
    if (norm === k || norm.includes(` ${k} `) || norm.startsWith(`${k} `) || norm.endsWith(` ${k}`)) {
      return k;
    }
  }
  const token = norm.split(" ").find((t) => t.length >= 4 && !STOPWORDS.has(t));
  return token ?? null;
}
function getRecurringSignature(tx) {
  if (tx.type !== "expense" && tx.type !== "income") return null;
  const key = extractMerchantKey(tx.description);
  if (!key) return null;
  return `${tx.type}:${tx.category}:${key}`;
}
function monthOf(dateIso) {
  return dateIso.slice(0, 7);
}
function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function formatMerchantLabel(key) {
  const overrides = {
    salario: "Sal\xE1rio",
    condominio: "Condom\xEDnio",
    agua: "\xC1gua",
    disney: "Disney+",
    "disney plus": "Disney+",
    "hbo max": "HBO Max",
    hbo: "HBO",
    iptu: "IPTU",
    wifi: "Wi\u2011Fi",
    "prime video": "Prime Video"
  };
  if (overrides[key]) return overrides[key];
  return key.split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
const HIGH_CONFIDENCE_KEYS = /* @__PURE__ */ new Set([
  // Salary
  "salario",
  "salary",
  // Housing
  "aluguel",
  "internet",
  "condominio",
  "agua",
  "energia",
  "luz",
  "wifi",
  "iptu",
  "gas",
  // Streaming / subscriptions
  "netflix",
  "amazon prime",
  "prime video",
  "spotify",
  "disney plus",
  "disney+",
  "hbo",
  "hbo max",
  "max",
  "globoplay",
  "deezer",
  "youtube premium",
  "apple music",
  "paramount",
  "crunchyroll"
]);
const HIGH_CONFIDENCE_CATEGORIES = /* @__PURE__ */ new Set([
  "Sal\xE1rio",
  "Moradia",
  "Streaming",
  "Assinaturas"
]);
function buildGroups(state) {
  const map = /* @__PURE__ */ new Map();
  for (const tx of state.transactions) {
    const sig = getRecurringSignature(tx);
    if (!sig) continue;
    const bucket = map.get(sig) ?? { txs: [], months: /* @__PURE__ */ new Set() };
    bucket.txs.push(tx);
    bucket.months.add(monthOf(tx.date));
    map.set(sig, bucket);
  }
  const groups = [];
  for (const [signature, { txs, months }] of map) {
    if (txs.length < 2) continue;
    const [type, category, key] = signature.split(":");
    const highConfidence = HIGH_CONFIDENCE_CATEGORIES.has(category) || HIGH_CONFIDENCE_KEYS.has(key);
    if (!highConfidence && months.size < 2) continue;
    const baseline = state.recurring?.[signature]?.baseline;
    const amount = baseline ?? Math.round(median(txs.map((t) => t.amount)) * 100) / 100;
    groups.push({
      signature,
      type,
      category,
      merchantLabel: formatMerchantLabel(key),
      amount,
      months,
      occurrences: txs.length
    });
  }
  return groups;
}
function priority(g) {
  if (g.category === "Sal\xE1rio") return 0;
  if (g.category === "Moradia") return 1;
  if (g.category === "Streaming" || g.category === "Assinaturas") return 2;
  if (g.type === "income") return 3;
  return 4;
}
function getRecurringSuggestion(state) {
  const month = currentMonth();
  const groups = buildGroups(state);
  const eligible = groups.filter((g) => {
    const meta = state.recurring?.[g.signature];
    if (!meta?.confirmed) return false;
    if (meta?.dismissed === month) return false;
    if (meta?.suggestedMonth === month) return false;
    const alreadyThisMonth = state.transactions.some(
      (t) => t.date.startsWith(month) && getRecurringSignature(t) === g.signature
    );
    return !alreadyThisMonth;
  });
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => {
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return b.occurrences - a.occurrences;
  });
  const top = eligible[0];
  return {
    signature: top.signature,
    type: top.type,
    category: top.category,
    merchantLabel: top.merchantLabel,
    amount: top.amount
  };
}
function getRecurringCandidatePrompt(state, tx) {
  const signature = getRecurringSignature(tx);
  if (!signature) return null;
  const month = currentMonth();
  const meta = state.recurring?.[signature];
  if (meta?.confirmed) return null;
  if (meta?.dismissed === month) return null;
  if (meta?.candidatePromptMonth === month) return null;
  const groups = buildGroups(state);
  const group = groups.find((g) => g.signature === signature);
  if (!group) return null;
  if (group.occurrences < 2) return null;
  return {
    signature: group.signature,
    type: group.type,
    category: group.category,
    merchantLabel: group.merchantLabel,
    amount: group.amount
  };
}
function detectRecurringValueChange(state, tx) {
  const sig = getRecurringSignature(tx);
  if (!sig) return null;
  if (!state.recurring?.[sig]?.confirmed) return null;
  const groups = buildGroups(state);
  const group = groups.find((g) => g.signature === sig);
  if (!group) return null;
  const month = currentMonth();
  if (state.recurring?.[sig]?.updatePromptMonth === month) return null;
  const diff = Math.abs(tx.amount - group.amount);
  if (group.amount <= 0) return null;
  if (diff / group.amount < 0.2) return null;
  return {
    signature: sig,
    category: group.category,
    merchantLabel: group.merchantLabel,
    previousAmount: group.amount,
    newAmount: tx.amount
  };
}
const YES = /* @__PURE__ */ new Set(["sim", "s", "yes", "y", "ok", "pode", "claro", "positivo"]);
const NO = /* @__PURE__ */ new Set(["n\xE3o", "nao", "n", "no", "negativo", "agora n\xE3o", "agora nao"]);
function isYes(text) {
  const t = text.toLowerCase().trim().replace(/[.!?]+$/g, "");
  return YES.has(t);
}
function isNo(text) {
  const t = text.toLowerCase().trim().replace(/[.!?]+$/g, "");
  return NO.has(t);
}
export {
  detectRecurringValueChange,
  extractMerchantKey,
  getRecurringCandidatePrompt,
  getRecurringSignature,
  getRecurringSuggestion,
  isNo,
  isYes
};
