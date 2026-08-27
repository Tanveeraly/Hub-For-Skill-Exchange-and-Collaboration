import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { acceptCall, rejectCall, saveCallRecord } from '../store/slices/callSlice';
import { socket } from '../services/socket';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IncomingCallModal() {
    const dispatch = useDispatch<AppDispatch>();
    const { callState, incomingCallData } = useSelector((state: RootState) => state.call);
    const { user } = useSelector((state: RootState) => state.auth);

    // Only show when receiving a call
    if (callState !== 'receiving' || !incomingCallData) return null;

    const handleAccept = () => {
        dispatch(acceptCall());
    };

    const handleReject = () => {
        // Notify caller that call was rejected
        socket.emit('call-rejected', {
            callerId: incomingCallData.callerId,
            receiverId: user?.id,
            reason: 'User declined the call'
        });

        // Save as rejected call
        if (user?.id) {
            dispatch(saveCallRecord({
                callerId: incomingCallData.callerId,
                receiverId: user.id,
                callType: incomingCallData.callType,
                status: 'rejected'
            }));
        }

        dispatch(rejectCall());
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={handleReject}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-sm bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-8 shadow-2xl border border-neutral-700/50"
                >
                    {/* Close button */}
                    <button
                        onClick={handleReject}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>

                    {/* Caller Avatar with Ring Animation */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            {/* Pulsing rings */}
                            <motion.div
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 rounded-full bg-success-500/30"
                            />
                            <motion.div
                                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                                className="absolute inset-0 rounded-full bg-success-500/20"
                            />

                            {/* Avatar */}
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                                {incomingCallData.callerAvatar ? (
                                    <img
                                        src={incomingCallData.callerAvatar}
                                        alt={incomingCallData.callerName}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    incomingCallData.callerName?.charAt(0)?.toUpperCase() || 'U'
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Caller Info */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {incomingCallData.callerName || 'Unknown Caller'}
                        </h2>
                        <div className="flex items-center justify-center space-x-2 text-neutral-400">
                            {incomingCallData.callType === 'video' ? (
                                <>
                                    <Video className="w-5 h-5" />
                                    <span>Incoming Video Call</span>
                                </>
                            ) : (
                                <>
                                    <Phone className="w-5 h-5" />
                                    <span>Incoming Audio Call</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Call Animation */}
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className="flex justify-center mb-8"
                    >
                        <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-2 h-2 rounded-full bg-success-400"
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center space-x-8">
                        {/* Reject Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReject}
                            className="group relative"
                        >
                            <div className="w-16 h-16 rounded-full bg-error-500 hover:bg-error-600 flex items-center justify-center shadow-lg shadow-error-500/30 transition">
                                <PhoneOff className="w-7 h-7 text-white" />
                            </div>
                            <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-sm text-neutral-400 whitespace-nowrap">
                                Decline
                            </span>
                        </motion.button>

                        {/* Accept Button */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAccept}
                            className="group relative"
                        >
                            <motion.div
                                animate={{ boxShadow: ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 40px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.3)'] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-16 h-16 rounded-full bg-success-500 hover:bg-success-600 flex items-center justify-center shadow-lg transition"
                            >
                                <Phone className="w-7 h-7 text-white" />
                            </motion.div>
                            <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-sm text-neutral-400 whitespace-nowrap">
                                Accept
                            </span>
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
