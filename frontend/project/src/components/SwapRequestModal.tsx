import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Calendar, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RootState, AppDispatch } from '../store/store';
import { fetchTermsAcceptance, acceptTerms, setShowTermsModal } from '../store/swapAgreementSlice';
import { createSwapRequest } from '../store/slices/swapsSlice';
import TermsAndConditionsModal from './TermsAndConditionsModal';

interface SwapRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientSkill: string;
    skillId: number;
    userSkills: string[];
    onSubmit: (data: any) => void;
}

export default function SwapRequestModal({ isOpen, onClose, recipientName, recipientSkill, skillId, userSkills, onSubmit }: SwapRequestModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { hasAcceptedTerms, showTermsModal } = useSelector((state: RootState) => state.swapAgreement);

    const [formData, setFormData] = useState({
        skillOffered: '',
        message: ''
    });
    const [timeSlots, setTimeSlots] = useState<{ date: string; time: string }[]>([
        { date: '', time: '' }
    ]);
    const [showSuccess, setShowSuccess] = useState(false);

    // Check T&C acceptance when modal opens
    useEffect(() => {
        if (isOpen) {
            dispatch(fetchTermsAcceptance());
        }
    }, [isOpen, dispatch]);

    const addTimeSlot = () => {
        if (timeSlots.length < 3) {
            setTimeSlots([...timeSlots, { date: '', time: '' }]);
        }
    };

    const removeTimeSlot = (index: number) => {
        setTimeSlots(timeSlots.filter((_, i) => i !== index));
    };

    const handleTimeSlotChange = (index: number, field: 'date' | 'time', value: string) => {
        const newSlots = [...timeSlots];
        newSlots[index][field] = value;
        setTimeSlots(newSlots);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user has accepted terms
        if (!hasAcceptedTerms) {
            dispatch(setShowTermsModal(true));
            return;
        }

        // Show success animation
        setShowSuccess(true);

        // Submit after a brief delay to show animation
        setTimeout(() => {
            dispatch(createSwapRequest({
                skillId: skillId,
                message: formData.message,
                offeredSkill: formData.skillOffered,
                requestedSkill: recipientSkill,
                preferredTimeSlots: timeSlots.map(s => `${s.date} ${s.time}`)
            })).then(() => {
                onSubmit(formData);
                setShowSuccess(false);
                setFormData({ skillOffered: '', message: '' });
                setTimeSlots([{ date: '', time: '' }]);
                onClose();
            });
        }, 1500);
    };

    const handleTermsAccept = async () => {
        await dispatch(acceptTerms());
        // The modal will auto-close via Redux state
    };

    return (
        <>
            {/* Terms and Conditions Modal */}
            <TermsAndConditionsModal
                isOpen={showTermsModal}
                onClose={() => dispatch(setShowTermsModal(false))}
                onAccept={handleTermsAccept}
            />

            {/* Success Animation Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="bg-white rounded-full p-8 shadow-2xl"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: 360 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <CheckCircle className="w-20 h-20 text-success-500" />
                            </motion.div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Swap Request Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                                <h2 className="text-xl font-bold text-neutral-900">Propose a Swap</h2>
                                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="bg-primary-50 p-4 rounded-lg">
                                    <p className="text-sm text-primary-800">
                                        You are requesting <span className="font-bold">{recipientSkill}</span> from <span className="font-bold">{recipientName}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        What skill can you offer?
                                    </label>
                                    <select
                                        required
                                        value={formData.skillOffered}
                                        onChange={(e) => setFormData({ ...formData, skillOffered: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    >
                                        <option value="">Select a skill...</option>
                                        {userSkills.map((skill, idx) => (
                                            <option key={idx} value={skill}>{skill}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3 bg-primary-50 rounded-lg flex items-center space-x-3 border border-primary-100">
                                        <div className="p-2 bg-primary-100 rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-primary-900">Session Type: Video Call</p>
                                            <p className="text-xs text-primary-700">Once accepted, you can join the session from the Swap Center.</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-medium text-neutral-700">
                                            Preferred Time Slots (Max 3)
                                        </label>
                                        {timeSlots.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={addTimeSlot}
                                                className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                                            >
                                                + Add Slot
                                            </button>
                                        )}
                                    </div>

                                    {timeSlots.map((slot, index) => (
                                        <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 w-3 h-3" />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={slot.date}
                                                        onChange={(e) => handleTimeSlotChange(index, 'date', e.target.value)}
                                                        className="w-full pl-7 pr-2 py-1.5 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Time</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400 w-3 h-3" />
                                                    <input
                                                        type="time"
                                                        required
                                                        value={slot.time}
                                                        onChange={(e) => handleTimeSlotChange(index, 'time', e.target.value)}
                                                        className="w-full pl-7 pr-2 py-1.5 text-sm border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            {timeSlots.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTimeSlot(index)}
                                                    className="p-2 text-neutral-400 hover:text-error-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Optional Message
                                    </label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 text-neutral-400 w-4 h-4" />
                                        <textarea
                                            rows={2}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Introduce yourself or explain what you want to learn..."
                                            className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-primary-600 to-primary-600 text-white py-2.5 rounded-lg font-bold hover:shadow-lg transition-all active:scale-[0.98]"
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
