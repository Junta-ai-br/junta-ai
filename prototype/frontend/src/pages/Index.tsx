import { RotateCcw } from 'lucide-react';
import Onboarding from '@/components/Onboarding';
import ChatView from '@/components/ChatView';
import SummaryCards from '@/components/SummaryCards';
import GoalsPanel from '@/components/GoalsPanel';
import MiniDashboard from '@/components/MiniDashboard';
import HealthScore from '@/components/HealthScore';
import { useFinance } from '@/lib/useFinance';
import logo from '@/assets/grana-logo.png';

export default function Index() {
  const {
    state,
    messages,
    sendMessage,
    completeOnboarding,
    addGoal,
    deleteGoal,
    respondToSuggestion,
    respondToCategoryPick,
    respondToRecurringPick,
    respondToRecurringUpdate,
    resetAll,
  } = useFinance();

  if (!state.user.onboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const handleReset = () => {
    if (confirm('Voltar ao início e apagar seus dados?')) resetAll();
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="px-5 md:px-8 pt-5 pb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <img src={logo} alt="Grana.ai" className="h-24 md:h-28 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
            {(() => {
              const h = new Date().getHours();
              const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
              const e = h < 12 ? '☀️' : h < 18 ? '☕' : '🌙';
              return (
                <>
                  {g}, <span className="text-foreground font-medium">{state.user.name}</span> {e}
                </>
              );
            })()}
          </p>
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
            aria-label="Voltar ao início"
            title="Voltar ao início"
          >
            <RotateCcw size={14} />
            <span className="hidden md:inline">Reiniciar</span>
          </button>
        </div>
      </header>

      {/* Summary cards (compact) */}
      <div className="px-5 md:px-8 flex-shrink-0">
        <SummaryCards state={state} />
      </div>

      {/* Main split area: chat ~70%, sidebar ~30% */}
      <main className="flex-1 min-h-0 px-5 md:px-8 py-4 md:py-5 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-10">
        {/* Left: Chat (~70%) */}
        <section className="md:col-span-7 min-h-0 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
          <ChatView
            messages={messages}
            onSend={sendMessage}
            onSuggestionResponse={respondToSuggestion}
            onCategoryPick={respondToCategoryPick}
            onRecurringPick={respondToRecurringPick}
            onRecurringUpdate={respondToRecurringUpdate}
            userName={state.user.name}
          />
        </section>

        {/* Right: Goals + Mini dashboard (~30%) */}
        <aside className="md:col-span-3 min-h-0 flex flex-col gap-4 md:gap-5 overflow-y-auto scrollbar-hide">
          <div className="flex-1 min-h-[240px]">
            <GoalsPanel goals={state.goals} onAdd={addGoal} onDelete={deleteGoal} />
          </div>
          <HealthScore state={state} />
          <div className="flex-1 min-h-[240px]">
            <MiniDashboard state={state} />
          </div>
        </aside>
      </main>
    </div>
  );
}
