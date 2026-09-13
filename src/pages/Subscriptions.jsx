import { useMemo, useState } from 'react';
import { Plus, Repeat, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Card, Button, Field, inputClass, Badge } from '../components/ui';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency } from '../services/currencyService';
import { calculateSubscriptionTotals, daysUntil } from '../services/calculationService';

const BLANK = { name: '', cost: '', frequency: 'monthly', nextBillingDate: '' };

export default function Subscriptions() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, profile } = useApp();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totals = useMemo(() => calculateSubscriptionTotals(subscriptions), [subscriptions]);
  const upcoming = useMemo(
    () => [...subscriptions].filter((s) => s.nextBillingDate).sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)),
    [subscriptions]
  );

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, cost: String(s.cost), frequency: s.frequency, nextBillingDate: s.nextBillingDate || '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Name this subscription or bill.';
    if (!form.cost || Number(form.cost) <= 0) next.cost = 'Cost must be greater than zero.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = { name: form.name, cost: Number(form.cost), frequency: form.frequency, nextBillingDate: form.nextBillingDate || null };
    if (editing) {
      updateSubscription(editing.id, payload);
      showToast('Subscription updated.');
    } else {
      addSubscription(payload);
      showToast('Subscription added.');
    }
    setModalOpen(false);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Bills & Subscriptions"
        subtitle="Recurring commitments that leave your account automatically."
        actions={<Button onClick={openAdd}><Plus size={16} /> Add subscription</Button>}
      />

      {subscriptions.length === 0 ? (
        <EmptyState icon={Repeat} title="No subscriptions tracked" description="Add recurring bills like rent, internet, or streaming services." actionLabel="Add subscription" onAction={openAdd} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-1">Monthly cost</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-canvas-50">{formatCurrency(totals.monthly, profile.currency)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-1">Yearly cost</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-canvas-50">{formatCurrency(totals.yearly, profile.currency)}</p>
            </Card>
          </div>

          {upcoming.length > 0 && (
            <Card className="p-5 mb-6">
              <p className="font-display font-semibold mb-3 text-ink-900 dark:text-canvas-50">Upcoming payments</p>
              <div className="space-y-2">
                {upcoming.slice(0, 5).map((s) => {
                  const days = daysUntil(s.nextBillingDate);
                  return (
                    <div key={s.id} className="flex items-center justify-between text-sm py-1.5">
                      <span className="text-ink-800 dark:text-canvas-100">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-ink-700/60 dark:text-canvas-100/50">{formatCurrency(s.cost, profile.currency)}</span>
                        <Badge tone={days <= 3 ? 'warning' : 'neutral'}>{days <= 0 ? 'Due today' : `in ${days}d`}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((s) => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-display font-semibold text-ink-900 dark:text-canvas-50">{s.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`} className="p-1.5 rounded-lg hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring text-ink-700 dark:text-canvas-100/70"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(s)} aria-label={`Delete ${s.name}`} className="p-1.5 rounded-lg hover:bg-clay-500/10 text-clay-600 focus-ring"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="font-display text-lg font-bold text-ink-900 dark:text-canvas-50">{formatCurrency(s.cost, profile.currency)}</p>
                <p className="text-xs text-ink-700/50 dark:text-canvas-100/50 capitalize">{s.frequency}{s.nextBillingDate && ` · next ${new Date(s.nextBillingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit subscription' : 'Add subscription'}>
        <form onSubmit={handleSubmit}>
          <Field label="Name" error={errors.name}>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Netflix, Rent" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost" error={errors.cost}>
              <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Billing frequency">
              <select value={form.frequency} onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))} className={inputClass}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </Field>
          </div>
          <Field label="Next billing date (optional)">
            <input type="date" value={form.nextBillingDate} onChange={(e) => setForm((p) => ({ ...p, nextBillingDate: e.target.value }))} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add subscription'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteSubscription(deleteTarget.id); showToast('Subscription removed.', 'info'); }}
        title="Delete subscription?"
        description={deleteTarget ? `This removes "${deleteTarget.name}" from your recurring payments.` : ''}
        confirmLabel="Delete subscription"
      />
    </div>
  );
}
