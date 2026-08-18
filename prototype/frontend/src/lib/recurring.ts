// Recurring transaction memory (MVP).
//
// Detects repeating transactions and suggests them to the user. The
// assistant NEVER registers automatically — it always asks first and
// waits for explicit confirmation (sim/não) before creating anything.
//
// Detection rules:
//   - Same type + category + merchant key (extracted from description)
//   - Appears at least 2 times across at least 2 distinct months
//   - Not yet present in the current month
//
// Suggestion rules:
//   - Only ONE suggestion at a time
//   - Priority: salary → housing → streaming/subscriptions → others
//   - Don't repeat in the same month (tracked via state.recurring)

import {
  CATEGORY_KEYWORDS,
  INCOME_KEYWORDS,
  FinanceState,
  Transaction,
  currentMonth,
} from './finance';

export interface RecurringSuggestion {
  signature: string;
  type: 'expense' | 'income';
  category: string;
  merchantLabel: string;
  amount: number;
}

export interface RecurringCandidatePrompt {
  signature: string;
  type: 'expense' | 'income';
  category: string;
  merchantLabel: string;
  amount: number;
}

export interface RecurringUpdatePrompt {
  signature: string;
  category: string;
  merchantLabel: string;
  previousAmount: number;
  newAmount: number;
}

const ALL_KEYWORDS: Array<{ category: string; keyword: string }> = (() => {
  const out: Array<{ category: string; keyword: string }> = [];
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    for (const k of keywords) out.push({ category, keyword: k.trim() });
  }
  for (const { category, keywords } of INCOME_KEYWORDS) {
    for (const k of keywords) out.push({ category, keyword: k.trim() });
  }
  // longest keywords first so "amazon prime" beats "amazon"
  return out.sort((a, b) => b.keyword.length - a.keyword.length);
})();

