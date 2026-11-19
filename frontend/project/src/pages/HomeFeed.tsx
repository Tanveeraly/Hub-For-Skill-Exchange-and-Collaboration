import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Heart, MessageCircle, Image, Calendar, Bookmark, X, ArrowRightLeft, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import NotificationToast, { Toast } from '../components/NotificationToast';
import SwapRequestModal from '../components/SwapRequestModal';
import CommentsModal from '../components/CommentsModal';
import { fetchPosts, createPost, likePost, unlikePost } from '../store/slices/postsSlice';
import { toggleBookmark, fetchBookmarks } from '../store/slices/bookmarksSlice';
import { fetchPendingRequests, fetchConnections, fetchSentRequests } from '../store/slices/connectionSlice';
import { fetchReceivedSwaps, fetchSentSwaps } from '../store/slices/swapsSlice';
import { submitComplaint } from '../store/slices/adminSlice';
import { API_BASE } from '../config';

interface Post {
    id: string;
    userId: number;
    userName: string;
    userAvatar?: string;
    skillOffered: string;
    skillWanted: string;
    description: string;
    timestamp: string;
    likes: number;
    comments: number;
    isLiked: boolean;
    isSaved: boolean;
    mediaUrl?: string;
    isSkillMatch?: boolean;
    matchedUserName?: string;
    sharedSkills?: string[];
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    isVerified: boolean;
    profile: {
        bio: string;
        avatarUrl: string;
        location: string;
    } | null;
    skills: Array<{
        id: number;
        skillName: string;
        expertiseLevel: string;
    }>;
}

type FilterType = 'all' | 'matches';
type SortType = 'recent' | 'popular' | 'trending';

