import { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    onSubmit: (rating: number, feedback: string) => void;
}

export default function RatingModal({ isOpen, onClose, recipientName, onSubmit }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit(rating, feedback);
        setRating(0);
        setFeedback('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-neutral-900">Rate your Session</h2>
                            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="text-center">
                                <p className="text-neutral-600 mb-4">How was your swap with <span className="font-bold text-primary-600">{recipientName}</span>?</p>
                                <div className="flex justify-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${(hover || rating) >= star
                                                        ? 'fill-warning-400 text-warning-400'
                                                        : 'text-neutral-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Leave some feedback (optional)
                                </label>
                                <div className="relative">
                                    <MessageSquare className="absolute left-3 top-3 text-neutral-400 w-4 h-4" />
                                    <textarea
                                        rows={3}
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="What did you learn? What could be improved?"
                                        className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={rating === 0}
                                className={`w-full py-3 rounded-xl font-bold text-white transition-all ${rating > 0
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-600 hover:shadow-lg'
                                        : 'bg-neutral-300 cursor-not-allowed'
                                    }`}
                            >
                                Submit Rating
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
