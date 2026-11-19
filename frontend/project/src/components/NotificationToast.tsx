import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface NotificationToastProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

const styles: Record<ToastType, { box: string; icon: JSX.Element }> = {
    success: { box: 'border-success-200', icon: <CheckCircle className="h-5 w-5 text-success-600" /> },
    error: { box: 'border-error-200', icon: <XCircle className="h-5 w-5 text-error-600" /> },
    info: { box: 'border-neutral-200', icon: <Info className="h-5 w-5 text-primary-600" /> },
};

export default function NotificationToast({ toasts, removeToast }: NotificationToastProps) {
    return (
        <div
            aria-live="polite"
            className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-end gap-2 md:inset-x-auto md:bottom-4 md:right-4"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    role={toast.type === 'error' ? 'alert' : 'status'}
                    className={`pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-lg border bg-white p-4 shadow-lg ${styles[toast.type].box}`}
                >
                    <span className="shrink-0">{styles[toast.type].icon}</span>
                    <p className="flex-1 text-sm text-neutral-800">{toast.message}</p>
                    <button
                        type="button"
                        onClick={() => removeToast(toast.id)}
                        className="shrink-0 rounded p-0.5 text-neutral-400 hover:text-neutral-700"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
