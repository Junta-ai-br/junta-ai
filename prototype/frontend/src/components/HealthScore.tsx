import { HeartPulse } from 'lucide-react';
import { computeHealthScore, type FinanceState } from '@/lib/finance';

interface Props {
  state: FinanceState;
}

export default function HealthScore({ state }: Props) {
  const { score, status, label, emoji, message } = computeHealthScore(state);

  const barColor =
    status === 'healthy' ? 'bg-success'
    : status === 'attention' ? 'bg-warning'
    : 'bg-destructive';

  const textColor =
    status === 'healthy' ? 'text-success'
    : status === 'attention' ? 'text-warning'
    : 'text-destructive';

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <HeartPulse size={14} className="text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Saúde Financeira
        </h2>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-heading text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
        <span className={`ml-auto text-xs font-medium ${textColor}`}>
          {emoji} {label}
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
    </div>
  );
}
