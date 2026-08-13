import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { FinanceState } from '@/lib/finance';
import { getCategoryTotals, CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/finance';

interface Props {
  state: FinanceState;
}

function formatCurrency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MiniDashboard({ state }: Props) {
  const categoryTotals = getCategoryTotals(state);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="bg-card rounded-2xl p-4 border border-border flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} className="text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Gastos por categoria
        </h2>
      </div>

      <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
        {categoryTotals.length === 0 ? (
          <div className="text-center py-6 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
              <BarChart3 size={16} className="text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium mb-1">Sem dados ainda</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Registre seus primeiros gastos no chat para visualizar a distribuição por categoria aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-4">
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryTotals}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={54}
                      innerRadius={32}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {categoryTotals.map((c) => (
                        <Cell key={c.category} fill={CATEGORY_COLORS[c.category] || 'hsl(240, 5%, 50%)'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full mt-3 space-y-1.5">
                {categoryTotals.map(c => (
                  <div key={c.category} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                    />
                    <span className="text-foreground flex-1 break-words leading-tight">{c.category}</span>
                    <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                      {formatCurrency(c.total)} <span className="opacity-70">({c.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {recent.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Recentes
                </p>
                <div className="space-y-1.5">
                  {recent.map(tx => (
                    <div key={tx.id} className="flex items-center gap-2 text-xs">
                      <span className="text-base">{CATEGORY_ICONS[tx.category] || '📦'}</span>
                      <span className="text-foreground truncate flex-1">{tx.category}</span>
                      <span className={`tabular-nums font-medium ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
