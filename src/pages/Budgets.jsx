import { useMemo, useState } from 'react';
import { Plus, PiggyBank, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Card, Button, Field, inputClass, ProgressBar, Badge } from '../components/ui';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency } from '../services/currencyService';
import { EXPENSE_CATEGORIES } from '../services/constants';
import { calculateTotalExpenses, isSameMonth } from '../services/calculationService';

const BLANK = { category: EXPENSE_CATEGORIES[0], amount: '' };

export default function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget, transactions, profile } = useApp();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const budgetsWithSpend = useMemo(() => {
    return budgets.map((b) => {
      const spent = calculateTotalExpenses(transactions, (t) => t.category === b.category && isSameMonth(t.date));
      return { ...b, spent, remaining: Math.max(b.amount - spent, 0), percent: b.amount > 0 ? (spent / b.amount) * 100 : 0 };
    });
  }, [budgets, transactions]);

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setModalOpen(true); };
  const openEdit = (b) => { setEditing(b); setForm({ category: b.category, amount: String(b.amount) }); setErrors({}); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Budget must be greater than zero.';
    if (!editing && budgets.some((b) => b.category === form.category)) next.category = 'A budget for this category already exists.';
    setErrors(next);
    if (Object.keys(next).length) return;

    if (editing) {
      updateBudget(editing.id, { category: form.category, amount: Number(form.amount) });
      showToast('Budget updated.');
    } else {
      addBudget({ category: form.category, amount: Number(form.amount) });
      showToast('Budget created.');
    }
    setModalOpen(false);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Budgets"
        subtitle="Set a monthly limit per category and track it in real time."
        actions={<Button onClick={openAdd}><Plus size={16} /> Create budget</Button>}
      />

      {budgets.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No budgets yet" description="Create a budget to keep a category in check." actionLabel="Create your first budget" onAction={openAdd} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetsWithSpend.map((b) => {
            const over = b.percent >= 100;
            const near = b.percent >= 85 && !over;
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display font-semibold text-ink-900 dark:text-canvas-50">{b.category}</p>
                    <p className="text-xs text-ink-700/50 dark:text-canvas-100/50 mt-0.5">Monthly budget</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} aria-label={`Edit ${b.category} budget`} className="p-1.5 rounded-lg hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring text-ink-700 dark:text-canvas-100/70"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(b)} aria-label={`Delete ${b.category} budget`} className="p-1.5 rounded-lg hover:bg-clay-500/10 text-clay-600 focus-ring"><Trash2 size={14} /></button>
                  </div>
                </div>
                <ProgressBar value={b.spent} max={b.amount} tone={over ? 'clay' : near ? 'gold' : 'moss'} />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-ink-700 dark:text-canvas-100/70">{formatCurrency(b.spent, profile.currency)} spent</span>
                  <span className="text-ink-700/50 dark:text-canvas-100/40">of {formatCurrency(b.amount, profile.currency)}</span>
                </div>
                <div className="mt-3">
                  {over && <Badge tone="danger">Exceeded by {formatCurrency(b.spent - b.amount, profile.currency)}</Badge>}
                  {near && <Badge tone="warning">Approaching limit</Badge>}
                  {!over && !near && <Badge tone="positive">{formatCurrency(b.remaining, profile.currency)} remaining</Badge>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit budget' : 'Create budget'}>
        <form onSubmit={handleSubmit}>
          <Field label="Category" error={errors.category}>
            <select value={form.category} disabled={!!editing} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputClass}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Monthly budget amount" error={errors.amount}>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className={inputClass} placeholder="e.g. 10000" />
          </Field>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create budget'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteBudget(deleteTarget.id); showToast('Budget deleted.', 'info'); }}
        title="Delete budget?"
        description={deleteTarget ? `This removes your ${deleteTarget.category} budget. Past transactions won't be affected.` : ''}
        confirmLabel="Delete budget"
      />
    </div>
  );
}
