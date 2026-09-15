import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { socket } from '../services/socket';
import axios from 'axios';
import {
    Calendar as CalendarIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Star,
    RefreshCw,
    User,
    Video,
    ExternalLink,
    FileText,
    Calendar,
    Play,
    Pause,
    Paperclip,
    MessageSquare,
    X as CloseIcon,
    FileSignature,
    CheckCircle2
} from 'lucide-react';
import Collaboration from '../components/Collaboration';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SubmitProgressModal from '../components/SubmitProgressModal';
import { RootState, AppDispatch } from '../store/store';
import { fetchMyDisputes } from '../store/slices/disputeSlice';
import SwapContractModal from '../components/SwapContractModal';
import {
    fetchReceivedSwaps,
    fetchSentSwaps,
    respondToSwap,
    rescheduleSwap,
    completeSwap,
    submitRating,
    requestMoreInfo
} from '../store/slices/swapsSlice';
import { initiateCall } from '../store/slices/callSlice';
import RatingModal from '../components/RatingModal';
import WorkSessionModal from '../components/WorkSessionModal';
import MeetingInvitationModal from '../components/MeetingInvitationModal';
import { startWorkSession, endWorkSession, fetchWorkSessions, submitReport, fetchReports } from '../store/slices/collabSlice';
import Tabs from '../components/ui/Tabs';

