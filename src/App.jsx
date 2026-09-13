import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Debts from './pages/Debts';
import Subscriptions from './pages/Subscriptions';
import Advisor from './pages/Advisor';
import Analytics from './pages/Analytics';
import WhatIf from './pages/WhatIf';
import Calculator from './pages/Calculator';
import Settings from './pages/Settings';

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas-50 dark:bg-ink-950">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-ink-900/90 backdrop-blur border-b border-ink-950/[0.06] dark:border-white/[0.06]">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="p-2 -ml-2 rounded-lg hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring"
          >
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-ink-900 dark:text-canvas-50">Ledger</span>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/what-if" element={<WhatIf />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
