const FIXED_CATEGORIES = new Set(["Moradia", "Transporte", "Saúde"]);

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function groupByMonth(transactions) {
  return transactions.reduce((months, transaction) => {
    const month = transaction.date.slice(0, 7);
    months[month] ||= { income: 0, expenses: 0, fixedExpenses: 0 };

    if (transaction.amount > 0) {
      months[month].income += transaction.amount;
    } else {
      const expense = Math.abs(transaction.amount);
      months[month].expenses += expense;
      if (FIXED_CATEGORIES.has(transaction.category)) months[month].fixedExpenses += expense;
    }

    return months;
  }, {});
}

export function calculateFinancialHealth(transactions) {
  const months = Object.values(groupByMonth(transactions));
  if (!months.length) {
    return { score: 0, savingsRate: 0, fixedCommitment: 0, consistency: 0, status: "Sem dados", action: "Registre suas entradas e saídas para acompanhar sua saúde financeira." };
  }

  const savingsRates = months.map((month) => month.income > 0
    ? Math.max(0, ((month.income - month.expenses) / month.income) * 100)
    : 0);
  const savingsRate = savingsRates.reduce((sum, rate) => sum + rate, 0) / savingsRates.length;
  const totalIncome = months.reduce((sum, month) => sum + month.income, 0);
  const totalFixedExpenses = months.reduce((sum, month) => sum + month.fixedExpenses, 0);
  const fixedCommitment = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 100;
  const consistentMonths = months.filter((month) => month.income - month.expenses >= 0).length;
  const consistency = (consistentMonths / months.length) * 100;
  const savingsScore = clamp((savingsRate / 20) * 100);
  const debtScore = clamp(100 - (fixedCommitment / 50) * 100);
  const score = Math.round(0.45 * savingsScore + 0.35 * debtScore + 0.2 * consistency);
  const status = score >= 80 ? "Excelente" : score >= 60 ? "Estável" : score >= 40 ? "Atenção" : "Crítico";
  const action = savingsRate < 20
    ? "Aumente sua margem mensal de economia."
    : fixedCommitment > 50
      ? "Reduza seus custos fixos para diminuir o risco financeiro."
      : consistency < 100
        ? "Mantenha o saldo mensal positivo ou igual a zero."
        : "Continue mantendo suas entradas acima das saídas.";

  return { score, savingsRate: Math.round(savingsRate), fixedCommitment: Math.round(fixedCommitment), consistency: Math.round(consistency), status, action };
}
