import { useEffect, useState } from 'react';
import NotificationToast, { Toast, ToastType } from '../components/NotificationToast';

// Tiny global toast store. Call toast.success('Saved') from anywhere;
// <Toaster /> (mounted once in App) renders them.
type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(toasts));

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function show(type: ToastType, message: string, durationMs = 4500) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, type, message }].slice(-4);
  emit();
  window.setTimeout(() => remove(id), durationMs);
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message, 6000),
  info: (message: string) => show('info', message),
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>(toasts);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);
  return <NotificationToast toasts={items} removeToast={remove} />;
}
