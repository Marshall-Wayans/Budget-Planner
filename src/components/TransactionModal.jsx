import { useEffect, useState } from 'react';
import Modal from './Modal';
import { Button, Field, inputClass } from './ui';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, INCOME_FREQUENCIES, PAYMENT_METHODS } from '../services/constants';

const todayISO = () => new Date().toISOString().slice(0, 10);

const BLANK = {
  type: 'expense',
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  description: '',
  date: todayISO(),
  paymentMethod: PAYMENT_METHODS[0],
  frequency: 'One-time',
  isRecurring: false,
};

export default function TransactionModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...BLANK, ...initial, amount: String(initial.amount ?? '') } : BLANK);
      setErrors({});
    }
  }, [open, initial]);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter an amount greater than zero.';
    if (!form.date) next.date = 'Pick a valid date.';
    if (form.type === 'expense' && !form.category) next.category = 'Choose a category.';
    if (form.type === 'income' && !form.category) next.category = 'Choose a source.';
    if (!form.description.trim()) next.description = 'Add a short description.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await onSave({ ...form, amount: Number(form.amount) });
    setSaving(false);
  };

  const categoryOptions = form.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES;

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={handleSubmit}>
        <div className="flex rounded-lg bg-ink-950/[0.05] dark:bg-white/5 p-1 mb-5">
          {['expense', 'income'].map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setForm((p) => ({ ...p, type: t, category: t === 'income' ? INCOME_SOURCES[0] : EXPENSE_CATEGORIES[0] }))}
              className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-colors focus-ring ${
                form.type === t ? 'bg-white dark:bg-ink-800 shadow-soft text-ink-900 dark:text-canvas-50' : 'text-ink-700/60 dark:text-canvas-100/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <Field label="Amount" error={errors.amount}>
          <input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} className={inputClass} placeholder="0.00" />
        </Field>

        <Field label={form.type === 'income' ? 'Source' : 'Category'} error={errors.category}>
          <select value={form.category} onChange={set('category')} className={inputClass}>
            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Description" error={errors.description}>
          <input value={form.description} onChange={set('description')} className={inputClass} placeholder="e.g. Uber to work" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" error={errors.date}>
            <input type="date" value={form.date} onChange={set('date')} className={inputClass} />
          </Field>
          <Field label={form.type === 'income' ? 'Frequency' : 'Payment method'}>
            {form.type === 'income' ? (
              <select value={form.frequency} onChange={set('frequency')} className={inputClass}>
                {INCOME_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <select value={form.paymentMethod} onChange={set('paymentMethod')} className={inputClass}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </Field>
        </div>

        {form.type === 'expense' && (
          <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-canvas-100/80 mb-2 cursor-pointer">
            <input type="checkbox" checked={form.isRecurring} onChange={set('isRecurring')} className="rounded accent-moss-600" />
            Mark as recurring
          </label>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}</Button>
        </div>
      </form>
    </Modal>
  );
}
