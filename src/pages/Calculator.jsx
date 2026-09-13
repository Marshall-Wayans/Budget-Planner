import { useState } from 'react';
import { Calculator as CalcIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, Field, inputClass, Badge, ProgressBar } from '../components/ui';
import { formatCurrency } from '../services/currencyService';
import {
  calculateAffordability, calculateMonthlyBudgetSummary, calculateGoalProgress,
  calculateRequiredMonthlyContribution, compareDebtStrategies, calculateAvailableToSpend,
  calculateDailySpendingLimit, calculateSmartSplit,
} from '../services/calculationService';

const MODES = [
  { key: 'afford', label: 'Can I Afford This?' },
  { key: 'budget', label: 'Monthly Budget' },
  { key: 'goal', label: 'Savings Goal' },
  { key: 'debt', label: 'Debt Payoff' },
  { key: 'limit', label: 'Spending Limit' },
  { key: 'split', label: 'Split My Money' },
];

function num(v) { return Number(v) || 0; }

export default function Calculator() {
  const { profile } = useApp();
  const [mode, setMode] = useState('afford');
  const cur = (v) => formatCurrency(v, profile.currency);

  return (
    <div className="animate-rise">
      <PageHeader title="Money Calculator" subtitle="A financial decision calculator, not just a number cruncher." />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
              mode === m.key ? 'bg-moss-600 text-white shadow-soft' : 'bg-white dark:bg-ink-900 text-ink-700 dark:text-canvas-100/70 border border-ink-950/[0.06] dark:border-white/[0.06] hover:bg-ink-950/[0.03] dark:hover:bg-white/[0.06]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'afford' && <AffordCalc cur={cur} />}
      {mode === 'budget' && <BudgetCalc cur={cur} />}
      {mode === 'goal' && <GoalCalc cur={cur} />}
      {mode === 'debt' && <DebtCalc cur={cur} />}
      {mode === 'limit' && <LimitCalc cur={cur} />}
      {mode === 'split' && <SplitCalc cur={cur} />}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid lg:grid-cols-2 gap-6">{children}</div>;
}

function ResultRow({ label, value, tone }) {
  const tones = { good: 'text-moss-600 dark:text-moss-400', bad: 'text-clay-600 dark:text-clay-400', neutral: 'text-ink-900 dark:text-canvas-50' };
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink-950/[0.05] dark:border-white/[0.05] last:border-0">
      <span className="text-sm text-ink-700/70 dark:text-canvas-100/60">{label}</span>
      <span className={`text-sm font-semibold ${tones[tone] || tones.neutral}`}>{value}</span>
    </div>
  );
}

