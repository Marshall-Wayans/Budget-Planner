import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowLeftRight, Repeat, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, Card, Button, Badge, inputClass } from '../components/ui';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionModal from '../components/TransactionModal';
import { formatCurrency } from '../services/currencyService';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '../services/constants';

export default function Transactions() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, profile } = useApp();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const allCategories = useMemo(() => Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_SOURCES])), []);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (categoryFilter !== 'all') list = list.filter((t) => t.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          t.paymentMethod?.toLowerCase().includes(q)
      );
    }
    const sorters = {
      'date-desc': (a, b) => new Date(b.date) - new Date(a.date),
      'date-asc': (a, b) => new Date(a.date) - new Date(b.date),
      'amount-desc': (a, b) => b.amount - a.amount,
      'amount-asc': (a, b) => a.amount - b.amount,
    };
    return list.sort(sorters[sortBy]);
  }, [transactions, typeFilter, categoryFilter, search, sortBy]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t) => { setEditing(t); setModalOpen(true); };

  const handleSave = async (data) => {
    if (editing) {
      updateTransaction(editing.id, data);
      showToast('Transaction updated.');
    } else {
      addTransaction(data);
      showToast('Transaction added.');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTransaction(deleteTarget.id);
    showToast('Transaction deleted.', 'info');
  };

  const exportCSV = () => {
    const header = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method'];
    const rows = filtered.map((t) => [t.date, t.type, t.category, t.description, t.amount, t.paymentMethod || t.frequency || '']);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export ready — check your downloads.');
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Transactions"
        subtitle="Every expense and income entry in one place."
        actions={
          <>
            <Button variant="secondary" onClick={exportCSV} disabled={transactions.length === 0}>
              <Download size={16} /> Export CSV
            </Button>
            <Button onClick={openAdd}><Plus size={16} /> Add transaction</Button>
          </>
        }
      />

      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Start tracking your spending and income to see where your money goes."
          actionLabel="Add your first transaction"
          onAction={openAdd}
        />
      ) : (
        <>
          <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40 dark:text-canvas-100/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, category, amount…"
                className={`${inputClass} pl-9`}
                aria-label="Search transactions"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputClass} md:w-40`}>
              <option value="all">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputClass} md:w-44`}>
              <option value="all">All categories</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${inputClass} md:w-44`}>
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Highest amount</option>
              <option value="amount-asc">Lowest amount</option>
            </select>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState title="No matching transactions" description="Try a different search term or filter." />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/40 border-b border-ink-950/[0.06] dark:border-white/[0.06]">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-b border-ink-950/[0.04] dark:border-white/[0.04] last:border-0 hover:bg-ink-950/[0.02] dark:hover:bg-white/[0.03]">
                        <td className="px-4 py-3 whitespace-nowrap text-ink-700/70 dark:text-canvas-100/60">
                          {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-900 dark:text-canvas-50">
                          <div className="flex items-center gap-1.5">
                            {t.description}
                            {t.isRecurring && <Repeat size={12} className="text-ink-700/40 dark:text-canvas-100/40" />}
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge>{t.category}</Badge></td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-moss-600 dark:text-moss-400' : 'text-ink-900 dark:text-canvas-50'}`}>
                          {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount, profile.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(t)} aria-label={`Edit ${t.description}`} className="p-1.5 rounded-lg hover:bg-ink-950/5 dark:hover:bg-white/10 text-ink-700 dark:text-canvas-100/70 focus-ring">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteTarget(t)} aria-label={`Delete ${t.description}`} className="p-1.5 rounded-lg hover:bg-clay-500/10 text-clay-600 focus-ring">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initial={editing} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete transaction?"
        description={deleteTarget ? `This will permanently remove "${deleteTarget.description}" (${formatCurrency(deleteTarget.amount, profile.currency)}).` : ''}
        confirmLabel="Delete transaction"
      />
    </div>
  );
}
