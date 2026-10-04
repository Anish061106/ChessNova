import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
            variant === 'danger'
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
          {message}
        </p>

        <div className="flex gap-2.5 w-full">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            className="flex-1 shadow-sm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
