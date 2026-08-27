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

    return (
        <div className="min-h-screen bg-gradient-primary pt-20 pb-12">
            <NotificationToast toasts={toasts} removeToast={removeToast} />

            {/* Swap Request Modal */}
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

            {/* Comments Modal */}
            {showCommentsModal && activeCommentPostId && (
                <CommentsModal
                    isOpen={showCommentsModal}
                    onClose={() => setShowCommentsModal(false)}
                    postId={parseInt(activeCommentPostId)}
                />
            )}

            {/* Report Modal */}
            {showReportModal && selectedPost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <AlertOctagon className="w-6 h-6 text-error-500" />
                                Report Post
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">You are reporting the post by <strong>{selectedPost.userName}</strong>. Our admin team will review this report.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Reason for reporting</label>
                                <select 
                                    value={reportData.subject} 
                                    onChange={e => setReportData({...reportData, subject: e.target.value})}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50"
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
                                <label className="block text-sm font-bold text-gray-700 mb-1">Additional details</label>
                                <textarea 
                                    value={reportData.description}
                                    onChange={e => setReportData({...reportData, description: e.target.value})}
                                    placeholder="Please provide more context to help us investigate..."
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50 resize-none h-24"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={handleReportSubmit} className="flex-1 py-2.5 bg-error-600 text-white rounded-xl font-bold hover:bg-error-700 transition-colors">Submit Report</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="container-wide">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - User Profile */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-3"
                    >
                        <div className="card card-hover overflow-hidden sticky top-24">
                            {/* Cover & Avatar */}
                            <div className="h-20 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary-400/20 animate-pulse"></div>
                            </div>
                            <div className="px-4 pb-4">
                                <div className="flex flex-col items-center -mt-12">
                                    {userProfile?.profile?.avatarUrl ? (
                                        <div className="relative">
                                            <img
                                                src={userProfile.profile.avatarUrl}
                                                alt={userProfile.name}
                                                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-xl"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-white"></div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                                                {userProfile ? getAvatarInitials(userProfile.name) : 'U'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-2 border-white"></div>
                                        </div>
                                    )}

                                    <div className="mt-3 flex items-center justify-center space-x-2">
                                        <h3 className="text-lg font-bold text-neutral-900 text-center">
                                            {userProfile?.name || 'Loading...'}
                                        </h3>
                                        {userProfile?.isVerified && (
                                            <span className="bg-primary-100 text-primary-600 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-primary-200">
                                                Verified
                                            </span>
                                        )}
                                    </div>

                                    {userProfile?.profile?.bio && (
                                        <p className="text-sm text-neutral-600 text-center mt-1 line-clamp-2">
                                            {userProfile.profile.bio}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-neutral-500 flex items-center">
                                            <Eye className="w-4 h-4 mr-1" />
                                            Profile Views
                                        </span>
                                        <span className="text-sm font-semibold text-primary-600">{/* TODO: fetch from API */}--</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-neutral-500 flex items-center">
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                            Swaps Completed
                                        </span>
                                        <span className="text-sm  font-semibold text-success-600">{/* TODO: fetch from API */}--</span>
                                    </div>
                                </div>

                                {userProfile?.skills && userProfile.skills.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-neutral-100">
                                        <h4 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center">
                                            <Sparkles className="w-4 h-4 mr-1 text-warning-500" />
                                            YOUR SKILLS
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {userProfile.skills.slice(0, 4).map((skill) => (
                                                <motion.span
                                                    key={skill.id}
                                                    whileHover={{ scale: 1.05 }}
                                                    className="px-3 py-1 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-xs font-medium cursor-pointer hover:shadow-md transition-all"
                                                >
                                                    {skill.skillName}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Feed */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* Filter and Sort Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-4 flex flex-wrap items-center gap-3"
                        >
                            <div className="flex items-center space-x-2 flex-1">
                                <Filter className="w-4 h-4 text-neutral-500" />
                                <span className="text-sm font-medium text-neutral-700">Filter:</span>
                                <div className="flex space-x-2">
                                    {(['all', 'offering', 'seeking'] as FilterType[]).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${filter === f
                                                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                                }`}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <SortDesc className="w-4 h-4 text-neutral-500" />
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortType)}
                                    className="px-3 py-1 rounded-lg text-sm font-medium bg-neutral-100 border-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="recent">Recent</option>
                                    <option value="popular">Popular</option>
                                    <option value="trending">Trending</option>
                                </select>
                            </div>
                        </motion.div>

                        {/* Create Post Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card card-hover p-6"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                {userProfile?.profile?.avatarUrl ? (
                                    <img
                                        src={userProfile.profile.avatarUrl}
                                        alt={userProfile.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white font-bold">
                                        {userProfile ? getAvatarInitials(userProfile.name) : 'U'}
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowCreatePost(!showCreatePost)}
                                    className="flex-1 text-left px-4 py-3 bg-gradient-to-r from-neutral-50 to-primary-50 hover:from-neutral-100 hover:to-primary-100 rounded-full text-neutral-500 transition-all"
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
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="What skill do you want to learn?"
                                            value={postContent.skillWanted}
                                            onChange={(e) => setPostContent({ ...postContent, skillWanted: e.target.value })}
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        />
                                        <textarea
                                            placeholder="Describe your swap proposal..."
                                            value={postContent.description}
                                            onChange={(e) => setPostContent({ ...postContent, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                                        />
                                        <div className="flex justify-between items-center pt-2">
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
                                                    className="p-2 hover:bg-primary-50 rounded-full text-neutral-500 transition-colors"
                                                    type="button"
                                                >
                                                    <Image className="w-5 h-5" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="p-2 hover:bg-primary-50 rounded-full text-neutral-500 transition-colors"
                                                    type="button"
                                                >
                                                    <Video className="w-5 h-5" />
                                                </motion.button>
                                                <motion.button whileHover={{ scale: 1.1 }} className="p-2 hover:bg-primary-50 rounded-full text-neutral-500 transition-colors" type="button">
                                                    <Calendar className="w-5 h-5" />
                                                </motion.button>
                                            </div>
                                            {/* Visibility Toggle */}
                                            <div className="flex items-center bg-neutral-100 rounded-full p-1 gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPostVisibility('PUBLIC')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                                        postVisibility === 'PUBLIC'
                                                            ? 'bg-white shadow text-primary-700'
                                                            : 'text-neutral-500 hover:text-neutral-700'
                                                    }`}
                                                >
                                                    <Globe className="w-3.5 h-3.5" />
                                                    Public
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPostVisibility('PRIVATE')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                                        postVisibility === 'PRIVATE'
                                                            ? 'bg-white shadow text-rose-600'
                                                            : 'text-neutral-500 hover:text-neutral-700'
                                                    }`}
                                                >
                                                    <Lock className="w-3.5 h-3.5" />
                                                    Only Me
                                                </button>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleCreatePost}
                                                className="px-8 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-full hover:shadow-lg transition-all font-medium"
                                                type="button"
                                            >
                                                Post
                                            </motion.button>
                                        </div>
                                        {filePreview && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 relative"
                                            >
                                                <button
                                                    onClick={handleRemoveFile}
                                                    className="absolute top-2 right-2 bg-error-500 text-white p-1 rounded-full hover:bg-error-600 z-10"
                                                    type="button"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                {selectedFile?.type.startsWith('image/') ? (
                                                    <img src={filePreview} alt="Preview" className="w-full rounded-xl max-h-64 object-cover" />
                                                ) : (
                                                    <video src={filePreview} className="w-full rounded-xl max-h-64" controls />
                                                )}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Posts Feed */}
                        <div className="space-y-6">
                            {sortedPosts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`rounded-2xl shadow-lg card-hover overflow-hidden bg-white`}
                                >


                                    <div className="p-6">
                                        {/* Post Header */}
                                        <div className="flex items-start space-x-3 mb-4">
                                            {post.userAvatar && post.userAvatar.startsWith('http') ? (
                                                <img
                                                    src={post.userAvatar}
                                                    alt={post.userName}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-600 to-error-500 flex items-center justify-center text-white font-bold shadow-md">
                                                    {post.userAvatar || post.userName.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-neutral-900">
                                                    {post.userName}
                                                </h3>
                                                <p className="text-sm text-neutral-500">{post.timestamp}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleSave(post.id)}
                                                    className={`p-2 rounded-full transition-colors ${post.isSaved ? 'text-warning-500 bg-warning-50' : 'text-neutral-400 hover:bg-neutral-100'
                                                        }`}
                                                >
                                                    <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
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
                                                    className="p-2 rounded-full transition-colors text-neutral-400 hover:text-error-500 hover:bg-error-50"
                                                >
                                                    <AlertOctagon className="w-5 h-5" />
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        <div className="mb-4">
                                            <div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    <motion.span
                                                        whileHover={{ scale: 1.05 }}
                                                        className="px-4 py-1.5 bg-gradient-to-r from-success-100 to-success-100 text-success-700 rounded-full text-sm font-medium shadow-sm"
                                                    >
                                                        Offering: {post.skillOffered}
                                                    </motion.span>
                                                    <motion.span
                                                        whileHover={{ scale: 1.05 }}
                                                        className="px-4 py-1.5 bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 rounded-full text-sm font-medium shadow-sm"
                                                    >
                                                        Seeking: {post.skillWanted}
                                                    </motion.span>
                                                </div>
                                                <p className="text-neutral-700 leading-relaxed">{post.description}</p>
                                            </div>
                                        </div>

                                        {/* Post Actions */}
                                        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleLike(post.id)}
                                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${post.isLiked
                                                    ? 'text-error-600 bg-error-50'
                                                    : 'text-neutral-600 hover:bg-neutral-50'
                                                    }`}
                                            >
                                                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                                <span className="text-sm font-medium">{post.likes}</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleCommentClick(post)}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-neutral-600 hover:bg-neutral-50"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                                <span className="text-sm font-medium">{post.comments}</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleSwapClick(post)}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-accent-600 bg-accent-50 hover:bg-accent-100 transition-all"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                                <span className="text-sm font-medium">Swap</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-neutral-600 hover:bg-neutral-50"
                                            >
                                                <Send className="w-5 h-5" />
                                                <span className="text-sm font-medium">Share</span>
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-3 space-y-6"
                    >
                        {/* Suggested Connections */}
                        <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
                            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-primary-600" />
                                Suggested For You
                            </h3>
                            <div className="space-y-3">
                                {suggestedUsers.slice(0, 5).map((suggestedUser, idx) => {
                                    console.log(`User ${idx}:`, JSON.stringify(suggestedUser, null, 2));
                                    return (

                                        <div
                                            key={suggestedUser.id || idx}
                                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-50 transition-all border border-transparent hover:border-neutral-200"
                                        >
                                            {suggestedUser.profile?.avatarUrl ? (
                                                <img
                                                    src={suggestedUser.profile.avatarUrl}
                                                    alt={suggestedUser.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                                                    onError={(e) => {
                                                        console.error(`Image failed for user ${suggestedUser.name}:`, suggestedUser.profile.avatarUrl);
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {getAvatarInitials(suggestedUser.name)}
                                                </div>
                                            )}
                                            {/* Fallback for Image Error (hidden by default, shown by onError) */}
                                            <div className="hidden w-10 h-10 rounded-full bg-neutral-300 flex items-center justify-center text-white font-bold text-sm">
                                                {getAvatarInitials(suggestedUser.name)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-900 truncate">{suggestedUser.name}</p>
                                                <p className="text-xs text-neutral-500 truncate">
                                                    {suggestedUser.skills?.[0]?.skillName || 'Skill Expert'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const hasCommon = connections.some(c => c.id === suggestedUser.id);
                                                    const isPending = pendingRequests.some(r => r.sender?.id === suggestedUser.id);
                                                    const isSent = sentRequests.some(r => r.receiver?.id === suggestedUser.id);

                                                    if (!hasCommon && !isPending && !isSent) {
                                                        dispatch(sendConnectionRequest(suggestedUser.id));
                                                    }
                                                }}
                                                disabled={
                                                    connections.some((c: any) => c.id === suggestedUser.id) ||
                                                    pendingRequests.some((r: any) => r.sender?.id === suggestedUser.id) ||
                                                    sentRequests.some((r: any) => r.receiver?.id === suggestedUser.id)
                                                }
                                                className={`px-3 py-1 text-xs font-medium rounded-full transition-all flex items-center space-x-1 ${connections.some((c: any) => c.id === suggestedUser.id)
                                                    ? 'bg-success-50 text-success-600 cursor-default'
                                                    : sentRequests.some((r: any) => r.receiver?.id === suggestedUser.id)
                                                        ? 'bg-warning-50 text-warning-600 cursor-default'
                                                        : pendingRequests.some((r: any) => r.sender?.id === suggestedUser.id)
                                                            ? 'bg-primary-50 text-primary-600 cursor-default'
                                                            : 'text-primary-600 hover:bg-primary-50'
                                                    }`}
                                            >
                                                <Users className="w-3 h-3" />
                                                <span>
                                                    {connections.some((c: any) => c.id === suggestedUser.id)
                                                        ? 'Connected'
                                                        : sentRequests.some((r: any) => r.receiver?.id === suggestedUser.id)
                                                            ? 'Pending'
                                                            : pendingRequests.some((r: any) => r.sender?.id === suggestedUser.id)
                                                                ? 'Respond'
                                                                : 'Connect'}
                                                </span>
                                            </button>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Trending Skills */}
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2 text-success-600" />
                                Trending Skills
                            </h3>
                            <div className="space-y-3">
                                {['React', 'Python', 'UI/UX Design', 'Data Science', 'Mobile Dev'].map((skill, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 4 }}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer"
                                    >
                                        <span className="text-sm text-neutral-700 font-medium">{skill}</span>
                                        <span className="text-xs text-success-600 font-semibold">Trending</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div >
        </div >
    );
}
