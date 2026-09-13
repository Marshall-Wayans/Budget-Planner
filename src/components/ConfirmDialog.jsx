import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', description, confirmLabel = 'Delete', danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex gap-3">
        <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${danger ? 'bg-clay-500/10 text-clay-600' : 'bg-moss-500/10 text-moss-600'}`}>
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm text-ink-700 dark:text-canvas-100/80 leading-relaxed">{description}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-ink-700 dark:text-canvas-100 hover:bg-ink-950/5 dark:hover:bg-white/10 focus-ring"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white focus-ring ${danger ? 'bg-clay-600 hover:bg-clay-500' : 'bg-moss-600 hover:bg-moss-500'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
