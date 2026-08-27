import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState, AppDispatch } from '../store/store';
import { updateConversation, setSelectedConversationId, fetchMessages, sendMessage, fetchConversations, uploadFile, setConversations } from '../store/slices/chatSlice';
import { initiateCall } from '../store/slices/callSlice';
import { socket } from '../services/socket';
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Smile, Check, CheckCheck, PhoneOff, ArrowLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Messages() {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const { conversations, messages, selectedConversationId, loading } = useSelector((state: RootState) => state.chat);
    const { onlineUsers, callState, error: callError } = useSelector((state: RootState) => state.call);
    const selectedConversation = useMemo(() =>
        conversations.find(c => c.id === selectedConversationId) || null
        , [conversations, selectedConversationId]);

    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [remoteIsTyping, setRemoteIsTyping] = useState(false);
    const [showCallError, setShowCallError] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);
    const currentUserId = user?.id || 0;

    const isSelectedUserOnline = selectedConversation
        ? onlineUsers.includes(selectedConversation.userId)
        : false;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        dispatch(fetchConversations());
    }, [dispatch]);

    useEffect(() => {
        if (location.state?.startChatWith) {
            const partner = location.state.startChatWith;
            const partnerId = Number(partner.id);
            // Search if conversation already exists
            const existingConv = conversations.find(c => Number(c.userId) === partnerId);
            if (existingConv) {
                dispatch(setSelectedConversationId(existingConv.id));
            } else {
                // If it doesn't exist, create a temporary conversation and select it
                const tempId = `temp-${partnerId}`;
                const tempConv = {
                    id: tempId,
                    userId: partnerId,
                    userName: partner.name,
                    userAvatar: partner.avatarUrl,
                    lastMessage: 'Say hello to start the collaboration!',
                    lastMessageTime: 'Now',
                    unreadCount: 0,
                    isOnline: false
                };
                if (!conversations.find(c => c.id === tempId)) {
                    dispatch(setConversations([tempConv, ...conversations]));
                }
                dispatch(setSelectedConversationId(tempId));
            }
        }
    }, [location.state, conversations, dispatch]);

    useEffect(() => {
        if (selectedConversation && currentUserId) {
            dispatch(fetchMessages({
                userId1: Number(currentUserId),
                userId2: Number(selectedConversation.userId)
            }));
        }
    }, [dispatch, selectedConversation, currentUserId]);

    useEffect(() => {
        if (callError) {
            setShowCallError(true);
            const timeout = setTimeout(() => setShowCallError(false), 5000);
            return () => clearTimeout(timeout);
        }
    }, [callError]);

    useEffect(() => {
        const handleUserTyping = ({ userId, isTyping }: { userId: number; isTyping: boolean }) => {
            if (selectedConversation && userId === selectedConversation.userId) {
                setRemoteIsTyping(isTyping);
            }
        };

        socket.on('user-typing', handleUserTyping);
        return () => {
            socket.off('user-typing', handleUserTyping);
        };
    }, [selectedConversation]);

    const handleTyping = useCallback(() => {
        if (!isTyping && selectedConversation) {
            setIsTyping(true);
            socket.emit('typing-start', {
                senderId: currentUserId,
                receiverId: selectedConversation.userId
            });
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (selectedConversation) {
                setIsTyping(false);
                socket.emit('typing-stop', {
                    senderId: currentUserId,
                    receiverId: selectedConversation.userId
                });
            }
        }, 2000);
    }, [isTyping, selectedConversation, currentUserId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversation) return;

        try {
            setIsUploading(true);
            const result = await dispatch(uploadFile(file)).unwrap();
            setPendingAttachments([...pendingAttachments, result]);
            setIsUploading(false);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload file. Please try again.");
            setIsUploading(false);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = () => {
        if ((!newMessage.trim() && pendingAttachments.length === 0) || !selectedConversation) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping(false);
        socket.emit('typing-stop', {
            senderId: currentUserId,
            receiverId: selectedConversation.userId
        });

        dispatch(sendMessage({
            senderId: Number(currentUserId),
            receiverId: Number(selectedConversation.userId),
            content: newMessage,
            attachments: pendingAttachments
        }));

        setNewMessage('');
        setPendingAttachments([]);

        dispatch(updateConversation({
            ...selectedConversation,
            lastMessage: newMessage || `${pendingAttachments.length} file(s)`,
            lastMessageTime: 'Just now'
        }));
    };

    const handleAudioCall = () => {
        if (!selectedConversation) return;

        if (!isSelectedUserOnline) {
            setShowCallError(true);
            setTimeout(() => setShowCallError(false), 3000);
            return;
        }

        dispatch(initiateCall({
            remoteUser: {
                id: selectedConversation.userId,
                name: selectedConversation.userName,
                avatarUrl: selectedConversation.userAvatar
            },
            callType: 'audio'
        }));
    };

    const handleVideoCall = () => {
        if (!selectedConversation) return;

        if (!isSelectedUserOnline) {
            setShowCallError(true);
            setTimeout(() => setShowCallError(false), 3000);
            return;
        }

        dispatch(initiateCall({
            remoteUser: {
                id: selectedConversation.userId,
                name: selectedConversation.userName,
                avatarUrl: selectedConversation.userAvatar
            },
            callType: 'video'
        }));
    };

    const filteredConversations = conversations.filter(conv =>
        conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getConversationWithOnlineStatus = (conv: typeof conversations[0]) => ({
        ...conv,
        isOnline: onlineUsers.includes(conv.userId)
    });

    return (
        <div className="min-h-screen bg-neutral-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 140px)', minHeight: '600px' }}>
                    <div className="flex h-full">
                        {/* Conversations Sidebar */}
                        <div className={`w-full md:w-80 lg:w-96 border-r border-neutral-200 flex flex-col bg-white ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                            {/* Search */}
                            <div className="p-4 border-b border-neutral-200">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search messages..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Loading State */}
                            {loading && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            )}

                            {/* Conversations */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredConversations.map((conv) => {
                                    const convWithStatus = getConversationWithOnlineStatus(conv);
                                    return (
                                        <motion.div
                                            key={conv.id}
                                            whileHover={{ backgroundColor: '#f9fafb' }}
                                            onClick={() => dispatch(setSelectedConversationId(conv.id))}
                                            className={`p-4 border-b border-neutral-100 cursor-pointer transition ${selectedConversation?.id === conv.id ? 'bg-primary-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="relative flex-shrink-0">
                                                    {conv.userAvatar ? (
                                                        <img
                                                            src={conv.userAvatar}
                                                            alt={conv.userName}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                                                            {conv.userName?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                    )}
                                                    {convWithStatus.isOnline && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white rounded-full"></div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-semibold text-neutral-900 truncate">{conv.userName}</h3>
                                                        <span className="text-xs text-neutral-500">{conv.lastMessageTime}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-neutral-600 truncate pr-2">{conv.lastMessage}</p>
                                                        {conv.unreadCount > 0 && (
                                                            <span className="flex-shrink-0 w-5 h-5 bg-primary-600 text-white text-xs flex items-center justify-center rounded-full font-bold">
                                                                {conv.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Empty State */}
                                {!loading && filteredConversations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                                        <Search className="w-12 h-12 mb-4" />
                                        <p>No conversations found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Window */}
                        {selectedConversation ? (
                            <div className="flex-1 flex flex-col bg-white">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white flex-shrink-0">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <button
                                            onClick={() => dispatch(setSelectedConversationId(null))}
                                            className="md:hidden p-2 -ml-2 hover:bg-neutral-100 rounded-full transition flex-shrink-0"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                                        </button>
                                        <div className="relative flex-shrink-0">
                                            {selectedConversation.userAvatar ? (
                                                <img
                                                    src={selectedConversation.userAvatar}
                                                    alt={selectedConversation.userName}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                                                    {selectedConversation.userName?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            {isSelectedUserOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-neutral-900 truncate">{selectedConversation.userName}</h3>
                                            <p className="text-xs text-neutral-500">
                                                {remoteIsTyping ? (
                                                    <span className="text-primary-600">typing...</span>
                                                ) : isSelectedUserOnline ? (
                                                    <span className="text-success-600">Online</span>
                                                ) : (
                                                    'Offline'
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleAudioCall}
                                            disabled={callState !== 'idle'}
                                            className={`p-2 rounded-full transition ${isSelectedUserOnline
                                                    ? 'hover:bg-success-100 text-success-600'
                                                    : 'hover:bg-neutral-100 text-neutral-400'
                                                } ${callState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={isSelectedUserOnline ? 'Start audio call' : 'User is offline'}
                                        >
                                            <Phone className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleVideoCall}
                                            disabled={callState !== 'idle'}
                                            className={`p-2 rounded-full transition ${isSelectedUserOnline
                                                    ? 'hover:bg-primary-100 text-primary-600'
                                                    : 'hover:bg-neutral-100 text-neutral-400'
                                                } ${callState !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={isSelectedUserOnline ? 'Start video call' : 'User is offline'}
                                        >
                                            <Video className="w-5 h-5" />
                                        </motion.button>
                                        <button className="p-2 hover:bg-neutral-100 rounded-full transition">
                                            <MoreVertical className="w-5 h-5 text-neutral-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Call Error Notification */}
                                <AnimatePresence>
                                    {showCallError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="mx-4 mt-2 p-3 bg-error-50 border border-error-200 rounded-lg flex items-center space-x-2 flex-shrink-0"
                                        >
                                            <PhoneOff className="w-5 h-5 text-error-500" />
                                            <span className="text-sm text-error-700">
                                                {callError?.message || 'User is offline. Cannot start call.'}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${Number(message.senderId) === Number(currentUserId) ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-xs lg:max-w-md`}>
                                                <div
                                                    className={`px-4 py-2 rounded-2xl ${Number(message.senderId) === Number(currentUserId)
                                                            ? 'bg-primary-600 text-white rounded-br-none'
                                                            : 'bg-neutral-100 text-neutral-900 rounded-bl-none'
                                                        }`}
                                                >
                                                    {message.attachments?.map((att: any) => (
                                                        <div key={att.id} className="mb-2 p-2 bg-white/10 rounded-lg flex items-center space-x-2">
                                                            <Paperclip className="w-4 h-4" />
                                                            <a href={att.fileUrl || att.url} target="_blank" rel="noopener noreferrer" className="text-xs underline truncate max-w-[150px]">
                                                                {att.fileName || att.name}
                                                            </a>
                                                        </div>
                                                    ))}
                                                    <p className="text-sm">{message.content}</p>
                                                </div>
                                                <div className={`flex items-center space-x-1 mt-1 ${Number(message.senderId) === Number(currentUserId) ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-xs text-neutral-400">{message.timestamp}</span>
                                                    {message.senderId === currentUserId && (
                                                        message.isRead ? (
                                                            <CheckCheck className="w-3 h-3 text-primary-600" />
                                                        ) : (
                                                            <Check className="w-3 h-3 text-neutral-400" />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing Indicator */}
                                    <AnimatePresence>
                                        {remoteIsTyping && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="flex justify-start"
                                            >
                                                <div className="bg-neutral-100 rounded-2xl rounded-bl-none px-4 py-3">
                                                    <div className="flex space-x-1">
                                                        {[0, 1, 2].map((i) => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ y: [0, -5, 0] }}
                                                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                                                                className="w-2 h-2 bg-neutral-400 rounded-full"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-neutral-200 bg-white flex-shrink-0">
                                    {pendingAttachments.length > 0 && (
                                        <div className="flex gap-2 mb-2 p-2 bg-primary-50 rounded-lg overflow-x-auto">
                                            {pendingAttachments.map((att, i) => (
                                                <div key={i} className="text-[10px] bg-white px-2 py-1 rounded border flex items-center whitespace-nowrap">
                                                    <Paperclip className="w-3 h-3 mr-1" />
                                                    <span className="truncate max-w-[80px]">{att.name || att.fileName || 'file'}</span>
                                                    <button onClick={() => setPendingAttachments(pendingAttachments.filter((_, idx) => idx !== i))} className="ml-1 text-error-500 font-bold">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {isUploading && (
                                        <div className="mb-2 p-2 bg-primary-50 rounded-lg text-xs text-primary-600 flex items-center">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600 mr-2"></div>
                                            Uploading file...
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className={`p-2 rounded-full transition ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-neutral-100'}`}
                                        >
                                            <Paperclip className="w-5 h-5 text-neutral-600" />
                                        </button>
                                        <button className="p-2 hover:bg-neutral-100 rounded-full transition">
                                            <Smile className="w-5 h-5 text-neutral-600" />
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleTyping();
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && !isUploading && handleSendMessage()}
                                            className="flex-1 px-4 py-2 border border-neutral-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSendMessage}
                                            disabled={(!newMessage.trim() && pendingAttachments.length === 0) || isUploading}
                                            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-neutral-400">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                                        <Send className="w-10 h-10 text-neutral-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-600 mb-2">Your Messages</h3>
                                    <p className="text-sm">Select a conversation to start messaging</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}