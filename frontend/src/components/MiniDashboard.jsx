import { jsx } from "react/jsx-runtime";
import { getCategoryTotals, CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/finance";
import ExpensesSummaryCard from "@/components/ExpensesSummaryCard";
function MiniDashboard({ state }) {
  const categoryTotals = getCategoryTotals(state);
  const chartData = categoryTotals.map((category) => ({
    name: category.category,
    value: category.total,
    color: CATEGORY_COLORS[category.category] || "hsl(240, 5%, 50%)"
  }));
  const recentTransactions = [...state.transactions].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 5).map((transaction) => ({
    id: transaction.id,
    description: transaction.description,
    icon: CATEGORY_ICONS[transaction.category] || "\u{1F4E6}",
    value: transaction.amount,
    type: transaction.type === "income" ? "income" : "expense"
  }));
  return /* @__PURE__ */ jsx(ExpensesSummaryCard, { chartData, recentTransactions });
}
export {
  MiniDashboard as default
};
