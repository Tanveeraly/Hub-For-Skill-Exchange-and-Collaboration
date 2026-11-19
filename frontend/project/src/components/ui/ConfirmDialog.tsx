import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  /** Show a text box. Its value is passed to onConfirm. */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  onConfirm: (text: string) => void;
  onClose: () => void;
}

/** In-page replacement for window.confirm / window.prompt. */
export default function ConfirmDialog({
  isOpen, title, description, confirmLabel, tone = 'primary',
  inputLabel, inputPlaceholder, inputRequired, onConfirm, onClose,
}: ConfirmDialogProps) {
  const [text, setText] = useState('');
  useEffect(() => { if (isOpen) setText(''); }, [isOpen]);
  const blocked = !!inputRequired && !text.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            disabled={blocked}
            onClick={() => { onConfirm(text.trim()); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-neutral-600">{description}</p>}
      {inputLabel && (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">{inputLabel}</span>
          <textarea
            rows={3}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={inputPlaceholder}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </label>
      )}
    </Modal>
  );
}
