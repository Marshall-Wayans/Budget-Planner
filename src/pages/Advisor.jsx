import { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Target, Landmark, Info, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, ProgressBar, Badge } from '../components/ui';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../services/currencyService';
import { generateFinancialRecommendations, generateDailyMessage } from '../services/recommendationService';
import {
  calculateMonthlyIncome, calculateMonthlyExpenses, calculateSavingsRate,
  calculateDebtRatio, calculateFinancialHealthScore,
} from '../services/calculationService';

const TYPE_ICON = { positive: CheckCircle2, warning: TrendingUp, opportunity: TrendingDown, goal: Target, debt: Landmark, general: Info };
const TYPE_TONE = { positive: 'positive', warning: 'danger', opportunity: 'warning', goal: 'neutral', debt: 'warning', general: 'neutral' };

export default function Advisor() {
  const { transactions, budgets, goals, debts, subscriptions, profile } = useApp();

  const hasData = transactions.length > 0 || budgets.length > 0 || goals.length > 0 || debts.length > 0;

  const income = calculateMonthlyIncome(transactions);
  const expenses = calculateMonthlyExpenses(transactions);
  const savingsRate = calculateSavingsRate(income, expenses);
  const totalDebtPayments = debts.reduce((s, d) => s + Number(d.minimumPayment || 0), 0);
  const debtRatio = calculateDebtRatio(totalDebtPayments, income);
  const avgGoalProgress = goals.length
    ? goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / goals.length
    : 0;
  const budgetAdherence = budgets.length
    ? budgets.reduce((s, b) => {
        const spent = transactions
          .filter((t) => t.category === b.category && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        return s + Math.max(100 - Math.max(((spent - b.amount) / b.amount) * 100, 0), 0);
      }, 0) / budgets.length
    : 70;

  const health = calculateFinancialHealthScore({
    savingsRate,
    debtRatio,
    emergencyFundMonths: goals.find((g) => g.name.toLowerCase().includes('emergency'))
      ? (goals.find((g) => g.name.toLowerCase().includes('emergency')).currentAmount / (expenses || 1))
      : 0,
    budgetAdherencePercent: budgetAdherence,
    goalProgressPercent: avgGoalProgress,
  });

  const recommendations = useMemo(
    () => generateFinancialRecommendations({ transactions, budgets, goals, debts, subscriptions, profile }),
    [transactions, budgets, goals, debts, subscriptions, profile]
  );
  const dailyMessage = generateDailyMessage({ transactions });

  return (
    <div className="animate-rise">
      <PageHeader title="Money Advisor" subtitle="Personalized insight, grounded in your own numbers." />

      {!hasData ? (
        <EmptyState
          icon={Sparkles}
          title="Nothing to analyze yet"
          description="Add a few transactions and the advisor will start surfacing insights about your spending and savings."
        />
      ) : (
        <>
          <Card className="p-6 mb-6 bg-gradient-to-br from-moss-600 to-moss-700 text-white border-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-white/70 mb-1">Financial Health Score</p>
                <p className="font-display text-4xl font-bold">{health.score}<span className="text-xl text-white/60">/100</span></p>
                <p className="text-sm text-white/80 mt-1">{health.label}</p>
              </div>
              <p className="text-sm text-white/90 sm:max-w-xs sm:text-right">{dailyMessage}</p>
            </div>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-2">Savings rate</p>
              <p className="font-display text-lg font-bold text-ink-900 dark:text-canvas-50 mb-2">{savingsRate.toFixed(0)}%</p>
              <ProgressBar value={Math.max(savingsRate, 0)} max={30} tone="moss" />
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-2">Debt-to-income</p>
              <p className="font-display text-lg font-bold text-ink-900 dark:text-canvas-50 mb-2">{debtRatio.toFixed(0)}%</p>
              <ProgressBar value={debtRatio} max={50} tone={debtRatio > 35 ? 'clay' : 'moss'} />
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-2">Goal progress</p>
              <p className="font-display text-lg font-bold text-ink-900 dark:text-canvas-50 mb-2">{avgGoalProgress.toFixed(0)}%</p>
              <ProgressBar value={avgGoalProgress} tone="gold" />
            </Card>
          </div>

          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-3">Recommendations</p>
          <div className="space-y-3">
            {recommendations.map((r) => {
              const Icon = TYPE_ICON[r.type] || Info;
              return (
                <Card key={r.id} className="p-4 flex gap-3">
                  <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                    r.type === 'positive' ? 'bg-moss-500/10 text-moss-600' :
                    r.type === 'warning' ? 'bg-clay-500/10 text-clay-600' :
                    r.type === 'opportunity' ? 'bg-gold-500/15 text-gold-600' :
                    'bg-ink-950/5 dark:bg-white/10 text-ink-700 dark:text-canvas-100/70'
                  }`}>
                    <Icon size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-ink-900 dark:text-canvas-50">{r.title}</p>
                      <Badge tone={TYPE_TONE[r.type]}>{r.priority}</Badge>
                    </div>
                    <p className="text-sm text-ink-700/70 dark:text-canvas-100/60 mt-0.5">{r.message}</p>
                    {r.potentialSaving > 0 && (
                      <p className="text-xs text-moss-700 dark:text-moss-400 font-medium mt-1">
                        Potential impact: {formatCurrency(r.potentialSaving, profile.currency)}
                      </p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
