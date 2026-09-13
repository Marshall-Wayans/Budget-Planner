import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px] animate-pop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl2 bg-white dark:bg-ink-900 shadow-card animate-pop`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-950/[0.06] dark:border-white/[0.06] sticky top-0 bg-white dark:bg-ink-900 rounded-t-xl2">
          <h2 className="font-display font-semibold text-lg text-ink-900 dark:text-canvas-50">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring text-ink-700 dark:text-canvas-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-ink-950/[0.06] dark:border-white/[0.06] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
