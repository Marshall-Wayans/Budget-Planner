export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl2 border border-dashed border-ink-950/10 dark:border-white/10 animate-rise">
      {Icon && (
        <div className="h-14 w-14 rounded-full bg-moss-50 dark:bg-white/5 flex items-center justify-center text-moss-600 dark:text-moss-300 mb-4">
          <Icon size={26} />
        </div>
      )}
      <h3 className="font-display font-semibold text-lg text-ink-900 dark:text-canvas-50">{title}</h3>
      {description && <p className="text-sm text-ink-700/70 dark:text-canvas-100/60 mt-1.5 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2.5 rounded-lg bg-moss-600 hover:bg-moss-700 text-white text-sm font-medium shadow-soft focus-ring transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
