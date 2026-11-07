import { describe, expect, it } from "vitest";
import { dailyCumulative } from "./daily-cumulative";
import { summarizeExact, summarizePeriod } from "./exact-aggregates";
import { transactionDtoToView } from "./transaction-adapter";

const period = { from: "2026-10-01", to: "2026-10-31" };
const view = (date, type, amount) => transactionDtoToView({ id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", categoryName: "Mercado", type, amount, description: null, transactionDate: date, createdAt: "2026-10-01T12:00:00Z" });
const series = (rows, range = period, today = "2026-11-07") => dailyCumulative(rows, range, today);

describe("daily cumulative registered transactions", () => {
  it("sorts independent series, sums same-day entries exactly and carries gaps", () => {
    const rows = Object.freeze([view("2026-10-05", "EXPENSE", "351.00"), view("2026-10-01", "INCOME", "0.10"), view("2026-10-01", "INCOME", "0.20"), view("2026-10-31", "INCOME", "100.00")]);
    const days = series(rows);
    expect(days).toHaveLength(31);
    expect(days[0]).toMatchObject({ date: "2026-10-01", income: "0.30", expenses: "0.00" });
    expect(days[3]).toMatchObject({ income: "0.30", expenses: "0.00" });
    expect(days[4]).toMatchObject({ income: "0.30", expenses: "351.00" });
    expect(days[5]).toMatchObject({ income: "0.30", expenses: "351.00" });
    expect(days.at(-1)).toMatchObject({ date: "2026-10-31", income: "100.30", expenses: "351.00" });
    expect(days.at(-1)).toMatchObject({ incomeCents: summarizePeriod(rows, period).incomeCents, expensesCents: summarizePeriod(rows, period).expensesCents });
  });
  it.each(["INCOME", "EXPENSE"])("keeps the other series zero for %s only", (type) => {
    const last = series([view("2026-10-01", type, "25.01")]).at(-1);
    expect(last).toMatchObject({ income: type === "INCOME" ? "25.01" : "0.00", expenses: type === "EXPENSE" ? "25.01" : "0.00" });
  });
  it("represents an empty historical month without inventing transactions", () => {
    const days = series([]);
    expect(days).toHaveLength(31);
    expect(days.every((d) => d.incomeCents === 0n && d.expensesCents === 0n)).toBe(true);
  });
  it("starts at the inclusive partial range, excluding earlier and later entries", () => {
    const range = { from: "2026-10-05", to: "2026-10-07" };
    const rows = [view("2026-10-01", "INCOME", "100.00"), view(range.from, "INCOME", "2.00"), view(range.to, "EXPENSE", "1.00"), view("2026-10-08", "EXPENSE", "90.00")];
    const days = series(rows, range);
    expect(days.map((d) => d.date)).toEqual([range.from, "2026-10-06", range.to]);
    expect(days.at(-1)).toMatchObject({ income: "2.00", expenses: "1.00" });
  });
  it("stops at the user's current civil day and excludes future-dated records", () => {
    const rows = [view("2026-10-01", "INCOME", "10.00"), view("2026-10-08", "EXPENSE", "50.00")];
    const days = series(rows, period, "2026-10-07");
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toMatchObject({ date: "2026-10-07", income: "10.00", expenses: "0.00" });
    expect(series(rows, period, "2026-09-30")).toEqual([]);
  });
  it("continues daily across months, leap day and DST without resetting", () => {
    const range = { from: "2024-02-28", to: "2024-03-11" };
    const days = series([view("2024-02-29", "INCOME", "1.00"), view("2024-03-10", "EXPENSE", "0.01")], range);
    expect(days).toHaveLength(13);
    expect(days[1].date).toBe("2024-02-29");
    expect(days.at(-1)).toMatchObject({ date: range.to, income: "1.00", expenses: "0.01" });
  });
  it("retains cent precision above Number's exact range", () => {
    expect(series([view("2026-10-01", "INCOME", "99999999999999999.99"), view("2026-10-01", "INCOME", "0.01")]).at(-1).income).toBe("100000000000000000.00");
  });
  it("rejects invalid dates, types and inconsistent signed amounts", () => {
    expect(() => series([], { from: "2026-02-30", to: "2026-03-01" })).toThrow();
    expect(() => series([{ ...view("2026-10-01", "INCOME", "1.00"), signedCents: -100n }])).toThrow();
    expect(() => series([{ ...view("2026-10-01", "INCOME", "1.00"), type: "PLANNED" }])).toThrow();
  });
});

let id=0;
const row=(date,type,amount)=>transactionDtoToView({id:`76870c4b-f8df-4eab-b3c2-${String(++id).padStart(12,"0")}`,categoryId:"e71a8f14-a7e5-41e2-b0ac-1c5398f949a3",categoryName:"Category",type,amount,transactionDate:date,description:null,createdAt:"2026-10-01T12:00:00Z"});
it("counts mixed same-day transactions once, independent of input order",()=>{
 const rows=[row("2026-10-31","INCOME","100.00"),row("2026-10-31","EXPENSE","20.00"),row("2026-10-31","INCOME","0.10"),row("2026-10-31","EXPENSE","0.20")];
 const period={from:"2026-10-30",to:"2026-11-02"}; const days=dailyCumulative(rows,period,"2026-11-07");
 expect(days[0]).toMatchObject({income:"0.00",expenses:"0.00"});
 for(const day of days.slice(1))expect(day).toMatchObject({income:"100.10",expenses:"20.20"});
 expect(days.at(-1)).toMatchObject({incomeCents:summarizeExact(rows).incomeCents,expensesCents:summarizeExact(rows).expensesCents});
 expect(dailyCumulative([...rows].reverse(),period,"2026-11-07")).toEqual(days);
});
it("carries October balances into November and adds only each day's changes",()=>{
 const period={from:"2026-10-30",to:"2026-11-03"};const rows=[row("2026-11-02","EXPENSE","5.00"),row("2026-10-31","EXPENSE","20.00"),row("2026-11-01","INCOME","10.00"),row("2026-10-30","INCOME","100.00")];
 const days=dailyCumulative(rows,period,"2026-11-07");
 expect(days.map(d=>[d.date,d.income,d.expenses])).toEqual([["2026-10-30","100.00","0.00"],["2026-10-31","100.00","20.00"],["2026-11-01","110.00","20.00"],["2026-11-02","110.00","25.00"],["2026-11-03","110.00","25.00"]]);
 expect(days.at(-1)).toMatchObject({incomeCents:summarizePeriod(rows,period).incomeCents,expensesCents:summarizePeriod(rows,period).expensesCents});
});
it("cuts only history at today, retaining full-period records and totals",()=>{
 const period={from:"2026-11-01",to:"2026-11-30"}; const rows=[row("2026-11-01","INCOME","100.00"),row("2026-11-07","EXPENSE","20.00"),row("2026-11-08","INCOME","50.00"),row("2026-11-30","EXPENSE","30.00")];
 const before=summarizeExact(rows); const original=rows.map(r=>({...r}));
 const days=dailyCumulative(rows,period,"2026-11-07");
 expect(days.at(-1)).toMatchObject({date:"2026-11-07",income:"100.00",expenses:"20.00"});
 expect(summarizeExact(rows)).toEqual(before);expect(before).toMatchObject({income:"150.00",expenses:"50.00",balance:"100.00"});expect(rows).toEqual(original);
});
