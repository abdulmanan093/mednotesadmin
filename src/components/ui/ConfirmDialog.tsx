'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm',
  onConfirm, onCancel, variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${
            variant === 'danger' ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'
          }`}>
            {variant === 'danger'
              ? <Trash2 className="h-4 w-4" />
              : <AlertTriangle className="h-4 w-4" />
            }
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              variant === 'danger'
                ? 'bg-danger hover:bg-red-600'
                : 'bg-warning hover:bg-amber-600'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
