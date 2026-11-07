import { requirePeriod } from "./financial-load";
import { assertTransactionView } from "./transaction-adapter";
import { centsToDecimal } from "./signed-money";
import { localCivilToday } from "./civil-date";

// Date-only UTC arithmetic preserves civil dates across time zones and DST.
// Only the plotting coordinates are approximate; amounts remain BigInt cents.
export function dailyCumulative(transactions, period, today = localCivilToday().toISOString().slice(0, 10)) {
  requirePeriod(period);
  requirePeriod({ from: today, to: today });
  const end = period.to < today ? period.to : today;
  const days = new Map();
  for (const transaction of transactions) {
    assertTransactionView(transaction);
    const date = transaction.transactionDate;
    if (date < period.from || date > end) continue;
    const day = days.get(date) ?? { incomeCents: 0n, expensesCents: 0n };
    if (transaction.type === "INCOME") day.incomeCents += transaction.signedCents;
    else day.expensesCents -= transaction.signedCents;
    days.set(date, day);
  }
  let incomeCents = 0n;
  let expensesCents = 0n;
  const result = [];
  for (let date = period.from; date <= end;) {
    const day = days.get(date);
    incomeCents += day?.incomeCents ?? 0n;
    expensesCents += day?.expensesCents ?? 0n;
    result.push({ date, incomeCents, expensesCents, income: centsToDecimal(incomeCents), expenses: centsToDecimal(expensesCents) });
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    date = next.toISOString().slice(0, 10);
  }
  return result;
}
