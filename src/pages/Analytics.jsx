import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { PageHeader, Card, inputClass } from '../components/ui';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../services/currencyService';
import { colorForCategory } from '../services/constants';
import { calculateCategoryBreakdown, calculateMonthlySeries } from '../services/calculationService';

const RANGES = [
  { key: '3', label: '3 months' },
  { key: '6', label: '6 months' },
  { key: '12', label: 'This year' },
];

export default function Analytics() {
  const { transactions, profile } = useApp();
  const [range, setRange] = useState('6');

  const breakdown = useMemo(() => calculateCategoryBreakdown(transactions, new Date(), 'expense'), [transactions]);
  const series = useMemo(() => calculateMonthlySeries(transactions, Number(range)), [transactions, range]);
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(14,23,18,0.06)';
  const textColor = isDark ? 'rgba(241,243,236,0.6)' : 'rgba(27,37,34,0.5)';

  if (transactions.length === 0) {
    return (
      <div className="animate-rise">
        <PageHeader title="Spending Analytics" subtitle="Visualize where your money goes over time." />
        <EmptyState icon={BarChart3} title="Nothing to chart yet" description="Add some transactions and your analytics will appear here." />
      </div>
    );
  }

  return (
    <div className="animate-rise">
      <PageHeader
        title="Spending Analytics"
        subtitle="Visualize where your money goes over time."
        actions={
          <select value={range} onChange={(e) => setRange(e.target.value)} className={`${inputClass} w-40`}>
            {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-5">
          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Income vs. expenses</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={(v) => formatCurrency(v, profile.currency)}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#2F8258" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#D2604A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Category breakdown (this month)</p>
          {breakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-ink-700/50 dark:text-canvas-100/40">No expenses this month yet.</div>
          ) : (
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={breakdown} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {breakdown.map((entry) => <Cell key={entry.category} fill={colorForCategory(entry.category)} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, profile.currency)} contentStyle={{ borderRadius: 12, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {breakdown.map((b) => (
                  <div key={b.category} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-ink-800 dark:text-canvas-100/80">
                      <span className="h-2 w-2 rounded-full" style={{ background: colorForCategory(b.category) }} />
                      {b.category}
                    </span>
                    <span className="text-ink-700/50 dark:text-canvas-100/40">{b.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Net savings trend</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => formatCurrency(v, profile.currency)} contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#C9A24B" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
