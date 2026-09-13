import { useMemo, useState } from 'react';
import { Plus, Landmark, Trash2, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Card, Button, Field, inputClass, ProgressBar, Badge } from '../components/ui';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency } from '../services/currencyService';
import { calculateDebtPayoff } from '../services/calculationService';

const BLANK = { name: '', lender: '', originalAmount: '', remainingBalance: '', interestRate: '', minimumPayment: '', dueDate: '' };

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt, profile } = useApp();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const totals = useMemo(() => {
    const totalDebt = debts.reduce((s, d) => s + Number(d.remainingBalance || 0), 0);
    const totalMonthly = debts.reduce((s, d) => s + Number(d.minimumPayment || 0), 0);
    const highest = debts.length ? [...debts].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0] : null;
    return { totalDebt, totalMonthly, highest };
  }, [debts]);

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, lender: d.lender || '', originalAmount: String(d.originalAmount || ''),
      remainingBalance: String(d.remainingBalance), interestRate: String(d.interestRate || 0),
      minimumPayment: String(d.minimumPayment || 0), dueDate: d.dueDate || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Give this debt a name.';
    if (!form.remainingBalance || Number(form.remainingBalance) < 0) next.remainingBalance = 'Enter a valid balance.';
    if (Number(form.interestRate) < 0) next.interestRate = 'Cannot be negative.';
    if (Number(form.minimumPayment) < 0) next.minimumPayment = 'Cannot be negative.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: form.name, lender: form.lender,
      originalAmount: Number(form.originalAmount || form.remainingBalance),
      remainingBalance: Number(form.remainingBalance),
      interestRate: Number(form.interestRate || 0),
      minimumPayment: Number(form.minimumPayment || 0),
      dueDate: form.dueDate || null,
    };

    if (editing) {
      updateDebt(editing.id, payload);
      showToast('Debt updated.');
    } else {
      addDebt(payload);
      showToast('Debt added.');
    }
    setModalOpen(false);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Debt Management"
        subtitle="Track balances and see how extra payments speed up payoff."
        actions={<Button onClick={openAdd}><Plus size={16} /> Add debt</Button>}
      />

      {debts.length === 0 ? (
        <EmptyState icon={Landmark} title="No debts tracked" description="Add a debt to see your total obligations and a payoff plan." actionLabel="Add a debt" onAction={openAdd} />
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-1">Total debt</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-canvas-50">{formatCurrency(totals.totalDebt, profile.currency)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-1">Monthly payments</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-canvas-50">{formatCurrency(totals.totalMonthly, profile.currency)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 mb-1">Highest interest</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-canvas-50">{totals.highest ? `${totals.highest.name} (${totals.highest.interestRate}%)` : '—'}</p>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {debts.map((d) => {
              const payoff = calculateDebtPayoff(d.remainingBalance, d.interestRate, d.minimumPayment);
              const progress = d.originalAmount > 0 ? ((d.originalAmount - d.remainingBalance) / d.originalAmount) * 100 : 0;
              return (
                <Card key={d.id} className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-display font-semibold text-ink-900 dark:text-canvas-50">{d.name}</p>
                      {d.lender && <p className="text-xs text-ink-700/50 dark:text-canvas-100/50">{d.lender}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(d)} aria-label={`Edit ${d.name}`} className="p-1.5 rounded-lg hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring text-ink-700 dark:text-canvas-100/70"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(d)} aria-label={`Delete ${d.name}`} className="p-1.5 rounded-lg hover:bg-clay-500/10 text-clay-600 focus-ring"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <ProgressBar value={progress} tone="moss" />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(d.remainingBalance, profile.currency)} left</span>
                    <Badge tone="neutral">{d.interestRate}% APR</Badge>
                  </div>
                  <p className="text-xs text-ink-700/60 dark:text-canvas-100/50 mt-2">
                    {payoff.payoffPossible
                      ? `At ${formatCurrency(d.minimumPayment, profile.currency)}/mo, paid off in ~${payoff.months} months (${formatCurrency(payoff.totalInterest, profile.currency)} interest).`
                      : 'Current payment may not be enough to cover interest — consider increasing it.'}
                  </p>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit debt' : 'Add debt'}>
        <form onSubmit={handleSubmit}>
          <Field label="Debt name" error={errors.name}>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="e.g. Car loan" />
          </Field>
          <Field label="Lender (optional)">
            <input value={form.lender} onChange={(e) => setForm((p) => ({ ...p, lender: e.target.value }))} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Original amount">
              <input type="number" min="0" step="0.01" value={form.originalAmount} onChange={(e) => setForm((p) => ({ ...p, originalAmount: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Remaining balance" error={errors.remainingBalance}>
              <input type="number" min="0" step="0.01" value={form.remainingBalance} onChange={(e) => setForm((p) => ({ ...p, remainingBalance: e.target.value }))} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interest rate (% APR)" error={errors.interestRate}>
              <input type="number" min="0" step="0.1" value={form.interestRate} onChange={(e) => setForm((p) => ({ ...p, interestRate: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Minimum payment" error={errors.minimumPayment}>
              <input type="number" min="0" step="0.01" value={form.minimumPayment} onChange={(e) => setForm((p) => ({ ...p, minimumPayment: e.target.value }))} className={inputClass} />
            </Field>
          </div>
          <Field label="Due date (optional)">
            <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add debt'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteDebt(deleteTarget.id); showToast('Debt removed.', 'info'); }}
        title="Delete debt?"
        description={deleteTarget ? `This removes "${deleteTarget.name}" from your debt tracker.` : ''}
        confirmLabel="Delete debt"
      />
    </div>
  );
}
