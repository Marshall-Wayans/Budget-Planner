import { useState } from 'react';
import { Sun, Moon, Monitor, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Card, Field, inputClass, Button } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import { CURRENCIES } from '../services/currencyService';

const THEMES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
];

export default function Settings() {
  const { profile, updateProfile, resetAllData } = useApp();
  const { showToast } = useToast();
  const [form, setForm] = useState(profile);
  const [resetOpen, setResetOpen] = useState(false);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const setNotif = (key) => (e) => setForm((p) => ({ ...p, notifications: { ...p.notifications, [key]: e.target.checked } }));

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(form);
    showToast('Your settings were saved.');
  };

  const setTheme = (theme) => {
    setForm((p) => ({ ...p, theme }));
    updateProfile({ theme });
  };

  return (
    <div className="animate-rise max-w-2xl">
      <PageHeader title="Settings" subtitle="Your profile, preferences, and appearance." />

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-5">
          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Profile</p>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Name"><input value={form.name} onChange={set('name')} className={inputClass} /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="you@example.com" /></Field>
            <Field label="Currency">
              <select value={form.currency} onChange={set('currency')} className={inputClass}>
                {Object.entries(CURRENCIES).map(([code, c]) => <option key={code} value={code}>{code} — {c.name}</option>)}
              </select>
            </Field>
            <Field label="Country"><input value={form.country} onChange={set('country')} className={inputClass} /></Field>
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Financial preferences</p>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Monthly income target"><input type="number" min="0" value={form.monthlyIncomeTarget} onChange={set('monthlyIncomeTarget')} className={inputClass} /></Field>
            <Field label="Savings target"><input type="number" min="0" value={form.savingsTarget} onChange={set('savingsTarget')} className={inputClass} /></Field>
          </div>
          <Field label="Preferred budgeting method">
            <select value={form.budgetingMethod} onChange={set('budgetingMethod')} className={inputClass}>
              <option>Smart Split</option>
              <option>50/30/20</option>
              <option>Zero-based</option>
              <option>Envelope</option>
            </select>
          </Field>
        </Card>

        <Card className="p-5">
          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Notifications</p>
          <div className="space-y-3">
            {[
              ['budgetAlerts', 'Budget alerts'],
              ['billReminders', 'Bill reminders'],
              ['savingsReminders', 'Savings reminders'],
              ['spendingWarnings', 'Spending warnings'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-ink-800 dark:text-canvas-100">{label}</span>
                <input type="checkbox" checked={form.notifications?.[key] ?? true} onChange={setNotif(key)} className="h-4 w-4 rounded accent-moss-600" />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-display font-semibold text-ink-900 dark:text-canvas-50 mb-4">Appearance</p>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-colors focus-ring ${
                  form.theme === t.key ? 'border-moss-600 bg-moss-500/10' : 'border-ink-950/10 dark:border-white/10 hover:bg-ink-950/[0.02] dark:hover:bg-white/[0.04]'
                }`}
              >
                <t.icon size={18} className={form.theme === t.key ? 'text-moss-600' : 'text-ink-700/60 dark:text-canvas-100/50'} />
                <span className="text-xs font-medium text-ink-800 dark:text-canvas-100">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save settings</Button>
        </div>
      </form>

      <Card className="p-5 mt-6 border-clay-500/20">
        <p className="font-display font-semibold text-clay-600 mb-2">Danger zone</p>
        <p className="text-sm text-ink-700/60 dark:text-canvas-100/50 mb-3">Permanently erase every transaction, budget, goal, debt, and subscription stored on this device.</p>
        <Button variant="danger" onClick={() => setResetOpen(true)}><Trash2 size={16} /> Reset all data</Button>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => { resetAllData(); showToast('All data has been reset.', 'info'); }}
        title="Reset all data?"
        description="This permanently deletes everything stored in this app on this device. This cannot be undone."
        confirmLabel="Reset everything"
      />
    </div>
  );
}
