import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X, Trash2 } from 'lucide-react';
import type { Goal } from '@/lib/finance';

interface Props {
  goals: Goal[];
  onAdd: (name: string, amount: number) => void;
  onDelete: (id: string) => void;
}

function formatCurrency(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function GoalsPanel({ goals, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const a = parseFloat(amount.replace(',', '.'));
    if (!n || !a || a <= 0) return;
    onAdd(n, a);
    setName('');
    setAmount('');
    setOpen(false);
  };

  return (
    <div className="bg-card rounded-2xl p-4 border border-border flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minhas metas</h2>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
        >
          {open ? <X size={14} /> : <Plus size={14} />}
          {open ? 'Cancelar' : 'Criar meta'}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 mb-3 overflow-hidden"
          >
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Viagem"
              className="w-full bg-secondary text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <input
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="w-full bg-secondary text-foreground rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Salvar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3 overflow-y-auto scrollbar-hide flex-1 min-h-0">
        {goals.length === 0 && !open && (
          <div className="text-center py-6 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
              <Target size={16} className="text-primary" />
            </div>
            <p className="text-sm text-foreground font-medium mb-1">Defina sua primeira meta</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Metas pequenas ajudam a manter o foco. Comece com algo simples como uma viagem ou reserva.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="mt-3 text-xs text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
            >
              <Plus size={12} /> Criar meta
            </button>
          </div>
        )}
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <div key={goal.id} className="space-y-1.5 group">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-foreground font-medium truncate">{goal.name}</span>
                <button
                  onClick={() => onDelete(goal.id)}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  aria-label="Excluir meta"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent-blue transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(goal.currentAmount)}</span>
                <span>{formatCurrency(goal.targetAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
