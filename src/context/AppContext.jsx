import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadState, saveState, STORAGE_KEYS, clearAll } from '../services/storageService';
import { DEFAULT_CURRENCY } from '../services/currencyService';

const AppContext = createContext(null);

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  currency: DEFAULT_CURRENCY,
  country: 'Kenya',
  monthlyIncomeTarget: 0,
  savingsTarget: 0,
  budgetingMethod: 'Smart Split',
  theme: 'system',
  notifications: {
    budgetAlerts: true,
    billReminders: true,
    savingsReminders: true,
    spendingWarnings: true,
  },
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => loadState(STORAGE_KEYS.TRANSACTIONS, []));
  const [budgets, setBudgets] = useState(() => loadState(STORAGE_KEYS.BUDGETS, []));
  const [goals, setGoals] = useState(() => loadState(STORAGE_KEYS.GOALS, []));
  const [debts, setDebts] = useState(() => loadState(STORAGE_KEYS.DEBTS, []));
  const [subscriptions, setSubscriptions] = useState(() => loadState(STORAGE_KEYS.SUBSCRIPTIONS, []));
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...loadState(STORAGE_KEYS.PROFILE, {}) }));

  useEffect(() => {
    saveState(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveState(STORAGE_KEYS.BUDGETS, budgets);
  }, [budgets]);

  useEffect(() => {
    saveState(STORAGE_KEYS.GOALS, goals);
  }, [goals]);

  useEffect(() => {
    saveState(STORAGE_KEYS.DEBTS, debts);
  }, [debts]);

  useEffect(() => {
    saveState(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  }, [subscriptions]);

  useEffect(() => {
    saveState(STORAGE_KEYS.PROFILE, profile);
  }, [profile]);

  // Dark mode application
  useEffect(() => {
    const root = document.documentElement;
    const apply = (isDark) => root.classList.toggle('dark', isDark);
    if (profile.theme === 'dark') apply(true);
    else if (profile.theme === 'light') apply(false);
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const listener = (e) => apply(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [profile.theme]);

  // Transactions (income + expense)
  const addTransaction = (tx) => {
    const record = { id: makeId(), createdAt: new Date().toISOString(), ...tx };
    setTransactions((prev) => [record, ...prev]);
    return record;
  };
  const updateTransaction = (id, updates) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };
  const deleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Budgets
  const addBudget = (b) => setBudgets((prev) => [...prev, { id: makeId(), ...b }]);
  const updateBudget = (id, updates) => setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  const deleteBudget = (id) => setBudgets((prev) => prev.filter((b) => b.id !== id));

  // Goals
  const addGoal = (g) => setGoals((prev) => [...prev, { id: makeId(), currentAmount: 0, ...g }]);
  const updateGoal = (id, updates) => setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const contributeToGoal = (id, amount) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, currentAmount: Number(g.currentAmount || 0) + Number(amount) } : g)));
  };

  // Debts
  const addDebt = (d) => setDebts((prev) => [...prev, { id: makeId(), ...d }]);
  const updateDebt = (id, updates) => setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  const deleteDebt = (id) => setDebts((prev) => prev.filter((d) => d.id !== id));

  // Subscriptions
  const addSubscription = (s) => setSubscriptions((prev) => [...prev, { id: makeId(), ...s }]);
  const updateSubscription = (id, updates) => setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  const deleteSubscription = (id) => setSubscriptions((prev) => prev.filter((s) => s.id !== id));

  const updateProfile = (updates) => setProfile((prev) => ({ ...prev, ...updates }));

  const resetAllData = () => {
    clearAll();
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setDebts([]);
    setSubscriptions([]);
    setProfile(DEFAULT_PROFILE);
  };

  const value = useMemo(
    () => ({
      transactions, addTransaction, updateTransaction, deleteTransaction,
      budgets, addBudget, updateBudget, deleteBudget,
      goals, addGoal, updateGoal, deleteGoal, contributeToGoal,
      debts, addDebt, updateDebt, deleteDebt,
      subscriptions, addSubscription, updateSubscription, deleteSubscription,
      profile, updateProfile,
      resetAllData,
    }),
    [transactions, budgets, goals, debts, subscriptions, profile]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}