const STOPWORDS = new Set([
  'paguei', 'pagar', 'gastei', 'gastar', 'comprei', 'comprar', 'recebi',
  'ganhei', 'cai', 'caiu', 'entrou', 'recebido', 'meu', 'minha', 'um',
  'uma', 'de', 'do', 'da', 'no', 'na', 'em', 'para', 'pra', 'pro',
  'com', 'sem', 'reais', 'real', 'pix', 'hoje', 'ontem', 'esse', 'essa',
  'este', 'esta', 'mes', 'mês', 'agora', 'rs', 'r$',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\d+[,.]?\d*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract a stable merchant/topic key from a transaction description.
// Returns null when nothing meaningful is found.
export function extractMerchantKey(description: string): string | null {
  const norm = normalize(description);
  if (!norm) return null;
  // 1) Known keyword (merchant or recurring topic) wins.
  for (const { keyword } of ALL_KEYWORDS) {
    const k = normalize(keyword);
    if (!k) continue;
    if (norm === k || norm.includes(` ${k} `) || norm.startsWith(`${k} `) || norm.endsWith(` ${k}`)) {
      return k;
    }
  }
  // 2) Fallback: first meaningful token (>=4 chars, not a stopword).
  const token = norm.split(' ').find(t => t.length >= 4 && !STOPWORDS.has(t));
  return token ?? null;
}

export function getRecurringSignature(tx: Transaction): string | null {
  if (tx.type !== 'expense' && tx.type !== 'income') return null;
  const key = extractMerchantKey(tx.description);
  if (!key) return null;
  return `${tx.type}:${tx.category}:${key}`;
}

function monthOf(dateIso: string): string {
  return dateIso.slice(0, 7);
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMerchantLabel(key: string): string {
  const overrides: Record<string, string> = {
    salario: 'Salário',
    condominio: 'Condomínio',
    agua: 'Água',
    disney: 'Disney+',
    'disney plus': 'Disney+',
    'hbo max': 'HBO Max',
    hbo: 'HBO',
    iptu: 'IPTU',
    wifi: 'Wi‑Fi',
    'prime video': 'Prime Video',
  };
  if (overrides[key]) return overrides[key];
  return key
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface RecurringGroup {
  signature: string;
  type: 'expense' | 'income';
  category: string;
  merchantLabel: string;
  amount: number;
  months: Set<string>;
  occurrences: number;
}

// High-confidence recurring merchants/categories: only need 2 occurrences,
// no need for them to span multiple months.
const HIGH_CONFIDENCE_KEYS = new Set<string>([
  // Salary
  'salario', 'salary',
  // Housing
  'aluguel', 'internet', 'condominio', 'agua', 'energia', 'luz', 'wifi', 'iptu', 'gas',
  // Streaming / subscriptions
  'netflix', 'amazon prime', 'prime video', 'spotify', 'disney plus', 'disney+',
  'hbo', 'hbo max', 'max', 'globoplay', 'deezer', 'youtube premium', 'apple music',
  'paramount', 'crunchyroll',
]);
// High-confidence categories — any merchant under these is recurring-worthy fast.
const HIGH_CONFIDENCE_CATEGORIES = new Set<string>([
  'Salário', 'Moradia', 'Streaming', 'Assinaturas',
]);

function buildGroups(state: FinanceState): RecurringGroup[] {
  const map = new Map<string, { txs: Transaction[]; months: Set<string> }>();
  for (const tx of state.transactions) {
    const sig = getRecurringSignature(tx);
    if (!sig) continue;
    const bucket = map.get(sig) ?? { txs: [], months: new Set<string>() };
    bucket.txs.push(tx);
    bucket.months.add(monthOf(tx.date));
    map.set(sig, bucket);
  }
  const groups: RecurringGroup[] = [];
  for (const [signature, { txs, months }] of map) {
    if (txs.length < 2) continue;
    const [type, category, key] = signature.split(':');
    const highConfidence =
      HIGH_CONFIDENCE_CATEGORIES.has(category) || HIGH_CONFIDENCE_KEYS.has(key);
    if (!highConfidence && months.size < 2) continue;
    const baseline = state.recurring?.[signature]?.baseline;
    const amount = baseline ?? Math.round(median(txs.map(t => t.amount)) * 100) / 100;
    groups.push({
      signature,
      type: type as 'expense' | 'income',
      category,
      merchantLabel: formatMerchantLabel(key),
      amount,
      months,
      occurrences: txs.length,
    });
  }
  return groups;
}

function priority(g: RecurringGroup): number {
  // Lower number = higher priority.
  if (g.category === 'Salário') return 0;
  if (g.category === 'Moradia') return 1;
  if (g.category === 'Streaming' || g.category === 'Assinaturas') return 2;
  if (g.type === 'income') return 3;
  return 4;
}

// Returns the next recurring transaction to suggest, or null if there's
// nothing eligible right now.
export function getRecurringSuggestion(state: FinanceState): RecurringSuggestion | null {
  const month = currentMonth();
  const groups = buildGroups(state);
  // Filter out anything already registered this month, dismissed this month
  // or already suggested this month.
  const eligible = groups.filter(g => {
    const meta = state.recurring?.[g.signature];
    if (!meta?.confirmed) return false;
    if (meta?.dismissed === month) return false;
    if (meta?.suggestedMonth === month) return false;
    const alreadyThisMonth = state.transactions.some(
      t => t.date.startsWith(month) && getRecurringSignature(t) === g.signature,
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
    amount: top.amount,
  };
}

export function getRecurringCandidatePrompt(
  state: FinanceState,
  tx: Transaction,
): RecurringCandidatePrompt | null {
  const signature = getRecurringSignature(tx);
  if (!signature) return null;

  const month = currentMonth();
  const meta = state.recurring?.[signature];
  if (meta?.confirmed) return null;
  if (meta?.dismissed === month) return null;
  if (meta?.candidatePromptMonth === month) return null;

  const groups = buildGroups(state);
  const group = groups.find(g => g.signature === signature);
  if (!group) return null;
  if (group.occurrences < 2) return null;

  return {
    signature: group.signature,
    type: group.type,
    category: group.category,
    merchantLabel: group.merchantLabel,
    amount: group.amount,
  };
}

// When a brand-new transaction is registered, check whether its value
// differs significantly (>20%) from the recurring baseline. Returns a
// prompt payload if the assistant should ask to update the baseline.
export function detectRecurringValueChange(
  state: FinanceState,
  tx: Transaction,
): RecurringUpdatePrompt | null {
  const sig = getRecurringSignature(tx);
  if (!sig) return null;
  if (!state.recurring?.[sig]?.confirmed) return null;
  const groups = buildGroups(state);
  const group = groups.find(g => g.signature === sig);
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
    newAmount: tx.amount,
  };
}

// Helpers for affirmative/negative short replies.
const YES = new Set(['sim', 's', 'yes', 'y', 'ok', 'pode', 'claro', 'positivo']);
const NO = new Set(['não', 'nao', 'n', 'no', 'negativo', 'agora não', 'agora nao']);

export function isYes(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.!?]+$/g, '');
  return YES.has(t);
}
export function isNo(text: string): boolean {
  const t = text.toLowerCase().trim().replace(/[.!?]+$/g, '');
  return NO.has(t);
}
