import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { socket } from '../services/socket';
import axios from 'axios';
import {
    Calendar as CalendarIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    Star,
    Video,
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
import { API_BASE } from '../config';
import { toast } from '../lib/toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

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
    const [activeTab, setActiveTab] = useState<'calendar' | 'pending' | 'active' | 'history' | 'disputes'>('pending');
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
    const myId = Number(currentUser?.id);
    const isOpen = (s: any) => ['PENDING', 'RESCHEDULED', 'MORE_INFO_REQUESTED'].includes(s.status);
    const pendingSwaps = allSwaps.filter(isOpen);
    const needsMe = (s: any) => {
        const iSent = Number(s.senderId) === myId;
        if (s.status === 'RESCHEDULED') {
            const initiator = typeof s.proposedTimeSlot === 'object' ? Number(s.proposedTimeSlot?.initiatorId) : NaN;
            return initiator !== myId;
        }
        if (s.status === 'MORE_INFO_REQUESTED') return iSent; // they asked me a question
        return !iSent; // a new request sent to me
    };
    const needsMyReply = pendingSwaps.filter(needsMe);
    const waitingOnThem = pendingSwaps.filter((s: any) => !needsMe(s));
    const activeCount = allSwaps.filter((s: any) => s.status === 'ACCEPTED').length;

    const handleAccept = (id: number, slot: string) => {
        dispatch(respondToSwap({
            id,
            status: 'ACCEPTED',
            scheduledAt: slot
        }));
    };

    const [dialog, setDialog] = useState<null | { kind: 'reject' | 'info' | 'complete'; id: number }>(null);

    const handleReject = (id: number) => setDialog({ kind: 'reject', id });

    const handleComplete = (id: number) => setDialog({ kind: 'complete', id });

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

    const handleRequestMoreInfo = (id: number) => setDialog({ kind: 'info', id });

    const openMessages = (partner: any) =>
        navigate('/messages', { state: { startChatWith: { id: partner?.id, name: partner?.name, avatarUrl: partner?.profile?.avatarUrl } } });

    const dialogConfig = dialog && {
        reject: {
            title: 'Decline this request?',
            description: "They'll be told you declined. Adding a reason is optional but helps them.",
            inputLabel: 'Reason (optional)',
            confirmLabel: 'Decline request',
            tone: 'danger' as const,
            run: (text: string) => dispatch(respondToSwap({ id: dialog.id, status: 'REJECTED', rejectionReason: text || undefined })),
        },
        info: {
            title: 'Ask a question',
            description: 'Your question is sent to them. The request stays open until you accept or decline it.',
            inputLabel: 'Your question',
            inputRequired: true,
            confirmLabel: 'Send question',
            tone: 'primary' as const,
            run: (text: string) => dispatch(requestMoreInfo({ id: dialog.id, message: text })),
        },
        complete: {
            title: 'Mark this swap as complete?',
            description: 'Do this once all the sessions you agreed on are done. You will then be able to rate each other.',
            confirmLabel: 'Mark complete',
            tone: 'primary' as const,
            run: () => dispatch(completeSwap(dialog.id)),
        },
    }[dialog.kind];

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
        toast.success(`Meeting invitation sent to ${partner.name}.`);
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
            toast.info(`${data.acceptorName || 'Your partner'} declined the meeting invitation.`);
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
            case 'pending': {
                const renderCard = (swap: any) => (
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
                        onOpenMessages={openMessages}
                        onViewContract={(s: any) => {
                            setSelectedSwapForContract(s);
                            setIsContractModalOpen(true);
                        }}
                    />
                );
                if (pendingSwaps.length === 0) {
                    return (
                        <EmptyState
                            message="No open requests"
                            hint="When you send a swap request, or someone sends you one, it appears here."
                            actionLabel="Find someone to swap with"
                            onAction={() => navigate('/marketplace')}
                        />
                    );
                }
                return (
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-sm font-semibold text-neutral-900">Waiting for your reply <span className="font-normal text-neutral-500">({needsMyReply.length})</span></h2>
                            <div className="mt-3 space-y-4">
                                {needsMyReply.length > 0 ? needsMyReply.map(renderCard) : <p className="text-sm text-neutral-500">Nothing needs your reply right now.</p>}
                            </div>
                        </section>
                        <section>
                            <h2 className="text-sm font-semibold text-neutral-900">Waiting for the other person <span className="font-normal text-neutral-500">({waitingOnThem.length})</span></h2>
                            <div className="mt-3 space-y-4">
                                {waitingOnThem.length > 0 ? waitingOnThem.map(renderCard) : <p className="text-sm text-neutral-500">You have no requests waiting on someone else.</p>}
                            </div>
                        </section>
                    </div>
                );
            }
            case 'active':
                const active = allSwaps.filter((s: any) => s.status === 'ACCEPTED');
                return (
                    <div className="space-y-4">
                        {active.length === 0 && <EmptyState message="Nothing in progress" hint="Swaps move here once both of you agree on a time." actionLabel={needsMyReply.length ? 'See requests waiting for you' : undefined} onAction={() => setActiveTab('pending')} />}
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
                        {history.length === 0 && <EmptyState message="No finished swaps yet" hint="When you mark a swap complete it moves here, and you can rate your partner." />}
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
                        {myDisputes.length === 0 && <EmptyState message="No disputes" hint="If a swap goes wrong after you agreed to it, you can open a dispute from the agreement. An administrator will review it." />}
                        {myDisputes.map((dispute: any) => {
                            const isFiler = Number(dispute.filedById) === Number(currentUser?.id);
                            const opponent = isFiler ? dispute.against : dispute.filedBy;

                            return (
                                <div key={dispute.id} className="bg-white rounded-xl p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2.5 h-full bg-error-500"></div>
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider ${
                                                    dispute.status === 'RESOLVED' ? 'bg-success-100 text-success-800' :
                                                    dispute.status === 'ESCALATED' ? 'bg-error-100 text-error-800' :
                                                    dispute.status === 'DISMISSED' ? 'bg-neutral-100 text-neutral-800' :
                                                    'bg-warning-100 text-warning-800'
                                                }`}>
                                                    {dispute.status}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg tracking-wider ${
                                                    dispute.priority === 'CRITICAL' ? 'bg-error-200 text-error-900' :
                                                    dispute.priority === 'HIGH' ? 'bg-warning-100 text-warning-800' :
                                                    'bg-primary-100 text-primary-800'
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
                                                <div className="mt-4 p-4 bg-success-50/60 border border-success-200/60 rounded-xl space-y-2">
                                                    <div className="flex items-center gap-1.5 text-success-900 font-bold text-xs">
                                                        <CheckCircle2 className="w-4 h-4 text-success-600" />
                                                        Administrative Resolution History
                                                    </div>
                                                    {dispute.resolution && (
                                                        <p className="text-sm text-success-800">
                                                            <strong>Resolution decision:</strong> {dispute.resolution}
                                                        </p>
                                                    )}
                                                    {dispute.adminNotes && (
                                                        <p className="text-xs text-success-700 italic">
                                                            <strong>Admin notes:</strong> "{dispute.adminNotes}"
                                                        </p>
                                                    )}
                                                    {dispute.resolvedAt && (
                                                        <p className="text-[10px] text-success-600">
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
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
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
        <div className="pb-12">
            <div className="mx-auto max-w-4xl">
                <header className="mb-6 space-y-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-900">My swaps</h1>
                        <p className="mt-1 text-sm text-neutral-600">Reply to requests, run your sessions and see what you've finished.</p>
                    </div>

                    <Tabs
                        active={activeTab}
                        onChange={(value) => setActiveTab(value as typeof activeTab)}
                        items={['pending', 'active', 'history', 'calendar', 'disputes'].map((tab) => ({
                            value: tab,
                            label: ({ pending: needsMyReply.length ? `Requests (${needsMyReply.length})` : 'Requests', active: activeCount ? `In progress (${activeCount})` : 'In progress', history: 'Completed', calendar: 'Calendar', disputes: 'Disputes' } as Record<string, string>)[tab],
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

            {dialog && dialogConfig && (
                <ConfirmDialog
                    isOpen
                    title={dialogConfig.title}
                    description={dialogConfig.description}
                    confirmLabel={dialogConfig.confirmLabel}
                    tone={dialogConfig.tone}
                    inputLabel={'inputLabel' in dialogConfig ? dialogConfig.inputLabel : undefined}
                    inputRequired={'inputRequired' in dialogConfig ? dialogConfig.inputRequired : undefined}
                    onConfirm={(text) => dialogConfig.run(text)}
                    onClose={() => setDialog(null)}
                />
            )}

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
                            className="bg-white rounded-xl p-8 max-w-sm w-full shadow-lg"
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
                            className="bg-white rounded-xl w-full max-w-4xl shadow-lg overflow-hidden relative"
                        >
                            <button
                                onClick={() => setIsChatModalOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full z-10 transition-colors"
                            >
                                <CloseIcon className="w-6 h-6 text-neutral-400" />
                            </button>
                            <div className="flex flex-col md:flex-row h-[700px]">
                                <div className="md:w-1/3 p-8 bg-neutral-50 border-r border-neutral-100 hidden md:block">
                                    <h3 className="text-2xl font-bold text-neutral-900 mb-6">Agreement Details</h3>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
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
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
                                            <p className="text-[10px] font-bold text-success-600 uppercase tracking-widest mb-2">Skills Exchange</p>
                                            <p className="text-sm font-medium text-neutral-700">
                                                {selectedSwapForChat.offeredSkill} <span className="text-neutral-400 mx-1">for</span> {selectedSwapForChat.requestedSkill}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
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

function SwapCard({ swap, isSent, onAccept, onReject, onReschedule, onComplete, onRate, onInviteToMeeting, onRequestMoreInfo, onViewProfile, onStartWork, onOpenChat, onViewContract, onOpenMessages }: any) {
    const dispatch = useDispatch<AppDispatch>();
    const partner = isSent ? swap.receiver : swap.sender;
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
            const response = await axios.post(`${API_BASE}/files/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            await axios.post(`${API_BASE}/swaps/${swap.id}/attach`, response.data.data, {
                withCredentials: true
            });
            toast.success('File attached to the agreement.');
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

    const partnerName = partner?.name || 'Your partner';
    const firstName = partnerName.split(' ')[0];
    const scheduled = swap.scheduledAt ? new Date(swap.scheduledAt) : null;
    const scheduledText = scheduled
        ? `${scheduled.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} at ${scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';
    const canReply = !isSent && (swap.status === 'PENDING' || swap.status === 'MORE_INFO_REQUESTED');

    // One sentence telling the user where this swap stands and what to do next.
    const nextStep = (() => {
        switch (swap.status) {
            case 'PENDING':
                return isSent
                    ? `Waiting for ${firstName} to reply. You'll get a notification when they do.`
                    : `${firstName} wants to swap. Accept one of the suggested times, suggest another, or ask a question first.`;
            case 'MORE_INFO_REQUESTED':
                return isSent
                    ? `${firstName} asked for more details. Reply to them in Messages.`
                    : `You asked ${firstName} for more details. You can still accept or decline below.`;
            case 'RESCHEDULED':
                return 'A new time has been suggested. See the details below.';
            case 'ACCEPTED':
                return `Agreed for ${scheduledText || 'a time you both chose'}. At session time, start a video call and the timer, then log what you covered.`;
            case 'COMPLETED':
                return swap.rating ? 'Finished and rated. Nice work.' : `Finished. Rate ${firstName} so others know what to expect.`;
            case 'REJECTED':
                return 'This request was declined.';
            case 'CANCELLED':
                return 'This swap was cancelled.';
            default:
                return '';
        }
    })();

    const linkBtn = 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100';

    return (
        <article className="rounded-lg border border-neutral-200 bg-white p-5">
            {/* Who and what */}
            <div className="flex items-start justify-between gap-4">
                <button onClick={() => onViewProfile?.(partner?.id)} className="flex min-w-0 items-center gap-3 text-left">
                    {partner?.profile?.avatarUrl ? (
                        <img src={partner.profile.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                            {partnerName.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <span className="min-w-0">
                        <span className="block truncate font-medium text-neutral-900 hover:underline">{partnerName}</span>
                        <span className="block truncate text-sm text-neutral-600">
                            {isSent ? 'You teach' : 'They teach'} <span className="font-medium text-neutral-800">{swap.offeredSkill}</span>
                            {' · '}
                            {isSent ? 'you learn' : 'you teach'} <span className="font-medium text-neutral-800">{swap.requestedSkill}</span>
                        </span>
                    </span>
                </button>
                <StatusBadge status={swap.status} isSent={isSent} />
            </div>

            {nextStep && <p className="mt-3 text-sm text-neutral-600">{nextStep}</p>}

            {swap.status === 'ACCEPTED' && timeLeft && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                    <Clock className="h-3.5 w-3.5" /> Starts in {timeLeft}
                </p>
            )}

            {swap.message && swap.status !== 'RESCHEDULED' && (
                <blockquote className="mt-3 border-l-2 border-neutral-200 pl-3 text-sm text-neutral-600">“{swap.message}”</blockquote>
            )}

            {/* Suggested times are always visible for the person who has to choose. */}
            {(swap.status === 'PENDING' || swap.status === 'MORE_INFO_REQUESTED') && swap.preferredTimeSlots?.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-medium text-neutral-500">{isSent ? 'Times you suggested' : 'Suggested times'}</p>
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {swap.preferredTimeSlots.map((slot: string, idx: number) => (
                            <li key={idx} className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm">
                                <span className="text-neutral-800">{slot}</span>
                                {canReply && (
                                    <button onClick={() => onAccept?.(swap.id, slot)} className="shrink-0 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700">
                                        Accept this time
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {swap.status === 'RESCHEDULED' && (() => {
                const slotData = typeof swap.proposedTimeSlot === 'object' ? swap.proposedTimeSlot : null;
                const slot = slotData?.slot ?? swap.proposedTimeSlot;
                const initiatorId = slotData?.initiatorId ? Number(slotData.initiatorId) : null;
                const isInitiator = initiatorId === Number(currentUser?.id);
                return (
                    <div className="mt-4 rounded-md border border-warning-200 bg-warning-50 p-3 text-sm">
                        <p className="text-neutral-800">
                            New time suggested: <span className="font-medium">{slot ? new Date(slot).toLocaleString() : 'not set'}</span>
                        </p>
                        {swap.message && <p className="mt-1 text-neutral-600">“{swap.message}”</p>}
                        {swap.meetingAgenda && <p className="mt-1 text-neutral-600">Agenda: {swap.meetingAgenda}</p>}
                        {initiatorId && !isInitiator ? (
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => onAccept?.(swap.id, slot)} className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700">Accept new time</button>
                                <button onClick={() => onReject?.(swap.id)} className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Decline</button>
                            </div>
                        ) : isInitiator ? (
                            <p className="mt-2 text-xs text-neutral-600">Waiting for {firstName} to respond.</p>
                        ) : null}
                    </div>
                );
            })()}

            {swap.attachments?.length > 0 && (
                <div className="mt-4">
                    <p className="text-xs font-medium text-neutral-500">Shared files</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {swap.attachments.map((att: any) => (
                            <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50">
                                <Paperclip className="h-3.5 w-3.5" /><span className="max-w-[160px] truncate">{att.fileName}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* ---------- Actions ---------- */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
                {canReply && (
                    <>
                        <button onClick={() => onReschedule?.(swap.id)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Suggest another time</button>
                        {swap.status === 'PENDING' && (
                            <button onClick={() => onRequestMoreInfo?.(swap.id)} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Ask a question</button>
                        )}
                        <button onClick={() => onReject?.(swap.id)} className="rounded-md px-3 py-1.5 text-sm font-medium text-error-700 hover:bg-error-50">Decline</button>
                    </>
                )}

                {isSent && swap.status === 'MORE_INFO_REQUESTED' && (
                    <button onClick={() => onOpenMessages?.(partner)} className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">Reply in Messages</button>
                )}

                {swap.status === 'ACCEPTED' && (
                    <>
                        <button onClick={() => onInviteToMeeting?.(swap)} className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
                            <Video className="h-4 w-4" /> Start video call
                        </button>
                        {isCurrentActive ? (
                            <button onClick={handleEndWork} className="inline-flex items-center gap-1.5 rounded-md border border-error-300 px-3 py-1.5 text-sm font-medium text-error-700 hover:bg-error-50">
                                <Pause className="h-4 w-4" /> Stop session timer
                            </button>
                        ) : (
                            <button onClick={handleStartWork} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                                <Play className="h-4 w-4" /> Start session timer
                            </button>
                        )}
                        <button onClick={() => setIsSubmitProgressOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                            <FileText className="h-4 w-4" /> Log progress
                        </button>
                    </>
                )}

                {swap.status === 'COMPLETED' && !swap.rating && (
                    <button onClick={() => onRate?.(swap)} className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
                        <Star className="h-4 w-4" /> Rate {firstName}
                    </button>
                )}

                {/* Secondary tools, always in the same place */}
                <div className="ml-auto flex flex-wrap items-center gap-1">
                    {swap.status === 'ACCEPTED' && (
                        <>
                            <button onClick={() => onOpenChat?.(swap)} className={linkBtn}><MessageSquare className="h-4 w-4" /> Chat</button>
                            <button
                                onClick={() => { if (!isReportsOpen) dispatch(fetchReports(swap.id)); setIsReportsOpen(!isReportsOpen); }}
                                className={linkBtn}
                                aria-expanded={isReportsOpen}
                            >
                                <Clock className="h-4 w-4" /> History
                            </button>
                            <input type="file" ref={swapFileInputRef} onChange={handleSwapAttachment} className="hidden" />
                            <button onClick={() => swapFileInputRef.current?.click()} className={linkBtn}><Paperclip className="h-4 w-4" /> Attach</button>
                            {scheduled && (
                                <a href={getGoogleCalendarLink()} target="_blank" rel="noreferrer" className={linkBtn}><Calendar className="h-4 w-4" /> Add to calendar</a>
                            )}
                        </>
                    )}
                    <button onClick={() => onViewContract?.(swap)} className={linkBtn}><FileSignature className="h-4 w-4" /> Agreement</button>
                    {swap.status === 'ACCEPTED' && (
                        <button onClick={() => onComplete?.(swap.id)} className={`${linkBtn} text-success-700`}><CheckCircle2 className="h-4 w-4" /> Mark complete</button>
                    )}
                </div>
            </div>

            {isReportsOpen && (
                <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
                    <h4 className="text-sm font-medium text-neutral-900">Progress history</h4>
                    <div className="mt-3 max-h-60 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                        {reports.length === 0 ? (
                            <p className="text-sm text-neutral-500">Nothing logged yet. Use “Log progress” after a session.</p>
                        ) : (
                            reports.map((report: any) => (
                                <div key={report.id} className="rounded-md border border-neutral-200 bg-white p-3">
                                    <div className="flex items-center justify-between text-xs text-neutral-500">
                                        <span className="font-medium text-neutral-700">{report.type === 'DAILY' ? 'Daily update' : 'Weekly report'}</span>
                                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-neutral-700">{report.content}</p>
                                    {report.completionPercentage > 0 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-1.5 flex-1 rounded-full bg-neutral-100">
                                                <div className="h-1.5 rounded-full bg-success-500" style={{ width: `${report.completionPercentage}%` }} />
                                            </div>
                                            <span className="text-xs text-neutral-500">{report.completionPercentage}%</span>
                                        </div>
                                    )}
                                    {report.attachments?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {(report.attachments as any[]).map((att: any, idx: number) => (
                                                <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50">
                                                    <FileText className="h-3 w-3" />{att.name}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <SubmitProgressModal
                isOpen={isSubmitProgressOpen}
                onClose={() => setIsSubmitProgressOpen(false)}
                onSubmit={handleReportSubmit}
            />
        </article>
    );
}

const statusLabels: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Waiting for reply', className: 'bg-warning-50 text-warning-700' },
    MORE_INFO_REQUESTED: { label: 'Question asked', className: 'bg-warning-50 text-warning-700' },
    RESCHEDULED: { label: 'New time suggested', className: 'bg-warning-50 text-warning-700' },
    ACCEPTED: { label: 'In progress', className: 'bg-primary-50 text-primary-700' },
    COMPLETED: { label: 'Completed', className: 'bg-success-50 text-success-700' },
    REJECTED: { label: 'Declined', className: 'bg-neutral-100 text-neutral-600' },
    CANCELLED: { label: 'Cancelled', className: 'bg-neutral-100 text-neutral-600' },
};

function StatusBadge({ status, isSent }: { status: string; isSent?: boolean }) {
    const entry = statusLabels[status] ?? { label: status.toLowerCase().replace(/_/g, ' '), className: 'bg-neutral-100 text-neutral-600' };
    const label = status === 'PENDING' && !isSent ? 'Needs your reply' : entry.label;
    return <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${entry.className}`}>{label}</span>;
}

function EmptyState({ message, hint, actionLabel, onAction }: { message: string; hint?: string; actionLabel?: string; onAction?: () => void }) {
    return (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
            <p className="font-medium text-neutral-900">{message}</p>
            {hint && <p className="mx-auto mt-1 max-w-md text-sm text-neutral-600">{hint}</p>}
            {actionLabel && onAction && (
                <button onClick={onAction} className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
