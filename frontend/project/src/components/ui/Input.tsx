import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const fieldClass = (error?: string) =>
  `w-full rounded-md border bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
    error ? 'border-error-500 focus:border-error-500 focus:ring-error-100' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100'
  }`;

function FieldShell({ id, label, hint, error, children }: { id: string; label?: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>}
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="mt-1.5 text-xs text-error-700">{error}</p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1.5 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, hint, error, className = '', id, ...props }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={`${fieldClass(error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function Textarea({ label, hint, error, className = '', id, ...props }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={`${fieldClass(error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}
