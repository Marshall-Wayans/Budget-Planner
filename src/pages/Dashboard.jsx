import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, Landmark, Repeat, Target, Sparkles,
  Plus, Calculator as CalcIcon, BarChart3, Zap, ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Card, PageHeader, Button, ProgressBar, Badge } from '../components/ui';
import EmptyState from '../components/EmptyState';
import TransactionModal from '../components/TransactionModal';
import { formatCurrency } from '../services/currencyService';
import {
  calculateBalance, calculateMonthlyIncome, calculateMonthlyExpenses, calculateSavingsRate,
  calculateCategoryBreakdown, calculateSafeToSpend, daysRemainingInMonth,
} from '../services/calculationService';
import { calculateSubscriptionTotals } from '../services/calculationService';
import { generateDailyMessage } from '../services/recommendationService';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { transactions, budgets, goals, debts, subscriptions, profile, addTransaction } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [quickModal, setQuickModal] = useState(null);

  const balance = calculateBalance(transactions);
  const monthIncome = calculateMonthlyIncome(transactions);
  const monthExpenses = calculateMonthlyExpenses(transactions);
  const savingsRate = calculateSavingsRate(monthIncome, monthExpenses);
  const totalSavings = goals.reduce((s, g) => s + Number(g.currentAmount || 0), 0);
  const totalDebt = debts.reduce((s, d) => s + Number(d.remainingBalance || 0), 0);
  const subsTotal = calculateSubscriptionTotals(subscriptions);
  const avgGoalProgress = goals.length
    ? goals.reduce((s, g) => s + (g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0), 0) / goals.length
    : 0;

  const breakdown = useMemo(() => calculateCategoryBreakdown(transactions), [transactions]);
  const topCategory = breakdown[0];

  const essentialRemaining = Math.max(monthExpenses - 0, 0); // simplistic proxy for "remaining essentials"
  const safe = calculateSafeToSpend({
    balance,
    upcomingBills: subsTotal.monthly,
    essentialExpensesRemaining: 0,
    savingsTarget: profile.savingsTarget || 0,
    daysRemaining: daysRemainingInMonth(),
  });

  const dailyMessage = generateDailyMessage({ transactions });
  const hasAnyData = transactions.length > 0;

  const overviewCards = [
    { label: 'Current Balance', value: balance, icon: Wallet, tone: balance >= 0 ? 'moss' : 'clay', to: '/transactions' },
    { label: 'Total Income', value: monthIncome, icon: TrendingUp, tone: 'moss', to: '/transactions' },
    { label: 'Total Expenses', value: monthExpenses, icon: TrendingDown, tone: 'clay', to: '/analytics' },
    { label: 'Available to Spend', value: safe.monthly, icon: Zap, tone: 'gold', to: '/calculator' },
    { label: 'Savings', value: totalSavings, icon: PiggyBank, tone: 'moss', to: '/goals' },
    { label: 'Total Debt', value: totalDebt, icon: Landmark, tone: totalDebt > 0 ? 'clay' : 'moss', to: '/debts' },
    { label: 'Upcoming Bills', value: subsTotal.monthly, icon: Repeat, tone: 'gold', to: '/subscriptions' },
    { label: 'Savings Goal Progress', value: null, percent: avgGoalProgress, icon: Target, tone: 'moss', to: '/goals' },
  ];

  const quickActions = [
    { label: 'Add Expense', icon: Plus, action: () => setQuickModal('expense') },
    { label: 'Add Income', icon: Plus, action: () => setQuickModal('income') },
    { label: 'Add Debt', icon: Landmark, action: () => navigate('/debts') },
    { label: 'Add Saving', icon: PiggyBank, action: () => navigate('/goals') },
    { label: 'Add Goal', icon: Target, action: () => navigate('/goals') },
    { label: 'Add Bill', icon: Repeat, action: () => navigate('/subscriptions') },
    { label: 'Open Calculator', icon: CalcIcon, action: () => navigate('/calculator') },
    { label: 'Spending Analysis', icon: BarChart3, action: () => navigate('/analytics') },
    { label: 'Financial Advice', icon: Sparkles, action: () => navigate('/advisor') },
  ];

  const handleQuickSave = async (data) => {
    addTransaction(data);
    showToast(`${data.type === 'income' ? 'Income' : 'Expense'} added successfully.`);
    setQuickModal(null);
  };

  return (
    <div className="animate-rise">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-canvas-50">{greeting()}, {profile.name || 'there'}.</h1>
        <p className="text-sm text-ink-700/60 dark:text-canvas-100/60 mt-1">
          {hasAnyData
            ? `You have ${formatCurrency(safe.monthly, profile.currency)} available after planned expenses this month.`
            : "Here's your financial overview — add a transaction to get started."}
        </p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon={Wallet}
          title="Welcome to your financial command center"
          description="Add your first income or expense to see your dashboard come to life."
          actionLabel="Add your first transaction"
          onAction={() => setQuickModal('expense')}
        />
      ) : (
        <>
          {topCategory && (
            <Card className="p-4 mb-6 flex items-center gap-3 bg-moss-50 dark:bg-moss-500/10 border-moss-200/50 dark:border-moss-500/20">
              <Sparkles size={18} className="text-moss-600 dark:text-moss-400 shrink-0" />
              <p className="text-sm text-moss-800 dark:text-moss-300">
                Your biggest spending category this month is <strong>{topCategory.category}</strong> at {formatCurrency(topCategory.amount, profile.currency)}. {dailyMessage}
              </p>
            </Card>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {overviewCards.map((c) => (
              <Card key={c.label} onClick={() => navigate(c.to)} className="p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${
                  c.tone === 'moss' ? 'bg-moss-500/10 text-moss-600' : c.tone === 'clay' ? 'bg-clay-500/10 text-clay-600' : 'bg-gold-500/15 text-gold-600'
                }`}>
                  <c.icon size={16} />
                </div>
                <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mb-1">{c.label}</p>
                {c.percent !== undefined ? (
                  <>
                    <p className="font-display text-lg font-bold text-ink-900 dark:text-canvas-50">{c.percent.toFixed(0)}%</p>
                    <ProgressBar value={c.percent} tone="moss" className="mt-2" />
                  </>
                ) : (
                  <p className="font-display text-lg font-bold text-ink-900 dark:text-canvas-50 truncate">{formatCurrency(c.value, profile.currency)}</p>
                )}
              </Card>
            ))}
          </div>

          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-3">Quick actions</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex flex-col items-center gap-2 p-4 rounded-xl2 bg-white dark:bg-ink-900 border border-ink-950/[0.05] dark:border-white/[0.06] shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all focus-ring text-center"
              >
                <div className="h-9 w-9 rounded-full bg-moss-500/10 text-moss-600 flex items-center justify-center">
                  <a.icon size={16} />
                </div>
                <span className="text-xs font-medium text-ink-800 dark:text-canvas-100 leading-tight">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="font-display font-semibold text-ink-900 dark:text-canvas-50">This month</p>
                <button onClick={() => navigate('/analytics')} className="text-xs font-medium text-moss-600 dark:text-moss-400 hover:underline flex items-center gap-1 focus-ring rounded">
                  View analytics <ArrowRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mb-1">Income</p>
                  <p className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(monthIncome, profile.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mb-1">Expenses</p>
                  <p className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(monthExpenses, profile.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mb-1">Savings rate</p>
                  <p className="font-semibold text-ink-900 dark:text-canvas-50">{savingsRate.toFixed(0)}%</p>
                </div>
              </div>
              {breakdown.slice(0, 5).map((b) => (
                <div key={b.category} className="mb-2.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-ink-800 dark:text-canvas-100/80">{b.category}</span>
                    <span className="text-ink-700/50 dark:text-canvas-100/40">{formatCurrency(b.amount, profile.currency)} · {b.percent.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={b.percent} tone="moss" />
                </div>
              ))}
            </Card>

            <Card className="p-5">
              <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">What can I spend?</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-700/70 dark:text-canvas-100/60">Today</span>
                  <span className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(safe.daily, profile.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-700/70 dark:text-canvas-100/60">This week</span>
                  <span className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(safe.weekly, profile.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-700/70 dark:text-canvas-100/60">This month</span>
                  <span className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(safe.monthly, profile.currency)}</span>
                </div>
              </div>
              <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mt-4 leading-relaxed">
                Based on your balance, upcoming bills, and savings target, split across the days left in the month.
              </p>
              <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => navigate('/advisor')}>
                Get more advice <ArrowRight size={14} />
              </Button>
            </Card>
          </div>
        </>
      )}

      <TransactionModal
        open={!!quickModal}
        onClose={() => setQuickModal(null)}
        onSave={handleQuickSave}
        initial={quickModal === 'income' ? { type: 'income' } : quickModal === 'expense' ? { type: 'expense' } : null}
      />
    </div>
  );
}
