import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Target, Landmark, Repeat,
  BarChart3, Sparkles, Calculator, Compass, Settings, Wallet, X,
} from 'lucide-react';

const SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Money',
    items: [
      { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/budgets', label: 'Budgets', icon: PiggyBank },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/goals', label: 'Savings Goals', icon: Target },
      { to: '/debts', label: 'Debts', icon: Landmark },
      { to: '/subscriptions', label: 'Bills & Subscriptions', icon: Repeat },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/advisor', label: 'Money Advisor', icon: Sparkles },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/what-if', label: 'What-If Simulator', icon: Compass },
    ],
  },
  {
    label: 'Tools',
    items: [{ to: '/calculator', label: 'Money Calculator', icon: Calculator }],
  },
  {
    label: '',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
          isActive
            ? 'bg-moss-600 text-white shadow-soft'
            : 'text-ink-700 dark:text-canvas-100/80 hover:bg-ink-950/[0.05] dark:hover:bg-white/[0.08]'
        }`
      }
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink-950/50 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 shrink-0 bg-white dark:bg-ink-900 border-r border-ink-950/[0.06] dark:border-white/[0.06] z-50 lg:z-0 transform transition-transform lg:transform-none overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-moss-600 flex items-center justify-center text-white">
              <Wallet size={17} />
            </div>
            <span className="font-display font-bold text-lg text-ink-900 dark:text-canvas-50">Ledger</span>
          </div>
          <button onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-full hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring">
            <X size={18} />
          </button>
        </div>
        <nav className="px-3 pb-8 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.label || section.items[0].to}>
              {section.label && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-700/40 dark:text-canvas-100/30">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem key={item.to} {...item} onNavigate={onCloseMobile} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
