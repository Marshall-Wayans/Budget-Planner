const NAMESPACE = 'ledger.finance-app.v1';

function key(name) {
  return `${NAMESPACE}.${name}`;
}

export function loadState(name, fallback) {
  try {
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`storageService: failed to load "${name}", using fallback.`, err);
    return fallback;
  }
}

export function saveState(name, value) {
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`storageService: failed to save "${name}".`, err);
    return false;
  }
}

export function clearAll() {
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(NAMESPACE))
    .forEach((k) => window.localStorage.removeItem(k));
}

export const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  DEBTS: 'debts',
  SUBSCRIPTIONS: 'subscriptions',
  PROFILE: 'profile',
};
