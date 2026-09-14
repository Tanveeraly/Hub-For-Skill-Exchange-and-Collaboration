import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { fileDispute } from '../store/slices/disputeSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertOctagon, Send } from 'lucide-react';

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    swapRequestId: number;
    partnerName: string;
}

export default function DisputeModal({ isOpen, onClose, swapRequestId, partnerName }: DisputeModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [priority, setPriority] = useState('MEDIUM');
    const [evidence, setEvidence] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await dispatch(fileDispute({
                swapRequestId,
                subject,
                description,
                category,
                priority,
                evidence: evidence ? { text: evidence } : null
            })).unwrap();

            if (result) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setSubject('');
                    setDescription('');
                    setCategory('GENERAL');
                    setPriority('MEDIUM');
                    setEvidence('');
                    onClose();
                }, 2000);
            }
        } catch (err: any) {
            setError(err || 'Failed to file dispute');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[75]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-red-50/50">
                        <h3 className="text-xl font-bold text-red-900 flex items-center">
                            <AlertOctagon className="w-5 h-5 mr-2 text-red-600 animate-bounce" />
                            File a Dispute
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-red-100/50 rounded-full transition-colors">
                            <X className="w-5 h-5 text-red-700" />
                        </button>
                    </div>

                    {success ? (
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <Send className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-neutral-900">Dispute Filed Successfully</h4>
                            <p className="text-neutral-500 text-sm">
                                Our administrators have been notified and will review your dispute details.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs text-neutral-600">
                                You are filing a formal dispute regarding the swap with <strong className="text-neutral-900">{partnerName}</strong>. Please provide honest details to help resolution.
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Brief subject of the dispute..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm text-neutral-700 placeholder-neutral-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm text-neutral-700"
                                    >
                                        <option value="GENERAL">General</option>
                                        <option value="NO_SHOW">Partner No Show</option>
                                        <option value="QUALITY">Low Quality Session</option>
                                        <option value="MISCONDUCT">Misbehavior/Abuse</option>
                                        <option value="BREACH_OF_TERMS">Breach of Terms</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm text-neutral-700"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-1">Description / Details</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Please explain the issue in detail, including dates and what went wrong..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none text-sm text-neutral-700 placeholder-neutral-400"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-1">Evidence / Links (Optional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Paste links to documents, images or chats that back up your dispute..."
                                    value={evidence}
                                    onChange={(e) => setEvidence(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none text-sm text-neutral-700 placeholder-neutral-400"
                                ></textarea>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading || !subject || !description}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Dispute
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
