export function Card({ children, className = '', onClick, as = 'div' }) {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      className={`bg-white dark:bg-ink-900 rounded-xl2 shadow-soft border border-ink-950/[0.04] dark:border-white/[0.06] ${onClick ? 'cursor-pointer hover:shadow-card hover:-translate-y-0.5 transition-all focus-ring' : ''} ${className}`}
      {...(onClick ? { role: 'button', tabIndex: 0, onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e) } : {})}
    >
      {children}
    </Tag>
  );
}

export function ProgressBar({ value, max = 100, tone = 'moss', className = '' }) {
  const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
  const tones = {
    moss: 'bg-moss-500',
    gold: 'bg-gold-500',
    clay: 'bg-clay-500',
  };
  return (
    <div className={`h-2 w-full rounded-full bg-ink-950/[0.06] dark:bg-white/10 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${tones[tone] || tones.moss}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-canvas-50">{title}</h1>
        {subtitle && <p className="text-sm text-ink-700/60 dark:text-canvas-100/60 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-moss-600 hover:bg-moss-700 text-white shadow-soft',
    secondary: 'bg-ink-950/[0.05] dark:bg-white/10 hover:bg-ink-950/10 dark:hover:bg-white/[0.15] text-ink-900 dark:text-canvas-50',
    danger: 'bg-clay-600 hover:bg-clay-500 text-white',
    ghost: 'hover:bg-ink-950/5 dark:hover:bg-white/10 text-ink-700 dark:text-canvas-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
  };
  return (
    <button
      className={`rounded-lg font-medium transition-colors focus-ring inline-flex items-center gap-1.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-ink-800 dark:text-canvas-100 mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-ink-700/50 dark:text-canvas-100/50 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-clay-600 dark:text-clay-400 mt-1 font-medium">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-ink-950/10 dark:border-white/10 bg-canvas-50 dark:bg-ink-950 text-ink-900 dark:text-canvas-50 text-sm focus-ring placeholder:text-ink-700/40 dark:placeholder:text-canvas-100/30';

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-ink-950/5 dark:bg-white/10 text-ink-700 dark:text-canvas-100/80',
    positive: 'bg-moss-500/10 text-moss-700 dark:text-moss-300',
    warning: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
    danger: 'bg-clay-500/10 text-clay-600 dark:text-clay-400',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