function useCountdown(targetDate: string | null) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
        if (!targetDate) return;
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                setTimeLeft(distance > -3600000 ? "In Progress" : "Ended");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`);
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
}

export default function SwapScheduling() {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { received, sent } = useSelector((state: RootState) => state.swaps);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const { myDisputes } = useSelector((state: RootState) => state.disputes);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'calendar' | 'pending' | 'active' | 'history' | 'disputes'>('calendar');
    const [selectedSwapForContract, setSelectedSwapForContract] = useState<any>(null);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [selectedRequestForRating, setSelectedRequestForRating] = useState<any>(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
    const [selectedSwapForWork, setSelectedSwapForWork] = useState<number | null>(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [selectedSwapForChat, setSelectedSwapForChat] = useState<any>(null);
    const [rescheduleData, setRescheduleData] = useState({ id: 0, date: '', time: '', agenda: '' });
    const [invitationModal, setInvitationModal] = useState<{
        isOpen: boolean;
        senderId: number;
        senderName: string;
        senderAvatar?: string;
        swapDetails?: any;
    }>({
        isOpen: false,
        senderId: 0,
        senderName: '',
    });

    useEffect(() => {
        dispatch(fetchReceivedSwaps());
        dispatch(fetchSentSwaps());
        dispatch(fetchMyDisputes());
    }, [dispatch]);

    const allSwaps = [...received, ...sent];

    const handleAccept = (id: number, slot: string) => {
        dispatch(respondToSwap({
            id,
            status: 'ACCEPTED',
            scheduledAt: slot
        }));
    };

    const handleReject = (id: number) => {
        const reason = prompt("Reason for rejection (optional):");
        dispatch(respondToSwap({ id, status: 'REJECTED', rejectionReason: reason || undefined }));
    };

    const handleComplete = (id: number) => {
        dispatch(completeSwap(id));
    };

    const handleRatingSubmit = (rating: number, feedback: string) => {
        if (selectedRequestForRating) {
            dispatch(submitRating({
                swapRequestId: selectedRequestForRating.id,
                rating,
                feedback
            }));
            setIsRatingModalOpen(false);
            setSelectedRequestForRating(null);
        }
    };

    const handleRescheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(rescheduleSwap({
            id: rescheduleData.id,
            proposedTimeSlot: `${rescheduleData.date} ${rescheduleData.time}`,
            meetingAgenda: rescheduleData.agenda // Need to ensure backend accepts this
        }));
        setIsRescheduleModalOpen(false);
    };

    const handleRequestMoreInfo = (id: number) => {
        const message = prompt("What additional details do you need?");
        if (message) {
            dispatch(requestMoreInfo({ id, message }));
        }
    };

    const handleViewProfile = (userId: number) => {
        navigate(`/profile/${userId}`);
    };

    const handleJoinMeeting = (swap: any) => {
        console.log("Attempting to join meeting for swap:", swap);
        const partner = Number(swap.senderId) === Number(currentUser?.id) ? swap.receiver : swap.sender;

        if (!partner) {
            console.error("No partner found for swap:", swap);
            return;
        }

        dispatch(initiateCall({
            remoteUser: {
                id: Number(partner.id),
                name: partner.name,
                avatarUrl: partner.profile?.avatarUrl
            },
            callType: 'video'
        }));
    };

    const handleInviteToMeeting = (swap: any) => {
        const partner = Number(swap.senderId) === Number(currentUser?.id) ? swap.receiver : swap.sender;
        if (!partner) return;

        socket.emit('meeting-invite', {
            senderId: currentUser?.id,
            receiverId: partner.id,
            senderName: currentUser?.name,
            senderAvatar: currentUser?.profile?.avatarUrl,
            swapDetails: {
                id: swap.id,
                offeredSkill: swap.offeredSkill,
                requestedSkill: swap.requestedSkill,
                scheduledAt: swap.scheduledAt
            }
        });
        alert(`Invitation sent to ${partner.name}`);
    };

    useEffect(() => {
        const handleInviteReceived = (data: any) => {
            setInvitationModal({
                isOpen: true,
                senderId: data.senderId,
                senderName: data.senderName,
                senderAvatar: data.senderAvatar,
                swapDetails: data.swapDetails
            });
        };

        const handleInviteAccepted = (data: any) => {
            const swap = (allSwaps as any[]).find(s => s.id === data.swapDetails?.id);
            if (swap) {
                handleJoinMeeting(swap);
            } else {
                // Fallback if swap not in list
                dispatch(initiateCall({
                    remoteUser: {
                        id: Number(data.receiverId),
                        name: data.acceptorName,
                    },
                    callType: 'video'
                }));
            }
        };

        const handleInviteRejected = (data: any) => {
            alert(`${data.acceptorName || 'Partner'} declined the meeting invitation.`);
        };

        socket.on('meeting-invite-received', handleInviteReceived);
        socket.on('meeting-invite-accepted', handleInviteAccepted);
        socket.on('meeting-invite-rejected', handleInviteRejected);

        return () => {
            socket.off('meeting-invite-received', handleInviteReceived);
            socket.off('meeting-invite-accepted', handleInviteAccepted);
            socket.off('meeting-invite-rejected', handleInviteRejected);
        };
    }, [currentUser, allSwaps]);

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendar = () => {
        const days = daysInMonth(selectedDate);
        const firstDay = firstDayOfMonth(selectedDate);
        const calendarDays = [];

        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty - ${i} `} className="h-32 bg-neutral-50/30 border border-neutral-100"></div>);
        }

        for (let day = 1; day <= days; day++) {
            const dateStr = `${selectedDate.getFullYear()} -${String(selectedDate.getMonth() + 1).padStart(2, '0')} -${String(day).padStart(2, '0')} `;
            const daySwaps = allSwaps.filter((s: any) => s.status === 'ACCEPTED' && s.scheduledAt?.split('T')[0] === dateStr);

            calendarDays.push(
                <div key={day} className="h-32 border border-neutral-100 p-2 hover:bg-primary-50/50 transition relative group overflow-y-auto">
                    <span className="font-medium text-neutral-500 text-sm">{day}</span>
                    {daySwaps.map((s: any, idx) => (
                        <div key={idx} className="mt-1 text-[10px] bg-primary-100 text-primary-700 p-1 rounded truncate flex items-center">
                            <Clock className="w-2 h-2 mr-1" />
                            {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    ))}
                </div>
            );
        }

        return calendarDays;
    };

    const getTabContent = () => {
        switch (activeTab) {
            case 'pending':
                const pending = allSwaps.filter((s: any) => s.status === 'PENDING' || s.status === 'RESCHEDULED');
                return (
                    <div className="space-y-4">
                        {pending.length === 0 && <EmptyState message="No pending requests" />}
                        {pending.map((swap: any) => (
                            <SwapCard
                                key={swap.id}
                                swap={swap}
                                isSent={Number(swap.senderId) === Number(currentUser?.id)}
                                onAccept={handleAccept}
                                onReject={handleReject}
                                onReschedule={(id: number) => {
                                    setRescheduleData({ ...rescheduleData, id });
                                    setIsRescheduleModalOpen(true);
                                }}
                                onJoinMeeting={handleJoinMeeting}
                                onInviteToMeeting={handleInviteToMeeting}
                                onRequestMoreInfo={handleRequestMoreInfo}
                                onViewProfile={handleViewProfile}
                                onViewContract={(s: any) => {
                                    setSelectedSwapForContract(s);
                                    setIsContractModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                );
            case 'active':
                const active = allSwaps.filter((s: any) => s.status === 'ACCEPTED');
                return (
                    <div className="space-y-4">
                        {active.length === 0 && <EmptyState message="No active sessions" />}
                        {active.map((swap: any) => (
                            <SwapCard
                                key={swap.id}
                                swap={swap}
                                isSent={Number(swap.senderId) === Number(currentUser?.id)}
                                onComplete={handleComplete}
                                onJoinMeeting={handleJoinMeeting}
                                onInviteToMeeting={handleInviteToMeeting}
                                onViewProfile={handleViewProfile}
                                onStartWork={(id: number) => {
                                    setSelectedSwapForWork(id);
                                    setIsWorkModalOpen(true);
                                }}
                                onOpenChat={(s: any) => {
                                    setSelectedSwapForChat(s);
                                    setIsChatModalOpen(true);
                                }}
                                onViewContract={(s: any) => {
                                    setSelectedSwapForContract(s);
                                    setIsContractModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                );
            case 'history':
                const history = allSwaps.filter((s: any) => s.status === 'COMPLETED' || s.status === 'CANCELLED' || s.status === 'REJECTED');
                return (
                    <div className="space-y-4">
                        {history.length === 0 && <EmptyState message="No past sessions" />}
                        {history.map((swap: any) => (
                            <SwapCard
                                key={swap.id}
                                swap={swap}
                                isSent={Number(swap.senderId) === Number(currentUser?.id)}
                                onRate={(s: any) => {
                                    setSelectedRequestForRating(s);
                                    setIsRatingModalOpen(true);
                                }}
                                onJoinMeeting={handleJoinMeeting}
                                onInviteToMeeting={handleInviteToMeeting}
                                onViewProfile={handleViewProfile}
                                onStartWork={(id: number) => {
                                    setSelectedSwapForWork(id);
                                    setIsWorkModalOpen(true);
                                }}
                                onOpenChat={(s: any) => {
                                    setSelectedSwapForChat(s);
                                    setIsChatModalOpen(true);
                                }}
                                onViewContract={(s: any) => {
                                    setSelectedSwapForContract(s);
                                    setIsContractModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                );
            case 'disputes':
                return (
                    <div className="space-y-4">
                        {myDisputes.length === 0 && <EmptyState message="No disputes filed yet" />}
                        {myDisputes.map((dispute: any) => {
                            const isFiler = Number(dispute.filedById) === Number(currentUser?.id);
                            const opponent = isFiler ? dispute.against : dispute.filedBy;

                            return (
                                <div key={dispute.id} className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2.5 h-full bg-red-500"></div>
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider ${
                                                    dispute.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                                                    dispute.status === 'ESCALATED' ? 'bg-rose-100 text-rose-800' :
                                                    dispute.status === 'DISMISSED' ? 'bg-neutral-100 text-neutral-800' :
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {dispute.status}
                                                </span>
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider ${
                                                    dispute.priority === 'CRITICAL' ? 'bg-red-200 text-red-900 animate-pulse' :
                                                    dispute.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {dispute.priority} PRIORITY
                                                </span>
                                                <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                                                    Category: {dispute.category}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-neutral-900">{dispute.subject}</h3>
                                                <p className="text-xs text-neutral-400 mt-0.5">
                                                    Filed on {new Date(dispute.createdAt).toLocaleDateString()} at {new Date(dispute.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>

                                            <p className="text-sm text-neutral-600 leading-relaxed bg-neutral-50/50 p-3 rounded-xl border border-neutral-100/50">
                                                {dispute.description}
                                            </p>

                                            <div className="text-xs text-neutral-500 flex flex-wrap gap-x-6 gap-y-1 pt-1">
                                                <span>
                                                    <strong>Filing Side:</strong> {isFiler ? 'You (Filer)' : opponent?.name}
                                                </span>
                                                <span>
                                                    <strong>Opposing Side:</strong> {isFiler ? opponent?.name : 'You'}
                                                </span>
                                                <span>
                                                    <strong>Related Swap Request:</strong> ID #{dispute.swapRequestId}
                                                </span>
                                            </div>

                                            {dispute.evidence && (
                                                <div className="mt-2 text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg">
                                                    <strong>Evidence text/links:</strong> {typeof dispute.evidence === 'string' ? dispute.evidence : dispute.evidence.text || JSON.stringify(dispute.evidence)}
                                                </div>
                                            )}

                                            {/* Resolution Message Banner */}
                                            {(dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED') && (
                                                <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl space-y-2">
                                                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-xs">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                        Administrative Resolution History
                                                    </div>
                                                    {dispute.resolution && (
                                                        <p className="text-sm text-emerald-800">
                                                            <strong>Resolution decision:</strong> {dispute.resolution}
                                                        </p>
                                                    )}
                                                    {dispute.adminNotes && (
                                                        <p className="text-xs text-emerald-700 italic">
                                                            <strong>Admin notes:</strong> "{dispute.adminNotes}"
                                                        </p>
                                                    )}
                                                    {dispute.resolvedAt && (
                                                        <p className="text-[10px] text-emerald-600">
                                                            Resolved on {new Date(dispute.resolvedAt).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            default:
                return (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-neutral-900 flex items-center">
                                <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
                                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                                    className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 border-b border-neutral-100">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {renderCalendar()}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            <div className="max-w-5xl mx-auto px-4">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black text-neutral-900 tracking-tight"
                        >
                            Swap Center
                        </motion.h1>
                        <p className="text-neutral-500 mt-2 font-medium">Coordinate your skills exchange and track growth</p>
                    </div>

                    <Tabs
                        active={activeTab}
                        onChange={(value) => setActiveTab(value as typeof activeTab)}
                        items={['pending', 'active', 'history', 'calendar', 'disputes'].map((tab) => ({
                            value: tab,
                            label: tab === 'history' ? 'Completed' : tab.charAt(0).toUpperCase() + tab.slice(1),
                        }))}
                    />
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {getTabContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <RatingModal
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
                recipientName={selectedRequestForRating?.senderId === currentUser?.id ? selectedRequestForRating?.receiver?.name : selectedRequestForRating?.sender?.name}
                onSubmit={handleRatingSubmit}
            />

            <SwapContractModal
                isOpen={isContractModalOpen}
                onClose={() => {
                    setIsContractModalOpen(false);
                    setSelectedSwapForContract(null);
                }}
                swap={selectedSwapForContract}
                currentUser={currentUser}
                onUpdate={() => {
                    dispatch(fetchReceivedSwaps());
                    dispatch(fetchSentSwaps());
                }}
            />

            <WorkSessionModal
                isOpen={isWorkModalOpen}
                onClose={() => setIsWorkModalOpen(false)}
                onStart={(description) => {
                    if (selectedSwapForWork) {
                        dispatch(startWorkSession({ swapRequestId: selectedSwapForWork, description }));
                    }
                }}
            />

            {/* Reschedule Modal */}
            <AnimatePresence>
                {isRescheduleModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-4">Propose new time</h3>
                            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 border rounded-xl"
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                />
                                <input
                                    type="time"
                                    required
                                    className="w-full p-3 border rounded-xl"
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                />
                                <textarea
                                    placeholder="Meeting Agenda (Optional)"
                                    className="w-full p-3 border rounded-xl h-24 resize-none"
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, agenda: e.target.value })}
                                />
                                <div className="flex space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRescheduleModalOpen(false)}
                                        className="flex-1 py-3 text-neutral-500 font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold"
                                    >
                                        Propose
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Collaboration Chat Modal */}
            <AnimatePresence>
                {isChatModalOpen && selectedSwapForChat && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative"
                        >
                            <button
                                onClick={() => setIsChatModalOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full z-10 transition-colors"
                            >
                                <CloseIcon className="w-6 h-6 text-neutral-400" />
                            </button>
                            <div className="flex flex-col md:flex-row h-[700px]">
                                <div className="md:w-1/3 p-8 bg-neutral-50 border-r border-neutral-100 hidden md:block">
                                    <h3 className="text-2xl font-black text-neutral-900 mb-6">Agreement Details</h3>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
                                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-2">Partner</p>
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold mr-3">
                                                    {(Number(selectedSwapForChat.senderId) === Number(currentUser?.id) ? selectedSwapForChat.receiver?.name : selectedSwapForChat.sender?.name)?.charAt(0)}
                                                </div>
                                                <span className="font-bold text-neutral-900">
                                                    {Number(selectedSwapForChat.senderId) === Number(currentUser?.id) ? selectedSwapForChat.receiver?.name : selectedSwapForChat.sender?.name}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
                                            <p className="text-[10px] font-bold text-success-600 uppercase tracking-widest mb-2">Skills Exchange</p>
                                            <p className="text-sm font-medium text-neutral-700">
                                                {selectedSwapForChat.offeredSkill} <span className="text-neutral-400 mx-1">for</span> {selectedSwapForChat.requestedSkill}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-100">
                                            <p className="text-[10px] font-bold text-accent-600 uppercase tracking-widest mb-2">Schedule</p>
                                            <p className="text-sm font-medium text-neutral-700">
                                                {new Date(selectedSwapForChat.scheduledAt).toLocaleDateString()} at {new Date(selectedSwapForChat.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <Collaboration
                                        partnerId={Number(selectedSwapForChat.senderId) === Number(currentUser?.id) ? Number(selectedSwapForChat.receiverId) : Number(selectedSwapForChat.senderId)}
                                        partnerName={Number(selectedSwapForChat.senderId) === Number(currentUser?.id) ? selectedSwapForChat.receiver?.name : selectedSwapForChat.sender?.name}
                                        swapRequestId={selectedSwapForChat.id}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <MeetingInvitationModal
                isOpen={invitationModal.isOpen}
                senderName={invitationModal.senderName}
                senderAvatar={invitationModal.senderAvatar}
                swapDetails={invitationModal.swapDetails}
                onAccept={() => {
                    socket.emit('meeting-invite-accepted', {
                        senderId: invitationModal.senderId,
                        receiverId: currentUser?.id,
                        acceptorName: currentUser?.name,
                        swapDetails: invitationModal.swapDetails
                    });
                    setInvitationModal(prev => ({ ...prev, isOpen: false }));
                    const swap = allSwaps.find(s => s.id === invitationModal.swapDetails?.id);
                    if (swap) handleJoinMeeting(swap);
                }}
                onReject={() => {
                    socket.emit('meeting-invite-rejected', {
                        senderId: invitationModal.senderId,
                        receiverId: currentUser?.id,
                        reason: 'User declined'
                    });
                    setInvitationModal(prev => ({ ...prev, isOpen: false }));
                }}
            />
        </div>
    );
}

function SwapCard({ swap, isSent, onAccept, onReject, onReschedule, onComplete, onRate, onInviteToMeeting, onRequestMoreInfo, onViewProfile, onStartWork, onOpenChat, onViewContract }: any) {
    const dispatch = useDispatch<AppDispatch>();
    const partner = isSent ? swap.receiver : swap.sender;
    const [isSlotsOpen, setIsSlotsOpen] = useState(false);
    const { activeSession, reports } = useSelector((state: RootState) => state.collaboration);
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const timeLeft = useCountdown(swap.scheduledAt);
    const [isReportsOpen, setIsReportsOpen] = useState(false);
    const [isSubmitProgressOpen, setIsSubmitProgressOpen] = useState(false);

    useEffect(() => {
        const handleNewReport = (report: any) => {
            if (report.swapRequestId === swap.id) {
                dispatch(fetchReports(swap.id));
            }
        };

        const handleSessionStart = (data: any) => {
            if (data.swapRequestId === swap.id) {
                console.log("Partner started work:", data.senderName);
                // Optionally dispatch fetchWorkSessions to update local state
                dispatch(fetchWorkSessions(swap.id));
            }
        };

        const handleSessionStop = (data: any) => {
            if (data.swapRequestId === swap.id) {
                console.log("Partner stopped work:", data.senderName);
                dispatch(fetchWorkSessions(swap.id));
            }
        };

        const handleNewAttachment = (data: any) => {
            if (data.swapRequestId === swap.id) {
                // Refresh swaps to get the new attachment
                if (isSent) dispatch(fetchSentSwaps());
                else dispatch(fetchReceivedSwaps());
            }
        };



        socket.on('new_report', handleNewReport);
        socket.on('session_started', handleSessionStart);
        socket.on('session_stopped', handleSessionStop);
        socket.on('new_attachment', handleNewAttachment);


        return () => {
            socket.off('new_report', handleNewReport);
            socket.off('session_started', handleSessionStart);
            socket.off('session_stopped', handleSessionStop);
            socket.off('new_attachment', handleNewAttachment);

        };
    }, [swap.id, dispatch]);

    // Correction: I should update SwapCard to accept `onStartWork` or I can access the parent state if I lift the card up? No.
    // I will assume I can update the SwapCard usage in `getTabContent` as well?
    // I'll stick to the plan: I can't easily change the prop signature everywhere without updating everywhere.
    // BUT! `SwapCard` is defined in the same file. So I can update `SwapCard` definition and usages in one go.

    // Let's defer the SwapCard update to a separate call or do it carefully.
    // I'll stick to updating the PROPS usage logic *inside* SwapCard.

    const isCurrentActive = activeSession?.swapRequestId === swap.id;

    const handleStartWork = () => {
        onStartWork?.(swap.id);
        const partnerId = isSent ? swap.receiverId : swap.senderId;
        socket.emit("start_work", {
            swapRequestId: swap.id,
            receiverId: partnerId,
            senderName: currentUser?.name
        });
    };

    const handleEndWork = () => {
        if (activeSession) {
            dispatch(endWorkSession(activeSession.id));
            const partnerId = isSent ? swap.receiverId : swap.senderId;
            socket.emit("stop_work", {
                swapRequestId: swap.id,
                receiverId: partnerId,
                senderName: currentUser?.name
            });
        }
    };

    const handleReportSubmit = (data: { content: string, percentage: number, attachments: any[] }) => {
        dispatch(submitReport({
            swapRequestId: swap.id,
            type: 'DAILY',
            content: data.content,
            completionPercentage: data.percentage,
            attachments: data.attachments
        }));
    };

    const handleSwapAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            await axios.post(`https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/swaps/${swap.id}/attach`, response.data.data, {
                withCredentials: true
            });
            alert("File attached to agreement!");
        } catch (error) {
            console.error("Attachment failed", error);
        }
    };

    const swapFileInputRef = useRef<HTMLInputElement>(null);

    const getGoogleCalendarLink = () => {
        if (!swap.scheduledAt) return '#';
        const start = new Date(swap.scheduledAt).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(new Date(swap.scheduledAt).getTime() + (swap.duration || 60) * 60000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const title = encodeURIComponent(`Skill Swap: ${swap.offeredSkill} for ${swap.requestedSkill}`);
        const details = encodeURIComponent(`Meeting with ${partner?.name}. Join at: ${window.location.origin}/swaps`);
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&sf=true&output=xml`;
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-6">
                <div
                    className="flex-shrink-0 cursor-pointer group"
                    onClick={() => onViewProfile?.(partner.id)}
                >
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-700 text-2xl font-black relative overflow-hidden border border-neutral-200/50">
                        {partner?.profile?.avatarUrl ? (
                            <img src={partner.profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl group-hover:scale-110 transition-transform" />
                        ) : (
                            partner?.name?.charAt(0) || <User className="w-6 h-6 text-neutral-400" />
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3
                                className="text-xl font-bold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors"
                                onClick={() => onViewProfile?.(partner.id)}
                            >{partner?.name}</h3>
                            <p className="text-sm font-medium text-neutral-500 flex items-center mt-1">
                                <RefreshCw className="w-3 h-3 mr-1 text-primary-500" />
                                {swap.offeredSkill} <span className="mx-2 text-neutral-300">→</span> {swap.requestedSkill}
                            </p>
                        </div>
                        <StatusBadge status={swap.status} />
                    </div>

                    {swap.status === 'ACCEPTED' && timeLeft && (
                        <div className="mt-2 flex items-center text-xs font-bold text-primary-600 bg-primary-50 w-fit px-2 py-1 rounded-full border border-primary-100 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            Starts in: {timeLeft}
                        </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
                        {swap.status === 'ACCEPTED' || swap.status === 'COMPLETED' ? (
                            <div className="flex items-center bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                                <CalendarIcon className="w-4 h-4 mr-2 text-primary-500" />
                                {new Date(swap.scheduledAt).toLocaleDateString()} at {new Date(swap.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        ) : swap.preferredTimeSlots?.length > 0 && (
                            <div className="w-full">
                                <button
                                    onClick={() => setIsSlotsOpen(!isSlotsOpen)}
                                    className="flex items-center text-primary-600 font-bold hover:underline"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    {swap.preferredTimeSlots.length} Suggested Times
                                    <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${isSlotsOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {isSlotsOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
                                        >
                                            {swap.preferredTimeSlots.map((slot: string, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between bg-primary-50/50 p-2 rounded-lg text-xs">
                                                    <span>{slot}</span>
                                                    {!isSent && swap.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => onAccept?.(swap.id, slot)}
                                                            className="bg-primary-600 text-white px-2 py-1 rounded font-bold"
                                                        >
                                                            Pick Slot
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {swap.status === 'RESCHEDULED' && (
                        <div className="w-full mt-3 bg-orange-50 border border-orange-100 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-neutral-900 text-sm">Reschedule Proposed</h4>
                                    <p className="text-xs text-neutral-600 mt-1">
                                        Proposed time: <span className="font-bold text-neutral-800">
                                            {(() => {
                                                const slot = typeof swap.proposedTimeSlot === 'object' && swap.proposedTimeSlot?.slot
                                                    ? swap.proposedTimeSlot.slot
                                                    : swap.proposedTimeSlot;
                                                return slot ? new Date(slot).toLocaleString() : 'N/A';
                                            })()}
                                        </span>
                                    </p>
                                    {swap.message && (
                                        <p className="text-xs text-neutral-500 italic mt-1">"{swap.message}"</p>
                                    )}
                                    {swap.meetingAgenda && (
                                        <p className="text-xs text-neutral-600 mt-1"><span className="font-bold">Agenda:</span> {swap.meetingAgenda}</p>
                                    )}

                                    {/* Show actions only if current user is NOT the initiator */}
                                    {(() => {
                                        const slotData = typeof swap.proposedTimeSlot === 'object' ? swap.proposedTimeSlot : null;
                                        const initiatorId = slotData?.initiatorId ? Number(slotData.initiatorId) : null;
                                        const currentUserId = Number(currentUser?.id);
                                        const isInitiator = initiatorId === currentUserId;

                                        // Debug info (can be removed later)
                                        // console.log('Reschedule Debug:', { initiatorId, currentUserId, isInitiator });

                                        if (initiatorId && !isInitiator) {
                                            return (
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => onAccept?.(swap.id, slotData?.slot || swap.proposedTimeSlot)}
                                                        className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors"
                                                    >
                                                        Accept New Time
                                                    </button>
                                                    <button
                                                        onClick={() => onReject?.(swap.id)}
                                                        className="px-3 py-1.5 bg-white border border-neutral-200 text-neutral-600 text-xs font-bold rounded-lg hover:bg-neutral-50 transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            );
                                        } else if (isInitiator) {
                                            return (
                                                <div className="mt-2 text-xs text-orange-600 font-medium flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Waiting for partner response...
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Display Swap Attachments */}
                    {swap.attachments && swap.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                            <h4 className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Attachments</h4>
                            <div className="flex flex-wrap gap-2">
                                {swap.attachments.map((att: any) => (
                                    <a
                                        key={att.id}
                                        href={att.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-xs bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors text-neutral-700"
                                    >
                                        <Paperclip className="w-3.5 h-3.5 mr-2 text-primary-500" />
                                        <span className="truncate max-w-[150px]">{att.fileName}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {swap.message && (
                        <div className="mt-4 p-3 bg-neutral-50/50 rounded-xl border-l-4 border-primary-200">
                            <p className="text-neutral-600 italic text-sm">"{swap.message}"</p>
                        </div>
                    )}

                    {swap.status === 'ACCEPTED' && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => onOpenChat?.(swap)}
                                    className="flex items-center text-xs text-neutral-600 hover:text-primary-600"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                    Collab Chat
                                </button>
                                <button
                                    onClick={() => setIsSubmitProgressOpen(true)}
                                    className="flex items-center text-xs text-neutral-600 hover:text-primary-600"
                                >
                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                    Submit Progress
                                </button>
                                <button
                                    onClick={() => {
                                        if (!isReportsOpen) {
                                            dispatch(fetchReports(swap.id));
                                        }
                                        setIsReportsOpen(!isReportsOpen);
                                    }}
                                    className="flex items-center text-xs text-neutral-600 hover:text-primary-600"
                                >
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    Work History
                                </button>
                                <input
                                    type="file"
                                    ref={swapFileInputRef}
                                    onChange={handleSwapAttachment}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => swapFileInputRef.current?.click()}
                                    className="flex items-center text-xs text-neutral-600 hover:text-primary-600"
                                >
                                    <Paperclip className="w-3.5 h-3.5 mr-1" />
                                    Attach File
                                </button>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {isReportsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden"
                            >
                                <h4 className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Historical Sessions</h4>
                                <h4 className="text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Historical Sessions & Reports</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {reports.length === 0 ? (
                                        <div className="text-[10px] text-neutral-400 text-center py-4">
                                            No history recorded yet.
                                        </div>
                                    ) : (
                                        reports.map((report: any) => (
                                            <div key={report.id} className="bg-white p-3 rounded-lg border border-neutral-100 shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-neutral-700">
                                                        {report.type === 'DAILY' ? 'Daily Update' : 'Weekly Report'}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">
                                                        {new Date(report.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-600 mb-2">{report.content}</p>

                                                {report.completionPercentage > 0 && (
                                                    <div className="w-full bg-neutral-100 rounded-full h-1.5 mb-2">
                                                        <div
                                                            className="bg-success-500 h-1.5 rounded-full"
                                                            style={{ width: `${report.completionPercentage}%` }}
                                                        />
                                                    </div>
                                                )}

                                                {report.attachments && report.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {(report.attachments as any[]).map((att: any, idx: number) => (
                                                            <a
                                                                key={idx}
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center text-[10px] bg-neutral-50 px-2 py-1 rounded border border-neutral-200 hover:bg-neutral-100"
                                                            >
                                                                <FileText className="w-3 h-3 mr-1 text-neutral-400" />
                                                                {att.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <SubmitProgressModal
                        isOpen={isSubmitProgressOpen}
                        onClose={() => setIsSubmitProgressOpen(false)}
                        onSubmit={handleReportSubmit}
                    />
                </div>

                <div className="flex flex-col gap-2 min-w-[140px] justify-center">
                    <button
                        onClick={() => onViewContract?.(swap)}
                        className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl font-semibold transition-all text-xs flex items-center justify-center mb-1"
                    >
                        <FileSignature className="w-4 h-4 mr-2 text-neutral-500" />
                        View Agreement
                    </button>
                    {(swap.status === 'PENDING' || swap.status === 'MORE_INFO_REQUESTED') && !isSent && (
                        <>
                            <button onClick={() => onAccept?.(swap.id, swap.preferredTimeSlots?.[0])} className="w-full py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all text-xs">Quick Accept</button>
                            <button
                                onClick={() => onRequestMoreInfo?.(swap.id)}
                                className="w-full py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 flex items-center justify-center transition-colors text-xs"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Ask Details
                            </button>
                            <button onClick={() => onReschedule?.(swap.id)} className="w-full py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 transition-colors text-xs">Reschedule</button>
                            <button onClick={() => onReject?.(swap.id)} className="w-full py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors text-xs">Reject</button>
                        </>
                    )}
                    {swap.status === 'ACCEPTED' && (
                        <>
                            {isCurrentActive ? (
                                <button
                                    onClick={handleEndWork}
                                    className="w-full py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center justify-center mb-2 text-xs"
                                >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Stop Work
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartWork}
                                    className="w-full py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center justify-center mb-2 text-xs"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Work
                                </button>
                            )}
                            <button
                                onClick={() => onInviteToMeeting?.(swap)}
                                className="w-full py-2 bg-primary-50 text-primary-700 rounded-xl font-semibold hover:bg-primary-100 transition-all flex items-center justify-center mb-2 text-xs"
                            >
                                <Video className="w-4 h-4 mr-2" />
                                Invite to Meeting
                            </button>
                            <button
                                onClick={() => window.open(getGoogleCalendarLink(), '_blank')}
                                className="w-full py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-50 flex items-center justify-center mb-2 transition-all text-xs"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Add to Calendar
                            </button>
                            <button onClick={() => onComplete?.(swap.id)} className="w-full py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all text-xs">Mark Completed</button>
                        </>
                    )}
                    {swap.status === 'COMPLETED' && !swap.rating && (
                        <button onClick={() => onRate?.(swap)} className="w-full py-2 bg-white border border-amber-200 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 flex items-center justify-center text-xs">
                            <Star className="w-4 h-4 mr-2" />
                            Rate Partner
                        </button>
                    )}
                </div>
            </div>
        </div >
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: any = {
        PENDING: 'bg-warning-100 text-warning-700',
        ACCEPTED: 'bg-success-100 text-success-700',
        REJECTED: 'bg-error-100 text-error-700',
        COMPLETED: 'bg-primary-100 text-primary-700',
        RESCHEDULED: 'bg-accent-100 text-accent-700',
        MORE_INFO_REQUESTED: 'bg-orange-100 text-orange-700',
    };
    return (
        <span className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider ${colors[status] || 'bg-neutral-100'}`}>
            {status}
        </span>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-200">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="text-neutral-400 font-medium">{message}</p>
        </div>
    );
}
