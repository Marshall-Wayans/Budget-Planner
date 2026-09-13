import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: 'bg-moss-600 text-white',
  warning: 'bg-gold-500 text-ink-950',
  error: 'bg-clay-600 text-white',
  info: 'bg-ink-800 text-white',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    counter.current += 1;
    const id = counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 3800);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-pop flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-card ${STYLES[t.type] || STYLES.info}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="opacity-70 hover:opacity-100 focus-ring rounded"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
