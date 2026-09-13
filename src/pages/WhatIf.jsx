import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Compass } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, Field, inputClass, Button } from '../components/ui';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../services/currencyService';
import { calculateMonthlyIncome, calculateMonthlyExpenses, calculateWhatIfScenario } from '../services/calculationService';

const SCENARIOS = [
  { key: 'save-more', label: 'Save more per month', direction: 1 },
  { key: 'reduce-expense', label: 'Reduce a monthly expense', direction: 1 },
  { key: 'extra-debt', label: 'Pay extra toward debt', direction: -1 },
  { key: 'income-increase', label: 'Income increases by %', percent: true },
  { key: 'stop-subscription', label: 'Stop a subscription', direction: 1 },
];

export default function WhatIf() {
  const { transactions, profile } = useApp();
  const [scenario, setScenario] = useState(SCENARIOS[0].key);
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('12');

  const income = calculateMonthlyIncome(transactions);
  const expenses = calculateMonthlyExpenses(transactions);
  const currentMonthlySavings = income - expenses;
  const hasData = transactions.length > 0;

  const change = scenario === 'income-increase' ? (income * (Number(amount) || 0)) / 100 : (Number(amount) || 0);
  const result = useMemo(
    () => calculateWhatIfScenario({ currentMonthlySavings, change, months: Number(months) || 12 }),
    [currentMonthlySavings, change, months]
  );

  const chartData = [
    { label: 'Current path', value: Math.round(result.currentProjection) },
    { label: 'With this change', value: Math.round(result.newProjection) },
  ];

  const activeScenario = SCENARIOS.find((s) => s.key === scenario);

  return (
    <div className="animate-rise">
      <PageHeader title="What-If Simulator" subtitle="See the long-run impact of a single financial decision." />

      {!hasData ? (
        <EmptyState icon={Compass} title="Add some transactions first" description="The simulator uses your real income and expenses as a starting point." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <Field label="What are you considering?">
              <select value={scenario} onChange={(e) => { setScenario(e.target.value); setAmount(''); }} className={inputClass}>
                {SCENARIOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
            <Field label={activeScenario.percent ? 'Percentage increase' : 'Amount per month'}>
              <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder={activeScenario.percent ? 'e.g. 10' : 'e.g. 2000'} />
            </Field>
            <Field label="Time horizon (months)">
              <input type="number" min="1" value={months} onChange={(e) => setMonths(e.target.value)} className={inputClass} />
            </Field>
            <p className="text-xs text-ink-700/50 dark:text-canvas-100/40 mt-2">
              Your current average monthly savings: <strong className="text-ink-800 dark:text-canvas-100">{formatCurrency(currentMonthlySavings, profile.currency)}</strong>
            </p>
          </Card>

          <Card className="p-5">
            {!amount ? (
              <p className="text-sm text-ink-700/50 dark:text-canvas-100/40">Enter an amount to see the projected outcome.</p>
            ) : (
              <>
                <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-1">
                  {result.difference >= 0 ? 'Projected gain' : 'Projected impact'}
                </p>
                <p className={`font-display text-2xl font-bold mb-4 ${result.difference >= 0 ? 'text-moss-600 dark:text-moss-400' : 'text-clay-600 dark:text-clay-400'}`}>
                  {result.difference >= 0 ? '+' : ''}{formatCurrency(result.difference, profile.currency)}
                </p>
                <p className="text-sm text-ink-700/70 dark:text-canvas-100/60 mb-4">
                  {result.difference >= 0
                    ? `If you make this change, you could have approximately ${formatCurrency(result.difference, profile.currency)} more after ${months} months.`
                    : `This change could reduce your projected savings by approximately ${formatCurrency(Math.abs(result.difference), profile.currency)} over ${months} months.`}
                </p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.15)" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip formatter={(v) => formatCurrency(v, profile.currency)} contentStyle={{ borderRadius: 12, border: 'none' }} />
                      <Bar dataKey="value" fill="#2F8258" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
