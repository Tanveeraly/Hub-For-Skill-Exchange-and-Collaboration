import { motion, AnimatePresence } from 'framer-motion';
import { Video, Phone, X, Clock, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MeetingInvitationModalProps {
    isOpen: boolean;
    senderName: string;
    senderAvatar?: string;
    swapDetails?: {
        offeredSkill: string;
        requestedSkill: string;
        scheduledAt?: string;
    };
    onAccept: () => void;
    onReject: () => void;
}

export default function MeetingInvitationModal({
    isOpen,
    senderName,
    senderAvatar,
    swapDetails,
    onAccept,
    onReject
}: MeetingInvitationModalProps) {
    const [timeElapsed, setTimeElapsed] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setTimeElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);

        // Auto-reject after 30 seconds
        const timeout = setTimeout(() => {
            onReject();
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isOpen, onReject]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gradient-to-br from-white to-primary-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-primary-100"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-600 p-6 text-white relative overflow-hidden">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-white/10"
                        />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <Video className="w-5 h-5" />
                                    <h3 className="text-lg font-bold">Meeting Invitation</h3>
                                </div>
                                <button
                                    onClick={onReject}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-primary-100 text-sm">Incoming meeting request</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {/* Caller Avatar */}
                        <div className="flex justify-center mb-6">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="relative"
                            >
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                                    {senderAvatar ? (
                                        <img
                                            src={senderAvatar}
                                            alt={senderName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        senderName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border-4 border-primary-400 border-t-transparent rounded-full"
                                />
                            </motion.div>
                        </div>

                        {/* Caller Name */}
                        <h2 className="text-2xl font-black text-neutral-900 text-center mb-2">
                            {senderName}
                        </h2>
                        <p className="text-neutral-500 text-center text-sm mb-6">
                            wants to start a meeting
                        </p>

                        {/* Swap Details */}
                        {swapDetails && (
                            <div className="bg-white rounded-2xl p-4 mb-6 border border-neutral-100 shadow-sm">
                                <div className="flex items-center justify-center space-x-2 text-sm mb-2">
                                    <RefreshCw className="w-4 h-4 text-primary-600" />
                                    <span className="font-bold text-neutral-900">Swap Session</span>
                                </div>
                                <p className="text-xs text-center text-neutral-600">
                                    {swapDetails.offeredSkill} <span className="text-neutral-400 mx-1">⇄</span> {swapDetails.requestedSkill}
                                </p>
                                {swapDetails.scheduledAt && (
                                    <div className="flex items-center justify-center mt-2 text-xs text-neutral-500">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(swapDetails.scheduledAt).toLocaleDateString()} at{' '}
                                        {new Date(swapDetails.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Timer */}
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-neutral-100 rounded-full px-4 py-2 flex items-center space-x-2">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-2 h-2 bg-error-500 rounded-full"
                                />
                                <span className="text-sm font-bold text-neutral-700">
                                    {timeElapsed}s • {30 - timeElapsed}s left
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onReject}
                                className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl font-bold transition-colors flex items-center justify-center space-x-2"
                            >
                                <Phone className="w-5 h-5 rotate-[135deg]" />
                                <span>Decline</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onAccept}
                                className="flex-1 py-4 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-success-200 flex items-center justify-center space-x-2"
                            >
                                <Video className="w-5 h-5" />
                                <span>Join Meeting</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
