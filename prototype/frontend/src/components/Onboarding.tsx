import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { UserProfile } from '@/lib/finance';
import logo from '@/assets/grana-logo.png';

interface Props {
  onComplete: (profile: Omit<UserProfile, 'onboarded'>) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [objective, setObjective] = useState('');

  const objectives = [
    'Economizar mais',
    'Sair das dívidas',
    'Investir',
    'Organizar gastos',
    'Realizar um sonho',
  ];

  const next = () => setStep(s => s + 1);

  const finish = () => {
    onComplete({
      name: name.trim() || 'Você',
      monthlyIncome: income ? parseFloat(income.replace(',', '.')) : undefined,
      objective: objective || undefined,
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Logo on top, prominent across all steps */}
        <img
          src={logo}
          alt="Grana.ai"
          className="w-56 md:w-64 h-auto object-contain mb-8 select-none"
          draggable={false}
        />

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-card rounded-3xl p-7 md:p-8 border border-border"
        >
          {step === 0 && (
            <div className="text-center space-y-6">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">
                  Olá 👋
                </h1>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Sua companheira financeira. Conversa simples, controle real.
                </p>
              </div>
              <button
                onClick={next}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                Começar <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-primary uppercase tracking-wider mb-2">Passo 1 de 3</p>
                <h2 className="font-heading text-2xl font-bold">Como você se chama?</h2>
              </div>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-secondary text-foreground rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
              />
              <button
                onClick={next}
                disabled={!name.trim()}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium disabled:opacity-30 transition flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-primary uppercase tracking-wider mb-2">Passo 2 de 3</p>
                <h2 className="font-heading text-2xl font-bold">Qual sua renda mensal?</h2>
                <p className="text-muted-foreground text-sm mt-1">Opcional, ajuda nos insights.</p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={income}
                  onChange={e => setIncome(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className="w-full bg-secondary text-foreground rounded-xl pl-10 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={next}
                  className="flex-1 bg-secondary text-foreground rounded-xl py-3 font-medium hover:bg-muted transition"
                >
                  Pular
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 font-medium transition flex items-center justify-center gap-2"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-primary uppercase tracking-wider mb-2">Passo 3 de 3</p>
                <h2 className="font-heading text-2xl font-bold">Qual seu objetivo?</h2>
              </div>
              <div className="space-y-2">
                {objectives.map(obj => (
                  <button
                    key={obj}
                    onClick={() => setObjective(obj)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                      objective === obj
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-secondary text-foreground hover:border-primary/50'
                    }`}
                  >
                    {obj}
                  </button>
                ))}
              </div>
              <button
                onClick={finish}
                disabled={!objective}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium disabled:opacity-30 transition flex items-center justify-center gap-2"
              >
                Entrar no app <ArrowRight size={16} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