export default function HomeFeed() {
    const dispatch = useDispatch<AppDispatch>();
    const { items: posts } = useSelector((state: RootState) => state.posts);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { pendingRequests } = useSelector((state: RootState) => state.connections);
    const { received: receivedSwaps, sent: sentSwaps } = useSelector((state: RootState) => state.swaps);
    const [localPosts, setPosts] = useState<Post[]>([]);
    const [postContent, setPostContent] = useState({
        skillOffered: '',
        skillWanted: '',
        description: ''
    });
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [sort, setSort] = useState<SortType>('recent');
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState({ subject: '', description: '' });
    const [postVisibility, setPostVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addToast = (type: 'success' | 'error' | 'info', message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            dispatch(fetchPosts());
            dispatch(fetchPendingRequests());
            dispatch(fetchConnections());
            dispatch(fetchSentRequests());
            dispatch(fetchReceivedSwaps());
            dispatch(fetchSentSwaps());
            fetchUserProfile(); // Fetch full profile for sidebar
        }
    }, [dispatch, isAuthenticated, user]);

    useEffect(() => {
        if (!posts) return;
        const mappedPosts = posts.map((p: any) => {
            // Regular post parsing
            const cleanTitle = p.title || '';

            return {
                id: p.id.toString(),
                userId: p.user?.id || 0,
                userName: p.user?.name || 'Unknown',
                userAvatar: p.user?.profile?.avatarUrl,
                skillOffered: cleanTitle.includes('<->') ? cleanTitle.split('<->')[0].trim() : (cleanTitle.includes(' for ') ? cleanTitle.split(' for ')[0].trim() : cleanTitle),
                skillWanted: cleanTitle.includes('<->') ? cleanTitle.split('<->')[1].trim() : (cleanTitle.includes(' for ') ? cleanTitle.split(' for ')[1].trim() : 'Any'),
                description: p.description || '',
                timestamp: new Date(p.createdAt || Date.now()).toLocaleDateString(),
                likes: p._count?.likes || 0,
                comments: p._count?.comments || 0,
                isLiked: p.isLiked || false,
                isSaved: false,
                mediaUrl: p.mediaUrl,
            };
        });
        setPosts(mappedPosts);
    }, [posts]);

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/getme`, {
                withCredentials: true
            });
            if (res.data.data) {
                setUserProfile(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    // fetchPosts removed as it's now handled by Redux thunk dispatch

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file type
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                addToast('error', 'Please select an image or video file');
                return;
            }
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                addToast('error', 'File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCreatePost = () => {
        if (!postContent.skillOffered.trim() || !postContent.skillWanted.trim()) {
            addToast('error', 'Fill in what you can teach and what you want to learn.');
            return;
        }

        dispatch(createPost({
            title: `${postContent.skillOffered} <-> ${postContent.skillWanted}`,
            description: postContent.description,
            isFeatured: false,
            file: selectedFile,
            visibility: postVisibility,
        })).unwrap().then(() => {
            setPostContent({ skillOffered: '', skillWanted: '', description: '' });
            setPostVisibility('PUBLIC');
            handleRemoveFile();
            setShowCreatePost(false);
            addToast('success', 'Posted. It now appears in the feed and in Find skills.');
        }).catch(() => addToast('error', 'Your post could not be published. Please try again.'));
    };

    const handleLike = async (postId: string) => {
        const post = localPosts.find(p => p.id === postId);
        if (!post) return;

        try {
            if (post.isLiked) {
                await dispatch(unlikePost(parseInt(postId)));
            } else {
                await dispatch(likePost(parseInt(postId)));
            }
        } catch (error) {
            addToast('error', 'Failed to update like');
        }
    };

    const handleSave = async (postId: string) => {
        try {
            const res = await dispatch(toggleBookmark(parseInt(postId))).unwrap();
            addToast('success', res.bookmarked ? 'Saved.' : 'Removed from saved.');
            dispatch(fetchBookmarks());
        } catch {
            addToast('error', 'Could not update your saved posts. Please try again.');
        }
    };

    const handleSwapClick = (post: Post) => {
        setSelectedPost(post);
        setShowSwapModal(true);
    };

    const handleCommentClick = (post: Post) => {
        setActiveCommentPostId(post.id);
        setShowCommentsModal(true);
    };

    const handleSwapSubmit = () => {
        addToast('success', `Swap request sent to ${selectedPost?.userName}. Follow it in My swaps.`);
    };

    const handleReportSubmit = async () => {
        if (!selectedPost) return;
        if (!reportData.subject || !reportData.description) {
            addToast('error', 'Please fill in all report fields');
            return;
        }

        try {
            await dispatch(submitComplaint({
                subject: reportData.subject,
                description: reportData.description,
                targetId: selectedPost.userId,
                postId: parseInt(selectedPost.id)
            })).unwrap();
            
            addToast('success', 'Report submitted successfully');
            setShowReportModal(false);
            setReportData({ subject: '', description: '' });
        } catch (error: any) {
            addToast('error', error || 'Failed to submit report');
        }
    };

    const getAvatarInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    const bookmarkItems = useSelector((state: RootState) => state.bookmarks.items) as any[];
    const bookmarkedIds = new Set<number>(bookmarkItems.map((b: any) => Number(b.skillId)));
    useEffect(() => {
        if (isAuthenticated) dispatch(fetchBookmarks());
    }, [isAuthenticated, dispatch]);

    const allSwaps = [...receivedSwaps, ...sentSwaps];
    const activeSwaps = allSwaps.filter((swap: any) => swap.status === 'ACCEPTED');
    const myId = Number(user?.id || userProfile?.id);
    const pendingSwapApprovals = allSwaps.filter((swap: any) => {
        const iSent = Number(swap.senderId) === myId;
        if (swap.status === 'PENDING') return !iSent;
        if (swap.status === 'MORE_INFO_REQUESTED') return iSent;
        if (swap.status === 'RESCHEDULED') {
            const initiator = typeof swap.proposedTimeSlot === 'object' ? Number(swap.proposedTimeSlot?.initiatorId) : NaN;
            return initiator !== myId;
        }
        return false;
    });
    const completedSwaps = allSwaps.filter((swap: any) => swap.status === 'COMPLETED');

    const getProfileCompleteness = () => {
        const profileFields = [
            userProfile?.name,
            userProfile?.email,
            userProfile?.profile?.avatarUrl,
            userProfile?.profile?.bio,
            userProfile?.profile?.location,
        ];

        const completed = profileFields.filter(Boolean).length;
        return Math.round((completed / profileFields.length) * 100);
    };

    const getSwapPartner = (swap: any) => {
        const currentUserId = user?.id || userProfile?.id;
        if (!currentUserId) return swap.sender || swap.receiver || { name: 'Skill Partner' };
        return swap.senderId === currentUserId ? (swap.receiver || { name: 'Skill Partner' }) : (swap.sender || { name: 'Skill Partner' });
    };

    const formatSwapTime = (dateString?: string) => {
        if (!dateString) return 'Time to be confirmed';

        try {
            const date = new Date(dateString);
            return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch {
            return 'Time to be confirmed';
        }
    };

    // "Good matches" = posts from people who want to learn something I teach.
    const myTeachSkills: string[] = (userProfile?.skills ?? user?.skills ?? []).map((s: any) => String(s.skillName || '').toLowerCase()).filter(Boolean);
    const filteredPosts = localPosts.filter((post) => {
        if (filter === 'all') return true;
        const wanted = String(post.skillWanted || '').toLowerCase();
        return !!wanted && myTeachSkills.some((mine) => wanted.includes(mine) || mine.includes(wanted));
    });

    const sortedPosts = [...filteredPosts].sort((a, b) => {
        if (sort === 'popular') return b.likes - a.likes;
        if (sort === 'trending') return (b.likes + b.comments) - (a.likes + a.comments);
        return 0; // recent - already in order
    });

    const homeStats = [
        {
            label: 'Active Swaps',
            value: String(activeSwaps.length),
            detail: activeSwaps.length ? 'In progress now' : 'No active swaps yet',
            tone: 'bg-[#EAF3FF] text-[#0A66C2]'
        },
        {
            label: 'Waiting for you',
            value: String(pendingRequests.length + pendingSwapApprovals.length),
            detail: pendingRequests.length || pendingSwapApprovals.length ? `${pendingRequests.length} connection + ${pendingSwapApprovals.length} swap actions` : 'Nothing waiting for review',
            tone: 'bg-[#EAFBF0] text-[#15803D]'
        },
        {
            label: 'Completed',
            value: String(completedSwaps.length),
            detail: completedSwaps.length ? `${completedSwaps.length} completed exchanges` : 'No completed swaps yet',
            tone: 'bg-[#F3E8FF] text-[#7C3AED]'
        },
        {
            label: 'Profile Strength',
            value: `${getProfileCompleteness()}%`,
            detail: userProfile?.isVerified ? 'Verified profile' : 'Complete your profile',
            tone: 'bg-[#FEF3C7] text-[#B45309]'
        }
    ];

    const upcomingSessions = activeSwaps
        .filter((swap: any) => swap.scheduledAt)
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 2)
        .map((swap: any) => {
            const partner = getSwapPartner(swap);
            return {
                name: partner?.name || 'Skill Partner',
                skill: swap.skill?.title || swap.offeredSkill || swap.requestedSkill || 'Skill exchange',
                time: formatSwapTime(swap.scheduledAt),
                status: 'CONFIRMED',
                initials: (partner?.name || 'SP').split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2)
            };
        });

    const profileName = userProfile?.name || user?.name || 'there';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-screen bg-neutral-50 pb-12">
            <NotificationToast toasts={toasts} removeToast={removeToast} />

            {showSwapModal && selectedPost && (
                <SwapRequestModal
                    isOpen={showSwapModal}
                    onClose={() => setShowSwapModal(false)}
                    recipientName={selectedPost.userName}
                    recipientSkill={selectedPost.skillOffered}
                    skillId={parseInt(selectedPost.id)}
                    userSkills={userProfile?.skills.map(s => s.skillName) || []}
                    onSubmit={handleSwapSubmit}
                />
            )}

            {showCommentsModal && activeCommentPostId && (
                <CommentsModal
                    isOpen={showCommentsModal}
                    onClose={() => setShowCommentsModal(false)}
                    postId={parseInt(activeCommentPostId)}
                />
            )}

            {showReportModal && selectedPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-neutral-900">
                                <AlertOctagon className="h-6 w-6 text-error-500" />
                                Report Post
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="rounded-full p-2 transition-colors hover:bg-neutral-100">
                                <X className="h-5 w-5 text-neutral-400" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-neutral-600">You are reporting the post by <strong>{selectedPost.userName}</strong>. Our admin team will review this report.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-bold text-neutral-700">Reason for reporting</label>
                                <select
                                    value={reportData.subject}
                                    onChange={e => setReportData({ ...reportData, subject: e.target.value })}
                                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="" disabled>Select a reason...</option>
                                    <option value="Spam or Misleading">Spam or Misleading</option>
                                    <option value="Inappropriate Content">Inappropriate Content</option>
                                    <option value="Harassment or Abuse">Harassment or Abuse</option>
                                    <option value="Fraudulent Post">Fraudulent Post</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-bold text-neutral-700">Additional details</label>
                                <textarea
                                    value={reportData.description}
                                    onChange={e => setReportData({ ...reportData, description: e.target.value })}
                                    placeholder="Please provide more context to help us investigate..."
                                    className="h-24 w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 p-3 focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowReportModal(false)} className="flex-1 rounded-xl border border-neutral-200 py-2.5 font-medium text-neutral-600 transition-colors hover:bg-neutral-50">Cancel</button>
                                <button onClick={handleReportSubmit} className="flex-1 rounded-xl bg-error-600 py-2.5 font-bold text-white transition-colors hover:bg-error-700">Submit Report</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                        {greeting}, {profileName}.
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        {activeSwaps.length === 0 && pendingSwapApprovals.length === 0
                            ? 'You have no swaps yet. Find someone to learn from in the marketplace.'
                            : `You have ${activeSwaps.length} active swap${activeSwaps.length === 1 ? '' : 's'} and ${pendingSwapApprovals.length} waiting for your reply.`}
                    </p>
                </div>

                {pendingSwapApprovals.length > 0 && (
                    <div className="mb-5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="font-semibold">A swap is waiting for your reply</span>
                                    <p className="mt-0.5 text-xs text-warning-800">
                                        {pendingSwapApprovals[0]?.status === 'RESCHEDULED'
                                            ? `A reschedule request for ${pendingSwapApprovals[0]?.skill?.title || 'your swap'} is waiting for your review.`
                                            : `A swap request from ${pendingSwapApprovals[0]?.sender?.name || 'a member'} is waiting for your confirmation.`}
                                    </p>
                                </div>
                            </div>
                            <Link to="/swaps" className="shrink-0 rounded-md bg-warning-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-warning-800">
                                Review
                            </Link>
                        </div>
                    </div>
                )}

                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {homeStats.map((stat) => (
                        <div key={stat.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                            <p className="text-sm text-neutral-500">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold text-neutral-900">{stat.value}</p>
                            <p className="mt-1 text-[12px] text-neutral-500">{stat.detail}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-neutral-900">Upcoming Sessions</h2>
                        <Link to="/calendar" className="text-sm font-medium text-primary-700 hover:underline">
                            Open calendar
                        </Link>
                    </div>

                    {upcomingSessions.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingSessions.map((session) => (
                                <div key={`${session.name}-${session.time}`} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-[11px] font-semibold text-primary-700">
                                            {session.initials}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-neutral-900">{session.name}</p>
                                            <p className="mt-0.5 text-sm text-neutral-500">{session.skill}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-neutral-500">{session.time}</p>
                                            <span
                                                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.02em] ${
                                                    session.status === 'CONFIRMED'
                                                        ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]'
                                                        : 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]'
                                                }`}
                                            >
                                                {session.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <p className="font-medium text-neutral-900">No sessions booked yet</p>
                            <p className="mt-1 max-w-md text-sm text-neutral-500">
                                Find someone who teaches what you want to learn and send a swap request. Booked sessions show up here.
                            </p>
                            <Link to="/marketplace" className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                                Find skills
                            </Link>
                        </div>
                    )}
                </div>

                <div className="mt-6 space-y-4">
                    {/* ---------- New post ---------- */}
                    <section className="rounded-lg border border-neutral-200 bg-white p-4" aria-label="Create a post">
                        {!showCreatePost ? (
                            <button onClick={() => setShowCreatePost(true)} className="flex w-full items-center gap-3 text-left">
                                {userProfile?.profile?.avatarUrl ? (
                                    <img src={userProfile.profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                                        {userProfile ? getAvatarInitials(userProfile.name) : 'U'}
                                    </span>
                                )}
                                <span className="flex-1 rounded-md border border-neutral-300 px-4 py-2.5 text-sm text-neutral-500 hover:bg-neutral-50">
                                    Post what you can teach and what you'd like to learn…
                                </span>
                            </button>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleCreatePost(); }} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold text-neutral-900">New swap post</h2>
                                    <button type="button" onClick={() => setShowCreatePost(false)} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" aria-label="Close">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1 block text-sm font-medium text-neutral-700">I can teach</span>
                                        <input
                                            value={postContent.skillOffered}
                                            onChange={(e) => setPostContent({ ...postContent, skillOffered: e.target.value })}
                                            placeholder="e.g. React"
                                            className="input py-2 text-sm"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1 block text-sm font-medium text-neutral-700">I want to learn</span>
                                        <input
                                            value={postContent.skillWanted}
                                            onChange={(e) => setPostContent({ ...postContent, skillWanted: e.target.value })}
                                            placeholder="e.g. UI design"
                                            className="input py-2 text-sm"
                                        />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="mb-1 block text-sm font-medium text-neutral-700">Details</span>
                                    <textarea
                                        rows={3}
                                        value={postContent.description}
                                        onChange={(e) => setPostContent({ ...postContent, description: e.target.value })}
                                        placeholder="Your level, how often you can meet, anything a partner should know."
                                        className="input resize-none py-2 text-sm"
                                    />
                                </label>

                                {filePreview && (
                                    <div className="relative">
                                        <button onClick={handleRemoveFile} type="button" className="absolute right-2 top-2 z-10 rounded-full bg-white p-1 text-neutral-700 shadow hover:bg-neutral-100" aria-label="Remove attachment">
                                            <X className="h-4 w-4" />
                                        </button>
                                        {selectedFile?.type.startsWith('image/') ? (
                                            <img src={filePreview} alt="Attachment preview" className="max-h-64 w-full rounded-md object-cover" />
                                        ) : (
                                            <video src={filePreview} className="max-h-64 w-full rounded-md" controls />
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3">
                                    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100">
                                        <Image className="h-4 w-4" /> Photo or video
                                    </button>
                                    <label className="inline-flex items-center gap-1.5 text-sm text-neutral-700">
                                        Visible to
                                        <select value={postVisibility} onChange={(e) => setPostVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')} className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm">
                                            <option value="PUBLIC">Everyone</option>
                                            <option value="PRIVATE">Only me</option>
                                        </select>
                                    </label>
                                    <button type="submit" className="ml-auto rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                                        Post
                                    </button>
                                </div>
                                <p className="text-xs text-neutral-500">Posts also appear in Find skills, where people can send you a swap request.</p>
                            </form>
                        )}
                    </section>

                    {/* ---------- Feed controls ---------- */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex rounded-md border border-neutral-300 bg-white p-0.5" role="group" aria-label="Show">
                            {([['all', 'All posts'], ['matches', 'Good matches for me']] as const).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setFilter(value)}
                                    aria-pressed={filter === value}
                                    className={`rounded px-3 py-1.5 text-sm ${filter === value ? 'bg-neutral-900 font-medium text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                            Sort by
                            <select value={sort} onChange={(e) => setSort(e.target.value as SortType)} className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900">
                                <option value="recent">Newest</option>
                                <option value="popular">Most liked</option>
                                <option value="trending">Most discussed</option>
                            </select>
                        </label>
                    </div>

                    {/* ---------- Posts ---------- */}
                    {sortedPosts.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center">
                            <p className="font-medium text-neutral-900">
                                {filter === 'matches' ? 'No posts match your skills yet' : 'No posts yet'}
                            </p>
                            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-600">
                                {filter === 'matches'
                                    ? (myTeachSkills.length ? 'Nobody is asking for what you teach right now. Check back later, or browse everything.' : 'Add skills to your profile so we can find people who want to learn them.')
                                    : 'Be the first to post what you can teach and what you want to learn.'}
                            </p>
                            {filter === 'matches' && (
                                <button onClick={() => setFilter('all')} className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Show all posts</button>
                            )}
                        </div>
                    ) : (
                        sortedPosts.map((post) => {
                            const isMine = Number(post.userId) === Number(user?.id);
                            const saved = bookmarkedIds.has(Number(post.id));
                            return (
                                <article key={post.id} className="rounded-lg border border-neutral-200 bg-white">
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Link to={isMine ? '/profile' : `/profile/${post.userId}`} className="shrink-0">
                                                {post.userAvatar && post.userAvatar.startsWith('http') ? (
                                                    <img src={post.userAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                                                ) : (
                                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                                                        {getAvatarInitials(post.userName)}
                                                    </span>
                                                )}
                                            </Link>
                                            <div className="min-w-0 flex-1">
                                                <Link to={isMine ? '/profile' : `/profile/${post.userId}`} className="font-medium text-neutral-900 hover:underline">
                                                    {isMine ? 'You' : post.userName}
                                                </Link>
                                                <p className="text-xs text-neutral-500">{post.timestamp}</p>
                                            </div>
                                            {!isMine && (
                                                <div className="flex shrink-0 items-center">
                                                    <button
                                                        onClick={() => handleSave(post.id)}
                                                        aria-pressed={saved}
                                                        aria-label={saved ? 'Remove from saved' : 'Save post'}
                                                        title={saved ? 'Saved' : 'Save'}
                                                        className={`rounded p-1.5 hover:bg-neutral-100 ${saved ? 'text-primary-600' : 'text-neutral-400 hover:text-neutral-700'}`}
                                                    >
                                                        <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedPost(post); setReportData({ subject: '', description: '' }); setShowReportModal(true); }}
                                                        aria-label="Report this post"
                                                        title="Report"
                                                        className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-error-600"
                                                    >
                                                        <AlertOctagon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                            <div className="rounded-md bg-neutral-50 px-3 py-2">
                                                <dt className="text-xs text-neutral-500">Teaches</dt>
                                                <dd className="font-medium text-neutral-900">{post.skillOffered}</dd>
                                            </div>
                                            <div className="rounded-md bg-neutral-50 px-3 py-2">
                                                <dt className="text-xs text-neutral-500">Wants to learn</dt>
                                                <dd className="font-medium text-neutral-900">{post.skillWanted}</dd>
                                            </div>
                                        </dl>
                                        {post.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{post.description}</p>}
                                        {post.mediaUrl && (
                                            /\.(mp4|webm|mov)(\?|$)/i.test(post.mediaUrl)
                                                ? <video src={post.mediaUrl} controls className="mt-3 max-h-96 w-full rounded-md bg-neutral-100" />
                                                : <img src={post.mediaUrl} alt="" loading="lazy" className="mt-3 max-h-96 w-full rounded-md object-cover" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 border-t border-neutral-100 px-2 py-1.5">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            aria-pressed={post.isLiked}
                                            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm hover:bg-neutral-100 ${post.isLiked ? 'text-error-600' : 'text-neutral-600'}`}
                                        >
                                            <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                                            {post.likes > 0 ? post.likes : ''} <span className="sr-only">likes</span>{post.likes === 0 && 'Like'}
                                        </button>
                                        <button onClick={() => handleCommentClick(post)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100">
                                            <MessageCircle className="h-4 w-4" />
                                            {post.comments > 0 ? `${post.comments} comment${post.comments === 1 ? '' : 's'}` : 'Comment'}
                                        </button>
                                        {!isMine && (
                                            <button onClick={() => handleSwapClick(post)} className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700">
                                                <ArrowRightLeft className="h-4 w-4" /> Request swap
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