function AffordCalc({ cur }) {
  const [f, setF] = useState({ itemPrice: '', currentBalance: '', monthlyIncome: '', monthlyExpenses: '', monthlySavingsTarget: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const r = calculateAffordability({
    itemPrice: num(f.itemPrice), currentBalance: num(f.currentBalance), monthlyIncome: num(f.monthlyIncome),
    monthlyExpenses: num(f.monthlyExpenses), monthlySavingsTarget: num(f.monthlySavingsTarget),
  });
  const hasInput = f.itemPrice && f.currentBalance;

  return (
    <Grid>
      <Card className="p-5">
        <Field label="Item price"><input type="number" min="0" value={f.itemPrice} onChange={set('itemPrice')} className={inputClass} /></Field>
        <Field label="Current balance"><input type="number" min="0" value={f.currentBalance} onChange={set('currentBalance')} className={inputClass} /></Field>
        <Field label="Monthly income"><input type="number" min="0" value={f.monthlyIncome} onChange={set('monthlyIncome')} className={inputClass} /></Field>
        <Field label="Monthly expenses"><input type="number" min="0" value={f.monthlyExpenses} onChange={set('monthlyExpenses')} className={inputClass} /></Field>
        <Field label="Monthly savings target"><input type="number" min="0" value={f.monthlySavingsTarget} onChange={set('monthlySavingsTarget')} className={inputClass} /></Field>
      </Card>
      <Card className="p-5">
        {!hasInput ? (
          <p className="text-sm text-ink-700/50 dark:text-canvas-100/40">Fill in the item price and balance to see the result.</p>
        ) : (
          <>
            <div className={`p-4 rounded-xl mb-4 ${r.canAfford ? 'bg-moss-500/10' : 'bg-clay-500/10'}`}>
              <p className={`font-display font-semibold ${r.canAfford ? 'text-moss-700 dark:text-moss-400' : 'text-clay-700 dark:text-clay-400'}`}>
                {r.canAfford ? 'You can afford this without touching your savings target.' : 'This would eat into your savings target.'}
              </p>
            </div>
            <ResultRow label="Remaining after purchase" value={cur(r.remainingAfterPurchase)} tone={r.remainingAfterPurchase >= 0 ? 'good' : 'bad'} />
            <ResultRow label="Impact on savings" value={cur(r.impactOnSavings)} tone={r.impactOnSavings > 0 ? 'bad' : 'neutral'} />
            <ResultRow label="% of available money used" value={`${r.percentOfAvailable.toFixed(0)}%`} />
            <ResultRow label="Recommended spending limit" value={cur(r.recommendedLimit)} />
            {!r.canAfford && <p className="text-xs text-ink-700/60 dark:text-canvas-100/50 mt-3">Consider waiting until your next income payment, or lowering the price target.</p>}
          </>
        )}
      </Card>
    </Grid>
  );
}

function BudgetCalc({ cur }) {
  const [f, setF] = useState({ income: '', housing: '', food: '', transport: '', utilities: '', debt: '', entertainment: '', savings: '', other: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const r = calculateMonthlyBudgetSummary(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, num(v)])));

  return (
    <Grid>
      <Card className="p-5">
        <Field label="Monthly income"><input type="number" min="0" value={f.income} onChange={set('income')} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Housing"><input type="number" min="0" value={f.housing} onChange={set('housing')} className={inputClass} /></Field>
          <Field label="Food"><input type="number" min="0" value={f.food} onChange={set('food')} className={inputClass} /></Field>
          <Field label="Transport"><input type="number" min="0" value={f.transport} onChange={set('transport')} className={inputClass} /></Field>
          <Field label="Utilities"><input type="number" min="0" value={f.utilities} onChange={set('utilities')} className={inputClass} /></Field>
          <Field label="Debt"><input type="number" min="0" value={f.debt} onChange={set('debt')} className={inputClass} /></Field>
          <Field label="Entertainment"><input type="number" min="0" value={f.entertainment} onChange={set('entertainment')} className={inputClass} /></Field>
          <Field label="Savings"><input type="number" min="0" value={f.savings} onChange={set('savings')} className={inputClass} /></Field>
          <Field label="Other"><input type="number" min="0" value={f.other} onChange={set('other')} className={inputClass} /></Field>
        </div>
      </Card>
      <Card className="p-5">
        <ResultRow label="Total expenses" value={cur(r.totalExpenses)} />
        <ResultRow label="Total savings" value={cur(r.totalSavings)} tone="good" />
        <ResultRow label="Remaining" value={cur(r.remaining)} tone={r.remaining >= 0 ? 'good' : 'bad'} />
        <ResultRow label="Savings %" value={`${r.savingsPercent.toFixed(0)}%`} />
        <ResultRow label="Spending %" value={`${r.spendingPercent.toFixed(0)}%`} />
        <ResultRow label="Disposable income" value={cur(r.disposableIncome)} />
        <div className="mt-4">
          <ProgressBar value={r.savingsPercent} max={100} tone="moss" />
        </div>
      </Card>
    </Grid>
  );
}

function GoalCalc({ cur }) {
  const [f, setF] = useState({ targetAmount: '', currentSavings: '', monthlyContribution: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const r = calculateGoalProgress({ targetAmount: num(f.targetAmount), currentAmount: num(f.currentSavings), monthlyContribution: num(f.monthlyContribution) });
  const req6 = calculateRequiredMonthlyContribution(num(f.targetAmount), num(f.currentSavings), 6);
  const req12 = calculateRequiredMonthlyContribution(num(f.targetAmount), num(f.currentSavings), 12);

  return (
    <Grid>
      <Card className="p-5">
        <Field label="Goal amount"><input type="number" min="0" value={f.targetAmount} onChange={set('targetAmount')} className={inputClass} /></Field>
        <Field label="Current savings"><input type="number" min="0" value={f.currentSavings} onChange={set('currentSavings')} className={inputClass} /></Field>
        <Field label="Monthly contribution"><input type="number" min="0" value={f.monthlyContribution} onChange={set('monthlyContribution')} className={inputClass} /></Field>
      </Card>
      <Card className="p-5">
        <ResultRow label="Remaining amount" value={cur(r.remaining)} />
        <ResultRow label="Months required" value={r.monthsRequired ? `${r.monthsRequired} months` : '—'} />
        <ResultRow label="Estimated completion" value={r.estimatedDate ? r.estimatedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'} />
        <div className="mt-4 pt-4 border-t border-ink-950/[0.06] dark:border-white/[0.06] space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40">To reach it faster</p>
          <ResultRow label="Needed for 6 months" value={cur(req6)} />
          <ResultRow label="Needed for 1 year" value={cur(req12)} />
        </div>
      </Card>
    </Grid>
  );
}

function DebtCalc({ cur }) {
  const [f, setF] = useState({ debtAmount: '', interestRate: '', minimumPayment: '', extraPayment: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const r = compareDebtStrategies(num(f.debtAmount), num(f.interestRate), num(f.minimumPayment), num(f.extraPayment));

  return (
    <Grid>
      <Card className="p-5">
        <Field label="Debt amount"><input type="number" min="0" value={f.debtAmount} onChange={set('debtAmount')} className={inputClass} /></Field>
        <Field label="Interest rate (% APR)"><input type="number" min="0" step="0.1" value={f.interestRate} onChange={set('interestRate')} className={inputClass} /></Field>
        <Field label="Minimum payment"><input type="number" min="0" value={f.minimumPayment} onChange={set('minimumPayment')} className={inputClass} /></Field>
        <Field label="Extra monthly payment"><input type="number" min="0" value={f.extraPayment} onChange={set('extraPayment')} className={inputClass} /></Field>
      </Card>
      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-2">Minimum payments</p>
        <ResultRow label="Payoff time" value={r.minimum.payoffPossible ? `${r.minimum.months} months` : 'Never — payment too low'} />
        <ResultRow label="Total interest" value={r.minimum.payoffPossible ? cur(r.minimum.totalInterest) : '—'} />
        <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mt-4 mb-2">With extra payments</p>
        <ResultRow label="Payoff time" value={r.aggressive.payoffPossible ? `${r.aggressive.months} months` : '—'} tone="good" />
        <ResultRow label="Total interest" value={r.aggressive.payoffPossible ? cur(r.aggressive.totalInterest) : '—'} tone="good" />
        {r.monthsSaved !== null && (
          <div className="mt-4 p-3 rounded-xl bg-moss-500/10">
            <p className="text-sm text-moss-700 dark:text-moss-400 font-medium">
              Paying extra saves {cur(r.interestSaved)} in interest and {r.monthsSaved} months.
            </p>
          </div>
        )}
      </Card>
    </Grid>
  );
}

function LimitCalc({ cur }) {
  const [f, setF] = useState({ income: '', essential: '', debt: '', savingsTarget: '', days: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const available = calculateAvailableToSpend({ income: num(f.income), essentialExpenses: num(f.essential), debtPayments: num(f.debt), savingsTarget: num(f.savingsTarget) });
  const days = num(f.days) || 30;
  const daily = calculateDailySpendingLimit(available, days);

  return (
    <Grid>
      <Card className="p-5">
        <Field label="Monthly income"><input type="number" min="0" value={f.income} onChange={set('income')} className={inputClass} /></Field>
        <Field label="Essential expenses"><input type="number" min="0" value={f.essential} onChange={set('essential')} className={inputClass} /></Field>
        <Field label="Debt obligations"><input type="number" min="0" value={f.debt} onChange={set('debt')} className={inputClass} /></Field>
        <Field label="Savings target"><input type="number" min="0" value={f.savingsTarget} onChange={set('savingsTarget')} className={inputClass} /></Field>
        <Field label="Days in period" hint="Defaults to 30 if left blank"><input type="number" min="1" value={f.days} onChange={set('days')} className={inputClass} /></Field>
      </Card>
      <Card className="p-5">
        <ResultRow label="Available discretionary spending" value={cur(available)} tone="good" />
        <ResultRow label="Daily limit" value={cur(daily)} />
        <ResultRow label="Weekly limit" value={cur(daily * 7)} />
        <ResultRow label="Monthly limit" value={cur(available)} />
      </Card>
    </Grid>
  );
}

function SplitCalc({ cur }) {
  const [f, setF] = useState({ income: '', essential: '', wants: '', debt: '', savingsRate: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const r = calculateSmartSplit({
    income: num(f.income), essentialTotal: num(f.essential), wantsTotal: num(f.wants),
    debtTotal: num(f.debt), existingSavingsRate: num(f.savingsRate),
  });

  return (
    <Grid>
      <Card className="p-5">
        <Field label="Monthly income"><input type="number" min="0" value={f.income} onChange={set('income')} className={inputClass} /></Field>
        <Field label="Essential expenses (needs)"><input type="number" min="0" value={f.essential} onChange={set('essential')} className={inputClass} /></Field>
        <Field label="Typical discretionary spend (wants)"><input type="number" min="0" value={f.wants} onChange={set('wants')} className={inputClass} /></Field>
        <Field label="Monthly debt payments"><input type="number" min="0" value={f.debt} onChange={set('debt')} className={inputClass} /></Field>
        <Field label="Current savings rate (%)" hint="Used as a baseline to nudge upward"><input type="number" min="0" value={f.savingsRate} onChange={set('savingsRate')} className={inputClass} /></Field>
      </Card>
      <Card className="p-5">
        <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mb-3">Based on your actual spending mix, not a fixed 50/30/20 rule.</p>
        <ResultRow label="Needs" value={cur(r.needs)} />
        <ResultRow label="Wants" value={cur(r.wants)} />
        <ResultRow label="Savings" value={cur(r.savings)} tone="good" />
        <ResultRow label="Debt" value={cur(r.debt)} />
        <ResultRow label="Emergency fund" value={cur(r.emergency)} />
      </Card>
    </Grid>
  );
}
