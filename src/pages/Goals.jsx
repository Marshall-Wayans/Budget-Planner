import { useState } from 'react';
import { Plus, Target, Trash2, Pencil, PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Card, Button, Field, inputClass, ProgressBar } from '../components/ui';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency } from '../services/currencyService';
import { GOAL_TEMPLATES } from '../services/constants';
import { calculateGoalProgress } from '../services/calculationService';

const BLANK = { name: GOAL_TEMPLATES[0], targetAmount: '', currentAmount: '0', deadline: '', monthlyContribution: '' };

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal, profile } = useApp();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [contributeTarget, setContributeTarget] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setModalOpen(true); };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ name: g.name, targetAmount: String(g.targetAmount), currentAmount: String(g.currentAmount), deadline: g.deadline || '', monthlyContribution: String(g.monthlyContribution || '') });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.targetAmount || Number(form.targetAmount) <= 0) next.targetAmount = 'Target must be greater than zero.';
    if (Number(form.currentAmount) < 0) next.currentAmount = 'Cannot be negative.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount || 0),
      deadline: form.deadline || null,
      monthlyContribution: Number(form.monthlyContribution || 0),
    };

    if (editing) {
      updateGoal(editing.id, payload);
      showToast('Goal updated.');
    } else {
      addGoal(payload);
      showToast('Goal created.');
    }
    setModalOpen(false);
  };

  const handleContribute = (e) => {
    e.preventDefault();
    const amt = Number(contributeAmount);
    if (!amt || amt <= 0) return;
    contributeToGoal(contributeTarget.id, amt);
    showToast(`Added ${formatCurrency(amt, profile.currency)} to ${contributeTarget.name}.`);
    setContributeTarget(null);
    setContributeAmount('');
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Savings Goals"
        subtitle="Give your savings a purpose and track progress toward it."
        actions={<Button onClick={openAdd}><Plus size={16} /> Add goal</Button>}
      />

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No savings goals yet" description="Create your first goal — an emergency fund is a great place to start." actionLabel="Create your first goal" onAction={openAdd} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const { progress, monthsRequired, estimatedDate } = calculateGoalProgress(g);
            return (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-display font-semibold text-ink-900 dark:text-canvas-50">{g.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} aria-label={`Edit ${g.name}`} className="p-1.5 rounded-lg hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring text-ink-700 dark:text-canvas-100/70"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(g)} aria-label={`Delete ${g.name}`} className="p-1.5 rounded-lg hover:bg-clay-500/10 text-clay-600 focus-ring"><Trash2 size={14} /></button>
                  </div>
                </div>
                <ProgressBar value={g.currentAmount} max={g.targetAmount} tone="gold" />
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="font-semibold text-ink-900 dark:text-canvas-50">{formatCurrency(g.currentAmount, profile.currency)}</span>
                  <span className="text-ink-700/50 dark:text-canvas-100/40">of {formatCurrency(g.targetAmount, profile.currency)}</span>
                </div>
                <p className="text-xs text-ink-700/60 dark:text-canvas-100/50 mt-2">
                  {progress >= 100
                    ? 'Goal reached! 🎉'
                    : monthsRequired
                    ? `About ${monthsRequired} month${monthsRequired === 1 ? '' : 's'} left at current pace${estimatedDate ? ` (~${estimatedDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })})` : ''}.`
                    : 'Add a monthly contribution to estimate a completion date.'}
                </p>
                <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setContributeTarget(g)}>
                  <PlusCircle size={14} /> Add contribution
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit goal' : 'Add savings goal'}>
        <form onSubmit={handleSubmit}>
          <Field label="Goal name">
            <input list="goal-templates" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
            <datalist id="goal-templates">{GOAL_TEMPLATES.map((t) => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Target amount" error={errors.targetAmount}>
            <input type="number" min="0" step="0.01" value={form.targetAmount} onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))} className={inputClass} />
          </Field>
          <Field label="Current amount saved" error={errors.currentAmount}>
            <input type="number" min="0" step="0.01" value={form.currentAmount} onChange={(e) => setForm((p) => ({ ...p, currentAmount: e.target.value }))} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target date (optional)">
              <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} className={inputClass} />
            </Field>
            <Field label="Monthly contribution">
              <input type="number" min="0" step="0.01" value={form.monthlyContribution} onChange={(e) => setForm((p) => ({ ...p, monthlyContribution: e.target.value }))} className={inputClass} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create goal'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!contributeTarget} onClose={() => setContributeTarget(null)} title={`Add to ${contributeTarget?.name || ''}`} maxWidth="max-w-sm">
        <form onSubmit={handleContribute}>
          <Field label="Contribution amount">
            <input autoFocus type="number" min="0" step="0.01" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} className={inputClass} placeholder="0.00" />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setContributeTarget(null)}>Cancel</Button>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteGoal(deleteTarget.id); showToast('Goal deleted.', 'info'); }}
        title="Delete goal?"
        description={deleteTarget ? `This permanently removes "${deleteTarget.name}" and its progress.` : ''}
        confirmLabel="Delete goal"
      />
    </div>
  );
}
