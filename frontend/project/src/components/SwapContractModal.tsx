import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { escrowConfirm, cancelSwapRequest, setCancellationDeadline } from '../store/slices/disputeSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ShieldAlert, Calendar, Clock, User, CheckCircle2,
    AlertTriangle, XOctagon, RefreshCw, FileSignature, ShieldCheck
} from 'lucide-react';
import DisputeModal from './DisputeModal';

interface SwapContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    swap: any;
    currentUser: any;
    onUpdate: () => void;
}

export default function SwapContractModal({ isOpen, onClose, swap, currentUser, onUpdate }: SwapContractModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [isDisputeOpen, setIsDisputeOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');
    const [showDeadlineForm, setShowDeadlineForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !swap) return null;

    const isSent = Number(swap.senderId) === Number(currentUser?.id);
    const partner = isSent ? swap.receiver : swap.sender;
    const isReceiver = Number(swap.receiverId) === Number(currentUser?.id);

    // Escrow confirmation statuses
    const userConfirmed = isSent ? swap.senderConfirmed : swap.receiverConfirmed;
    const partnerConfirmed = isSent ? swap.receiverConfirmed : swap.senderConfirmed;

    // Cancellation rules
    const hasDeadline = !!swap.cancellationDeadline;
    const deadlinePassed = hasDeadline ? new Date() > new Date(swap.cancellationDeadline) : false;
    const canCancel = swap.status === 'ACCEPTED' && (!hasDeadline || !deadlinePassed);

    const handleEscrowConfirm = async () => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(escrowConfirm(swap.id)).unwrap();
            onUpdate();
        } catch (err: any) {
            setError(err || 'Failed to record confirmation');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSwap = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cancelReason.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await dispatch(cancelSwapRequest({ id: swap.id, reason: cancelReason })).unwrap();
            setShowCancelForm(false);
            setCancelReason('');
            onUpdate();
        } catch (err: any) {
            setError(err || 'Failed to cancel swap');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDeadline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeadline) return;
        setLoading(true);
        setError(null);
        try {
            await dispatch(setCancellationDeadline({ id: swap.id, deadline: new Date(newDeadline).toISOString() })).unwrap();
            setShowDeadlineForm(false);
            setNewDeadline('');
            onUpdate();
        } catch (err: any) {
            setError(err || 'Failed to set deadline');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-neutral-100 bg-white">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
                                            <FileSignature className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-neutral-900">Swap Agreement</h3>
                                            <p className="text-neutral-500 text-xs mt-0.5">Agreement #{swap.id} • Skill Exchange Contract</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-neutral-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Body */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-neutral-800 text-sm">
                                {error && (
                                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                                        {error}
                                    </div>
                                )}

                                {/* Parties Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700">
                                            {currentUser?.profile?.avatarUrl ? (
                                                <img src={currentUser.profile.avatarUrl} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                currentUser?.name?.charAt(0) || <User className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Party A (You)</p>
                                            <p className="font-bold text-neutral-900">{currentUser?.name}</p>
                                            <p className="text-xs text-neutral-500 font-medium">Offering: {isSent ? swap.offeredSkill : swap.requestedSkill}</p>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                                            {partner?.profile?.avatarUrl ? (
                                                <img src={partner.profile.avatarUrl} className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                partner?.name?.charAt(0) || <User className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Party B</p>
                                            <p className="font-bold text-neutral-900">{partner?.name}</p>
                                            <p className="text-xs text-neutral-500 font-medium">Offering: {isSent ? swap.requestedSkill : swap.offeredSkill}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Swap Details Card */}
                                <div className="border border-neutral-100 rounded-2xl p-4 space-y-3">
                                    <h4 className="font-bold text-neutral-900 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary-500" />
                                        Contract Terms & Execution Schedule
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <span className="text-neutral-400 font-semibold block">SCHEDULED TIME</span>
                                            <span className="font-bold text-neutral-800">
                                                {swap.scheduledAt ? new Date(swap.scheduledAt).toLocaleString() : 'Not Scheduled'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400 font-semibold block">DURATION</span>
                                            <span className="font-bold text-neutral-800">{swap.duration || 60} Minutes</span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-400 font-semibold block">ROOM TYPE</span>
                                            <span className="font-bold text-neutral-800 flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Video Call
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cancellation & Exit Terms */}
                                <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-amber-950">Cancellation & Exit Policy</h4>
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                Swaps may be cancelled prior to the cancellation deadline. If you cancel, you must provide a constructive reason. Once the deadline passes or the session starts, the contract is locked. If your partner does not perform, please raise a dispute instead of cancelling.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-amber-200/50 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div>
                                            <span className="text-neutral-500 font-semibold uppercase">CANCELLATION DEADLINE</span>
                                            <p className="font-bold text-neutral-900 mt-0.5">
                                                {swap.cancellationDeadline ? (
                                                    <span className={deadlinePassed ? "text-red-600" : "text-emerald-700"}>
                                                        {new Date(swap.cancellationDeadline).toLocaleString()}
                                                        {deadlinePassed ? " (Passed - Locked)" : " (Active)"}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-500 italic">No deadline set yet</span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            {isReceiver && swap.status === 'ACCEPTED' && (
                                                <button
                                                    onClick={() => setShowDeadlineForm(!showDeadlineForm)}
                                                    className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-700 font-semibold rounded-lg hover:bg-neutral-50 transition-colors text-xs"
                                                >
                                                    {swap.cancellationDeadline ? 'Edit Deadline' : 'Set Deadline'}
                                                </button>
                                            )}

                                            {canCancel && (
                                                <button
                                                    onClick={() => setShowCancelForm(!showCancelForm)}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors text-xs"
                                                >
                                                    Cancel Swap Request
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Set Deadline form */}
                                    {showDeadlineForm && (
                                        <form onSubmit={handleSetDeadline} className="bg-white p-4 rounded-xl border border-neutral-100 space-y-3">
                                            <p className="text-xs font-bold text-neutral-700">Choose Cancellation Deadline:</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={newDeadline}
                                                    onChange={(e) => setNewDeadline(e.target.value)}
                                                    className="p-2 border border-neutral-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-neutral-400 flex-1"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* Cancel Swap Form */}
                                    {showCancelForm && (
                                        <form onSubmit={handleCancelSwap} className="bg-white p-4 rounded-xl border border-neutral-100 space-y-3">
                                            <p className="text-xs font-bold text-neutral-700">Reason for Cancellation:</p>
                                            <textarea
                                                required
                                                rows={2}
                                                placeholder="Explain why you need to exit this swap agreement..."
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                className="w-full p-2 border border-neutral-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500 resize-none"
                                            ></textarea>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCancelForm(false)}
                                                    className="px-3 py-1.5 text-neutral-500 font-semibold text-xs"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading || !cancelReason.trim()}
                                                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                                >
                                                    Confirm Cancellation
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Escrow Mutual Confirmation System */}
                                <div className="border border-neutral-100 rounded-2xl p-5 space-y-4">
                                    <h4 className="font-bold text-neutral-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        Mutual Confirmation & Escrow Verification
                                    </h4>
                                    <p className="text-xs text-neutral-500 leading-relaxed">
                                        To ensure transparency and completion, both parties must confirm that the session was completed successfully. Your swap credits and certifications are updated once mutual agreement is recorded.
                                    </p>

                                    <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${userConfirmed ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                                                <span className="font-medium text-neutral-600">Your Confirmation Status:</span>
                                                <strong className={userConfirmed ? "text-emerald-700" : "text-neutral-500"}>
                                                    {userConfirmed ? 'Confirmed' : 'Pending'}
                                                </strong>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${partnerConfirmed ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                                                <span className="font-medium text-neutral-600">Partner Confirmation Status:</span>
                                                <strong className={partnerConfirmed ? "text-emerald-700" : "text-neutral-500"}>
                                                    {partnerConfirmed ? 'Confirmed' : 'Pending'}
                                                </strong>
                                            </div>
                                        </div>

                                        {!userConfirmed && swap.status === 'ACCEPTED' && (
                                            <button
                                                onClick={handleEscrowConfirm}
                                                disabled={loading}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all text-xs flex items-center gap-1.5"
                                            >
                                                Confirm Completion
                                            </button>
                                        )}
                                    </div>

                                    {userConfirmed && partnerConfirmed && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                                            ✓ Mutual Confirmation Complete! Escrow Verification Released.
                                        </div>
                                    )}
                                </div>

                                {/* Dispute Trigger Section */}
                                <div className="border border-red-100 bg-red-50/20 rounded-2xl p-5 flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-red-950 flex items-center gap-1.5">
                                            <XOctagon className="w-4.5 h-4.5 text-red-600" />
                                            Dispute Reporting System
                                        </h4>
                                        <p className="text-xs text-red-800/80 leading-relaxed">
                                            Is there an active disagreement, a no-show, or poor behavior during the session? File a formal dispute. Our admins will investigate and escalate if needed.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsDisputeOpen(true)}
                                        className="px-4 py-2 border border-red-200 text-red-600 font-semibold rounded-xl text-xs hover:bg-red-50 transition-colors flex-shrink-0"
                                    >
                                        File Dispute
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dispute Modal */}
            <DisputeModal
                isOpen={isDisputeOpen}
                onClose={() => setIsDisputeOpen(false)}
                swapRequestId={swap.id}
                partnerName={partner?.name}
            />
        </>
    );
}
