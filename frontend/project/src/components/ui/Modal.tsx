import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, className = '' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-neutral-200 bg-white p-5 shadow-lg sm:rounded-lg ${className}`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>}
          <button type="button" onClick={onClose} className="ml-auto rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
