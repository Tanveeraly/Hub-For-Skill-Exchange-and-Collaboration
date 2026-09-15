import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Heart, MessageCircle, RefreshCw, Send, Image, Video, Calendar, TrendingUp, Users, Eye, Bookmark, Filter, SortDesc, Sparkles, X, Zap, Bot, ArrowRightLeft, UserPlus, AlertOctagon, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import NotificationToast, { Toast } from '../components/NotificationToast';
import SwapRequestModal from '../components/SwapRequestModal';
import CommentsModal from '../components/CommentsModal';
import { fetchPosts, createPost, likePost, unlikePost } from '../store/slices/postsSlice';
import { toggleBookmark } from '../store/slices/bookmarksSlice';
import { sendConnectionRequest, fetchPendingRequests, fetchConnections, fetchSentRequests } from '../store/slices/connectionSlice';
import { fetchReceivedSwaps, fetchSentSwaps } from '../store/slices/swapsSlice';
import { submitComplaint } from '../store/slices/adminSlice';

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
    isSkillMatch: boolean;
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

type FilterType = 'all' | 'offering' | 'seeking';
type SortType = 'recent' | 'popular' | 'trending';

export default function HomeFeed() {
    const dispatch = useDispatch<AppDispatch>();
    const { items: posts, loading } = useSelector((state: RootState) => state.posts);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { pendingRequests, connections, sentRequests } = useSelector((state: RootState) => state.connections);
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
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
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
        fetchSuggestedUsers();
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
            const res = await axios.get('http://localhost:5000/api/v1/auth/getme', {
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

    const fetchSuggestedUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/v1/auth/getAllUsersFullInfo', {
                withCredentials: true
            });
            if (res.data.statusCode === 200) {
                setSuggestedUsers((res.data.data || []).slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        }
    };

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
        if (!postContent.skillOffered || !postContent.skillWanted || !postContent.description) {
            addToast('error', 'Please fill in all fields');
            return;
        }

        dispatch(createPost({
            title: `${postContent.skillOffered} <-> ${postContent.skillWanted}`,
            description: postContent.description,
            isFeatured: false,
            file: selectedFile,
            visibility: postVisibility,
        })).then(() => {
            setPostContent({ skillOffered: '', skillWanted: '', description: '' });
            setPostVisibility('PUBLIC');
            handleRemoveFile();
            setShowCreatePost(false);
            addToast('success', 'Post created successfully!');
        });
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

    const handleSave = (postId: string) => {
        dispatch(toggleBookmark(parseInt(postId))).then(() => {
            // Optionally manual update state if slice doesn't auto-update list
            // For now relying on slice or re-fetch
            dispatch(fetchPosts()); // brute force refresh or optimistic update
            addToast('success', 'Bookmark updated');
        });
    };

    const handleSwapClick = (post: Post) => {
        setSelectedPost(post);
        setShowSwapModal(true);
    };

    const handleCommentClick = (post: Post) => {
        setActiveCommentPostId(post.id);
        setShowCommentsModal(true);
    };

    const handleSwapSubmit = (data: any) => {
        console.log('Swap requested:', data);
        addToast('success', `Swap request sent to ${selectedPost?.userName}!`);
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

    const allSwaps = [...receivedSwaps, ...sentSwaps];
    const activeSwaps = allSwaps.filter((swap: any) => swap.status === 'ACCEPTED');
    const pendingSwapApprovals = allSwaps.filter((swap: any) => ['PENDING', 'RESCHEDULED'].includes(swap.status));
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

    const filteredPosts = localPosts.filter(post => {
        if (filter === 'all') return true;
        // This is simplified - in real app you'd filter based on actual criteria
        return true;
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
            detail: activeSwaps.length ? `${activeSwaps.length} live agreements` : 'No active swaps yet',
            tone: 'bg-[#EAF3FF] text-[#0A66C2]'
        },
        {
            label: 'Pending Requests',
            value: String(pendingRequests.length + pendingSwapApprovals.length),
            detail: pendingRequests.length || pendingSwapApprovals.length ? `${pendingRequests.length} connection + ${pendingSwapApprovals.length} swap actions` : 'Nothing waiting for review',
            tone: 'bg-[#EAFBF0] text-[#15803D]'
        },
        {
            label: 'Completed This Month',
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

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
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
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                <AlertOctagon className="h-6 w-6 text-error-500" />
                                Report Post
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="rounded-full p-2 transition-colors hover:bg-gray-100">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">You are reporting the post by <strong>{selectedPost.userName}</strong>. Our admin team will review this report.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-bold text-gray-700">Reason for reporting</label>
                                <select
                                    value={reportData.subject}
                                    onChange={e => setReportData({ ...reportData, subject: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 focus:ring-2 focus:ring-primary-500"
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
                                <label className="mb-1 block text-sm font-bold text-gray-700">Additional details</label>
                                <textarea
                                    value={reportData.description}
                                    onChange={e => setReportData({ ...reportData, description: e.target.value })}
                                    placeholder="Please provide more context to help us investigate..."
                                    className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowReportModal(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 font-medium text-gray-600 transition-colors hover:bg-gray-50">Cancel</button>
                                <button onClick={handleReportSubmit} className="flex-1 rounded-xl bg-error-600 py-2.5 font-bold text-white transition-colors hover:bg-error-700">Submit Report</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                        Good morning, {profileName}.
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        You have {activeSwaps.length} active swaps and {pendingSwapApprovals.length} escrow agreement{pendingSwapApprovals.length === 1 ? '' : 's'} pending confirmation.
                    </p>
                </div>

                {pendingSwapApprovals.length > 0 && (
                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="font-semibold">Escrow Agreement Requires Your Confirmation</span>
                                    <p className="mt-0.5 text-xs text-amber-800">
                                        {pendingSwapApprovals[0]?.status === 'RESCHEDULED'
                                            ? `A reschedule request for ${pendingSwapApprovals[0]?.skill?.title || 'your swap'} is waiting for your review.`
                                            : `A swap request from ${pendingSwapApprovals[0]?.sender?.name || 'a member'} is waiting for your confirmation.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6 grid gap-3 md:grid-cols-4">
                    {homeStats.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}>
                                {stat.label === 'Active Swaps' && <TrendingUp className="h-5 w-5" />}
                                {stat.label === 'Pending Messages' && <MessageCircle className="h-5 w-5" />}
                                {stat.label === 'Completed This Month' && <Calendar className="h-5 w-5" />}
                                {stat.label === 'Credibility Score' && <Users className="h-5 w-5" />}
                            </div>
                            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{stat.detail}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Upcoming Sessions</h2>
                        <button type="button" className="text-sm font-medium text-[#0A66C2] hover:text-[#004182]">
                            View all →
                        </button>
                    </div>

                    {upcomingSessions.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingSessions.map((session) => (
                                <div key={`${session.name}-${session.time}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-[11px] font-semibold text-primary-700">
                                            {session.initials}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
                                            <p className="mt-0.5 text-sm text-slate-500">{session.skill}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">{session.time}</p>
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
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <p className="text-lg font-semibold text-slate-900">No pending swap proposals yet</p>
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                Explore verified mentors who teach what you want to learn, and offer what you know in return.
                            </p>
                            <button type="button" className="mt-4 rounded-md bg-[#0A66C2] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#004182]">
                                Browse Marketplace →
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                    >
                        <div className="flex items-center space-x-2 flex-1">
                            <Filter className="h-4 w-4 text-neutral-500" />
                            <span className="text-sm font-medium text-neutral-700">Filter:</span>
                            <div className="flex space-x-2">
                                {(['all', 'offering', 'seeking'] as FilterType[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${filter === f
                                            ? 'bg-primary-700 text-white'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                        }`}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <SortDesc className="h-4 w-4 text-neutral-500" />
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value as SortType)}
                                className="rounded-md border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="recent">Recent</option>
                                <option value="popular">Popular</option>
                                <option value="trending">Trending</option>
                            </select>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-5"
                    >
                        <div className="mb-4 flex items-center space-x-3">
                            {userProfile?.profile?.avatarUrl ? (
                                <img
                                    src={userProfile.profile.avatarUrl}
                                    alt={userProfile.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                                    {userProfile ? getAvatarInitials(userProfile.name) : 'U'}
                                </div>
                            )}
                            <button
                                onClick={() => setShowCreatePost(!showCreatePost)}
                                className="flex-1 rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-left text-neutral-500 transition-all hover:bg-white"
                            >
                                Share a skill swap...
                            </button>
                        </div>

                        <AnimatePresence>
                            {showCreatePost && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                >
                                    <input
                                        type="text"
                                        placeholder="What skill can you offer?"
                                        value={postContent.skillOffered}
                                        onChange={(e) => setPostContent({ ...postContent, skillOffered: e.target.value })}
                                        className="w-full rounded-xl border border-neutral-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="What skill do you want to learn?"
                                        value={postContent.skillWanted}
                                        onChange={(e) => setPostContent({ ...postContent, skillWanted: e.target.value })}
                                        className="w-full rounded-xl border border-neutral-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
                                    />
                                    <textarea
                                        placeholder="Describe your swap proposal..."
                                        value={postContent.description}
                                        onChange={(e) => setPostContent({ ...postContent, description: e.target.value })}
                                        rows={3}
                                        className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
                                    />
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex space-x-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,video/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-primary-50"
                                                type="button"
                                            >
                                                <Image className="h-5 w-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-primary-50"
                                                type="button"
                                            >
                                                <Video className="h-5 w-5" />
                                            </motion.button>
                                            <motion.button whileHover={{ scale: 1.1 }} className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-primary-50" type="button">
                                                <Calendar className="h-5 w-5" />
                                            </motion.button>
                                        </div>
                                        <div className="flex items-center gap-1 rounded-full bg-neutral-100 p-1">
                                            <button
                                                type="button"
                                                onClick={() => setPostVisibility('PUBLIC')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                                    postVisibility === 'PUBLIC'
                                                        ? 'bg-white shadow text-primary-700'
                                                        : 'text-neutral-500 hover:text-neutral-700'
                                                }`}
                                            >
                                                <Globe className="h-3.5 w-3.5" />
                                                Public
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPostVisibility('PRIVATE')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                                    postVisibility === 'PRIVATE'
                                                        ? 'bg-white shadow text-rose-600'
                                                        : 'text-neutral-500 hover:text-neutral-700'
                                                }`}
                                            >
                                                <Lock className="h-3.5 w-3.5" />
                                                Only Me
                                            </button>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleCreatePost}
                                            className="rounded-md bg-primary-700 px-6 py-2 font-medium text-white transition-all hover:bg-primary-800"
                                            type="button"
                                        >
                                            Post
                                        </motion.button>
                                    </div>
                                    {filePreview && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="relative mt-3"
                                        >
                                            <button
                                                onClick={handleRemoveFile}
                                                className="absolute right-2 top-2 z-10 rounded-full bg-error-500 p-1 text-white hover:bg-error-600"
                                                type="button"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            {selectedFile?.type.startsWith('image/') ? (
                                                <img src={filePreview} alt="Preview" className="max-h-64 w-full rounded-xl object-cover" />
                                            ) : (
                                                <video src={filePreview} className="max-h-64 w-full rounded-xl" controls />
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <div className="space-y-6">
                        {sortedPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card overflow-hidden"
                            >
                                <div className="p-5">
                                    <div className="mb-4 flex items-start space-x-3">
                                        {post.userAvatar && post.userAvatar.startsWith('http') ? (
                                            <img
                                                src={post.userAvatar}
                                                alt={post.userName}
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                                                {post.userAvatar || post.userName.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-neutral-900">{post.userName}</h3>
                                            <p className="text-sm text-neutral-500">{post.timestamp}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleSave(post.id)}
                                                className={`rounded-full p-2 transition-colors ${post.isSaved ? 'bg-warning-50 text-warning-500' : 'text-neutral-400 hover:bg-neutral-100'}`}
                                            >
                                                <Bookmark className={`h-5 w-5 ${post.isSaved ? 'fill-current' : ''}`} />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    setSelectedPost(post);
                                                    setReportData({ subject: '', description: '' });
                                                    setShowReportModal(true);
                                                }}
                                                title="Report Post"
                                                className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-500"
                                            >
                                                <AlertOctagon className="h-5 w-5" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            <motion.span
                                                whileHover={{ scale: 1.05 }}
                                                className="rounded-md border border-success-200 bg-success-50 px-3 py-1 text-sm font-medium text-success-700"
                                            >
                                                Offering: {post.skillOffered}
                                            </motion.span>
                                            <motion.span
                                                whileHover={{ scale: 1.05 }}
                                                className="rounded-md border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                                            >
                                                Seeking: {post.skillWanted}
                                            </motion.span>
                                        </div>
                                        <p className="leading-relaxed text-neutral-700">{post.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleLike(post.id)}
                                            className={`flex items-center space-x-2 rounded-xl px-4 py-2 transition-all ${post.isLiked ? 'bg-error-50 text-error-600' : 'text-neutral-600 hover:bg-neutral-50'}`}
                                        >
                                            <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                            <span className="text-sm font-medium">{post.likes}</span>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleCommentClick(post)}
                                            className="flex items-center space-x-2 rounded-xl px-4 py-2 text-neutral-600 transition-all hover:bg-neutral-50"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                            <span className="text-sm font-medium">{post.comments}</span>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleSwapClick(post)}
                                            className="flex items-center space-x-2 rounded-xl bg-accent-50 px-4 py-2 text-accent-600 transition-all hover:bg-accent-100"
                                        >
                                            <RefreshCw className="h-5 w-5" />
                                            <span className="text-sm font-medium">Swap</span>
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="flex items-center space-x-2 rounded-xl px-4 py-2 text-neutral-600 transition-all hover:bg-neutral-50"
                                        >
                                            <Send className="h-5 w-5" />
                                            <span className="text-sm font-medium">Share</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
