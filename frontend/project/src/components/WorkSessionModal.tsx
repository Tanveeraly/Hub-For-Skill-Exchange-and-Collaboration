import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Target } from 'lucide-react';

interface WorkSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (description: string) => void;
}

export default function WorkSessionModal({ isOpen, onClose, onStart }: WorkSessionModalProps) {
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            onStart(description);
            setDescription('');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-neutral-900 flex items-center">
                                <Play className="w-5 h-5 mr-2 text-primary-600" />
                                Start Work Session
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">
                                    Session Goal
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What do you plan to achieve in this session?"
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none h-32"
                                    required
                                />
                            </div>

                            <div className="bg-primary-50 p-4 rounded-xl flex items-start">
                                <Target className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" />
                                <p className="text-sm text-primary-700">
                                    Tracking your time helps build trust and creates a transparent record of your contribution to the swap.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-200 transition-all flex items-center justify-center transform active:scale-95"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Timer
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
