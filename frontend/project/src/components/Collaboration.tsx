import { useEffect, useState, useRef, useMemo } from 'react';
import { socket } from '../services/socket';
import { Send, User, Paperclip, FileText, Download, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchMessages } from '../store/slices/chatSlice';
import axios from 'axios';

interface CollaborationProps {
    partnerId: number;
    partnerName?: string;
    swapRequestId?: number;
}

export default function Collaboration({ partnerId, partnerName }: CollaborationProps) {
    const dispatch = useDispatch<AppDispatch>();
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const allMessages = useSelector((state: RootState) => state.chat.messages);
    const messages = useMemo(() =>
        allMessages.filter(
            msg => (Number(msg.senderId) === Number(currentUser?.id) && Number(msg.receiverId) === Number(partnerId)) ||
                (Number(msg.senderId) === Number(partnerId) && Number(msg.receiverId) === Number(currentUser?.id))
        ),
        [allMessages, currentUser?.id, partnerId]);

    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [activeAttachments, setActiveAttachments] = useState<any[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (partnerId && currentUser?.id) {
            dispatch(fetchMessages({ userId1: Number(currentUser.id), userId2: Number(partnerId) }));
        }
    }, [partnerId, currentUser?.id, dispatch]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && activeAttachments.length === 0) || !currentUser) return;

        const messageData = {
            senderId: Number(currentUser.id),
            receiverId: Number(partnerId),
            messageText: newMessage,
            attachments: activeAttachments
        };

        socket.emit("send_message", messageData);
        setNewMessage('');
        setActiveAttachments([]);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setActiveAttachments(prev => [...prev, {
                name: file.name,
                url: response.data.data.fileUrl,
                type: response.data.data.fileType,
                size: response.data.data.fileSize
            }]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-primary-100">
                        {partnerName?.charAt(0) || <User className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900">{partnerName || 'Collaboration Room'}</h3>
                        <p className="text-xs text-success-500 font-medium flex items-center">
                            <span className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse" />
                            Live Session Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex ${Number(msg.senderId) === Number(currentUser?.id) ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${Number(msg.senderId) === Number(currentUser?.id) ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-900'
                            }`}>
                            <p className="text-sm font-medium">{msg.content}</p>

                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {msg.attachments.map((att: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={att.fileUrl || att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center p-2 rounded-lg text-xs hover:opacity-80 transition-opacity ${Number(msg.senderId) === Number(currentUser?.id) ? 'bg-white/10' : 'bg-white border border-neutral-100'
                                                }`}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            <span className="truncate flex-grow">{att.fileName || att.name}</span>
                                            <Download className="w-3.5 h-3.5 ml-2" />
                                        </a>
                                    ))}
                                </div>
                            )}

                            <span className={`text-[10px] mt-2 block ${Number(msg.senderId) === Number(currentUser?.id) ? 'text-primary-100' : 'text-neutral-400'}`}>
                                {msg.timestamp || 'Recently'}
                            </span>
                        </div>
                    </motion.div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-neutral-100 bg-neutral-50/50">
                {activeAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {activeAttachments.map((f, i) => (
                            <div key={i} className="flex items-center bg-primary-50 border border-primary-100 px-2 py-1 rounded text-xs text-primary-700">
                                <span className="max-w-[100px] truncate">{f.name}</span>
                                <X className="w-3 h-3 ml-2 cursor-pointer" onClick={() => setActiveAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-primary-600 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isUploading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                        ) : (
                            <Paperclip className="w-5 h-5" />
                        )}
                    </button>

                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Say something collaborative..."
                        className="flex-grow p-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none shadow-sm transition-all"
                    />

                    <button
                        type="submit"
                        disabled={!newMessage.trim() && activeAttachments.length === 0}
                        className="p-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
