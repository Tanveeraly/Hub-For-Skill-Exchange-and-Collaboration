import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function NotificationToast({ toasts, removeToast }: NotificationToastProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        layout
                        className={`flex items-center p-4 rounded-lg shadow-lg min-w-[300px] max-w-md backdrop-blur-sm ${toast.type === 'success' ? 'bg-success-50/90 border border-success-200 text-success-800' :
                                toast.type === 'error' ? 'bg-error-50/90 border border-error-200 text-error-800' :
                                    'bg-primary-50/90 border border-primary-200 text-primary-800'
                            }`}
                    >
                        <div className="flex-shrink-0 mr-3">
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-success-600" />}
                            {toast.type === 'error' && <XCircle className="w-5 h-5 text-error-600" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-primary-600" />}
                        </div>
                        <p className="flex-1 text-sm font-medium">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-3 text-neutral-400 hover:text-neutral-600 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
