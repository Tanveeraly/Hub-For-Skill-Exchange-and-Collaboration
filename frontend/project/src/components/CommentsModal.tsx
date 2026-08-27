import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchComments, addComment } from '../store/slices/commentsSlice';
import { X, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, postId }) => {
    const dispatch = useDispatch<AppDispatch>();
    const comments = useSelector((state: RootState) => state.comments.byPostId[postId] || []);
    const { loading } = useSelector((state: RootState) => state.comments);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (isOpen && postId) {
            dispatch(fetchComments(postId));
        }
    }, [isOpen, postId, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        await dispatch(addComment({ skillId: postId, text: newComment }));
        setNewComment('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                        <h3 className="font-semibold text-neutral-900">Comments</h3>
                        <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading && comments.length === 0 ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        {comment.user?.profile?.avatarUrl ? (
                                            <img
                                                src={comment.user.profile.avatarUrl}
                                                alt={comment.user.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                                                <User className="w-4 h-4 text-neutral-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-neutral-50 rounded-2xl rounded-tl-none p-3">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="font-semibold text-sm text-neutral-900">{comment.user?.name}</span>
                                            <span className="text-xs text-neutral-500">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-700">{comment.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-neutral-500">
                                <p>No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-neutral-100">
                        <form onSubmit={handleSubmit} className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 px-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || loading}
                                className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CommentsModal;
