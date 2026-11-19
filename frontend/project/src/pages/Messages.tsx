import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CheckCheck, Paperclip, Phone, Search, Send, Video, X } from 'lucide-react';
import { RootState, AppDispatch } from '../store/store';
import {
    updateConversation, setSelectedConversationId, fetchMessages, sendMessage,
    fetchConversations, uploadFile, setConversations, clearUnreadMessages, Conversation, Message,
} from '../store/slices/chatSlice';
import { initiateCall } from '../store/slices/callSlice';
import { socket } from '../services/socket';
import { toast } from '../lib/toast';

const initials = (name?: string) =>
    (name || 'U').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

function Avatar({ name, url, online, size = 'md' }: { name?: string; url?: string; online?: boolean; size?: 'sm' | 'md' }) {
    const box = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';
    return (
        <span className="relative inline-flex shrink-0">
            {url ? (
                <img src={url} alt="" className={`${box} rounded-full object-cover`} />
            ) : (
                <span className={`${box} flex items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700`}>{initials(name)}</span>
            )}
            {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-success-500" aria-label="Online" />}
        </span>
    );
}

// "Today", "Yesterday", or a date, for separators between days.
function dayLabel(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Messages() {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const navigate = useNavigate();
    const { conversations, messages, selectedConversationId, loading } = useSelector((state: RootState) => state.chat);
    const { onlineUsers, callState } = useSelector((state: RootState) => state.call);
    const { user } = useSelector((state: RootState) => state.auth);
    const myId = Number(user?.id || 0);

    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [remoteIsTyping, setRemoteIsTyping] = useState(false);
    const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [listLoaded, setListLoaded] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const handledStartRef = useRef<string | null>(null);

    // Never list a conversation with yourself.
    const myConversations = useMemo(
        () => conversations.filter((c) => Number(c.userId) !== myId),
        [conversations, myId],
    );
    const selected = useMemo(
        () => myConversations.find((c) => c.id === selectedConversationId) || null,
        [myConversations, selectedConversationId],
    );
    const partnerId = selected ? Number(selected.userId) : null;
    const partnerOnline = partnerId !== null && onlineUsers.map(Number).includes(partnerId);
    const firstName = selected?.userName?.split(' ')[0] || '';
    const isDraft = !!selected?.id.startsWith('new-');

    // Only show messages that belong to the open conversation.
    const thread = useMemo(() => {
        if (partnerId === null) return [];
        return messages.filter(
            (m) =>
                (Number(m.senderId) === myId && Number(m.receiverId) === partnerId) ||
                (Number(m.senderId) === partnerId && Number(m.receiverId) === myId),
        );
    }, [messages, myId, partnerId]);

    // ---------- loading ----------
    useEffect(() => {
        dispatch(fetchConversations()).finally(() => setListLoaded(true));
        dispatch(clearUnreadMessages());
    }, [dispatch]);

    useEffect(() => {
        if (partnerId !== null && myId && !isDraft) {
            dispatch(fetchMessages({ userId1: myId, userId2: partnerId }));
        }
        setRemoteIsTyping(false);
        setPendingAttachments([]);
    }, [dispatch, partnerId, myId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, [thread.length, remoteIsTyping, partnerId]);

    // ---------- "Message" buttons elsewhere open a chat here, once ----------
    useEffect(() => {
        const partner = (location.state as any)?.startChatWith;
        if (!partner || !listLoaded) return;
        const key = String(partner.id);
        if (handledStartRef.current === key) return;
        handledStartRef.current = key;
        navigate(location.pathname, { replace: true, state: null });

        const id = Number(partner.id);
        if (!id || id === myId) {
            toast.info("You can't message yourself. Pick someone else.");
            return;
        }
        const existing = conversations.find((c) => Number(c.userId) === id);
        if (existing) {
            dispatch(setSelectedConversationId(existing.id));
            return;
        }
        const draft: Conversation = {
            id: `new-${id}`,
            userId: id,
            userName: partner.name || 'New conversation',
            userAvatar: partner.avatarUrl,
            lastMessage: 'No messages yet',
            lastMessageTime: '',
            unreadCount: 0,
            isOnline: false,
        };
        dispatch(setConversations([draft, ...conversations]));
        dispatch(setSelectedConversationId(draft.id));
    }, [location.state, listLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    // ---------- realtime: typing + keeping the list fresh ----------
    useEffect(() => {
        const onTyping = ({ userId, isTyping }: { userId: number; isTyping: boolean }) => {
            if (partnerId !== null && Number(userId) === partnerId) setRemoteIsTyping(isTyping);
        };
        const onReceive = (msg: any) => {
            const from = Number(msg.senderId);
            const conv = conversations.find((c) => Number(c.userId) === from);
            if (!conv) {
                dispatch(fetchConversations());
                return;
            }
            dispatch(updateConversation({
                ...conv,
                lastMessage: msg.messageText || msg.content || 'Sent a file',
                lastMessageTime: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unreadCount: conv.id === selectedConversationId ? 0 : (conv.unreadCount || 0) + 1,
            }));
            if (from === partnerId) setRemoteIsTyping(false);
        };
        socket.on('user-typing', onTyping);
        socket.on('receive_message', onReceive);
        return () => {
            socket.off('user-typing', onTyping);
            socket.off('receive_message', onReceive);
        };
    }, [partnerId, conversations, selectedConversationId, dispatch]);

    // ---------- actions ----------
    const openConversation = (conv: Conversation) => {
        dispatch(setSelectedConversationId(conv.id));
        if (conv.unreadCount) dispatch(updateConversation({ ...conv, unreadCount: 0 }));
    };

    const stopTyping = useCallback(() => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current && partnerId !== null) {
            socket.emit('typing-stop', { senderId: myId, receiverId: partnerId });
        }
        isTypingRef.current = false;
    }, [myId, partnerId]);

    const handleTyping = () => {
        if (partnerId === null) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socket.emit('typing-start', { senderId: myId, receiverId: partnerId });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    };

    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!file || !selected) return;
        setIsUploading(true);
        try {
            const result = await dispatch(uploadFile(file)).unwrap();
            setPendingAttachments((prev) => [...prev, result]);
        } catch {
            toast.error('The file could not be uploaded. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSend = async () => {
        if (!selected || partnerId === null || isSending || isUploading) return;
        const text = newMessage.trim();
        if (!text && pendingAttachments.length === 0) return;
        if (partnerId === myId) {
            toast.info("You can't message yourself.");
            return;
        }

        stopTyping();
        setIsSending(true);
        const attachments = pendingAttachments;
        setNewMessage('');
        setPendingAttachments([]);
        requestAnimationFrame(autoGrow);

        try {
            await dispatch(sendMessage({ senderId: myId, receiverId: partnerId, content: text, attachments })).unwrap();
            if (isDraft) {
                // First message: swap the draft for the real conversation from the server.
                await dispatch(fetchConversations());
                dispatch(setSelectedConversationId(String(partnerId)));
            } else {
                dispatch(updateConversation({
                    ...selected,
                    lastMessage: text || `${attachments.length} file${attachments.length === 1 ? '' : 's'}`,
                    lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }));
            }
        } catch (err: any) {
            // Give the text back so nothing is lost.
            setNewMessage(text);
            setPendingAttachments(attachments);
            requestAnimationFrame(autoGrow);
            toast.error(typeof err === 'string' ? err : 'Your message was not sent. Please try again.');
        } finally {
            setIsSending(false);
            textareaRef.current?.focus();
        }
    };

    const startCall = (callType: 'audio' | 'video') => {
        if (!selected || partnerId === null) return;
        if (!partnerOnline) {
            toast.info(`${firstName} is offline. You can call when they're online, or leave a message.`);
            return;
        }
        dispatch(initiateCall({
            remoteUser: { id: partnerId, name: selected.userName, avatarUrl: selected.userAvatar },
            callType,
        }));
    };

    const visibleConversations = myConversations.filter((c) =>
        (c.userName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()),
    );

    // ---------- render ----------
    return (
        <div className="-mx-4 -mt-6 sm:mx-0 sm:mt-0">
            <div className="grid h-[calc(100dvh-8.5rem)] overflow-hidden border-neutral-200 bg-white sm:rounded-lg sm:border md:h-[calc(100dvh-7.5rem)] md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]">
                {/* ---------- Conversation list ---------- */}
                <aside className={`min-h-0 flex-col border-neutral-200 md:flex md:border-r ${selected ? 'hidden' : 'flex'}`} aria-label="Conversations">
                    <div className="border-b border-neutral-200 p-4">
                        <h1 className="text-lg font-semibold text-neutral-900">Messages</h1>
                        <label className="mt-3 flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                            <Search className="h-4 w-4 text-neutral-400" aria-hidden />
                            <span className="sr-only">Search conversations</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name"
                                className="w-full bg-transparent text-sm focus:outline-none"
                            />
                        </label>
                    </div>

                    <ul className="min-h-0 flex-1 overflow-y-auto">
                        {!listLoaded && Array.from({ length: 5 }).map((_, i) => (
                            <li key={i} className="flex items-center gap-3 px-4 py-3">
                                <span className="h-11 w-11 rounded-full skeleton" />
                                <span className="flex-1 space-y-2"><span className="block h-3 w-1/2 rounded skeleton" /><span className="block h-3 w-3/4 rounded skeleton" /></span>
                            </li>
                        ))}

                        {listLoaded && visibleConversations.map((conv) => {
                            const active = selected?.id === conv.id;
                            const online = onlineUsers.map(Number).includes(Number(conv.userId));
                            return (
                                <li key={conv.id}>
                                    <button
                                        onClick={() => openConversation(conv)}
                                        aria-current={active ? 'true' : undefined}
                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-primary-50' : 'hover:bg-neutral-50'}`}
                                    >
                                        <Avatar name={conv.userName} url={conv.userAvatar} online={online} />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className={`truncate text-sm text-neutral-900 ${conv.unreadCount ? 'font-semibold' : 'font-medium'}`}>{conv.userName}</span>
                                                {conv.lastMessageTime && <span className="shrink-0 text-xs text-neutral-500">{conv.lastMessageTime}</span>}
                                            </span>
                                            <span className="mt-0.5 flex items-center justify-between gap-2">
                                                <span className={`truncate text-sm ${conv.unreadCount ? 'text-neutral-900' : 'text-neutral-500'}`}>{conv.lastMessage}</span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}

                        {listLoaded && visibleConversations.length === 0 && (
                            <li className="px-6 py-12 text-center">
                                {searchQuery ? (
                                    <p className="text-sm text-neutral-600">No conversations with “{searchQuery}”.</p>
                                ) : (
                                    <>
                                        <p className="font-medium text-neutral-900">No conversations yet</p>
                                        <p className="mt-1 text-sm text-neutral-600">Open someone's listing or profile and press Message to start one.</p>
                                        <Link to="/marketplace" className="mt-4 inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                                            Find skills
                                        </Link>
                                    </>
                                )}
                            </li>
                        )}
                    </ul>
                </aside>

                {/* ---------- Chat ---------- */}
                {selected ? (
                    <section className="flex min-h-0 flex-col" aria-label={`Conversation with ${selected.userName}`}>
                        <header className="flex items-center gap-2 border-b border-neutral-200 px-2 py-2.5 sm:gap-3 sm:px-4">
                            <button
                                onClick={() => dispatch(setSelectedConversationId(null))}
                                className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100 md:hidden"
                                aria-label="Back to conversations"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <Link to={`/profile/${selected.userId}`} className="flex min-w-0 flex-1 items-center gap-3">
                                <Avatar name={selected.userName} url={selected.userAvatar} online={partnerOnline} size="sm" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-neutral-900 hover:underline">{selected.userName}</span>
                                    <span className="block text-xs text-neutral-500">
                                        {remoteIsTyping ? 'Typing…' : partnerOnline ? 'Online' : 'Offline'}
                                    </span>
                                </span>
                            </Link>
                            <div className="flex items-center">
                                <button
                                    onClick={() => startCall('audio')}
                                    disabled={callState !== 'idle'}
                                    className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"
                                    aria-label={`Audio call ${firstName}`}
                                    title={partnerOnline ? 'Audio call' : `${firstName} is offline`}
                                >
                                    <Phone className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => startCall('video')}
                                    disabled={callState !== 'idle'}
                                    className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"
                                    aria-label={`Video call ${firstName}`}
                                    title={partnerOnline ? 'Video call' : `${firstName} is offline`}
                                >
                                    <Video className="h-5 w-5" />
                                </button>
                            </div>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50 px-3 py-4 sm:px-6" aria-live="polite">
                            {loading && thread.length === 0 && !isDraft ? (
                                <p className="mt-8 text-center text-sm text-neutral-500">Loading messages…</p>
                            ) : thread.length === 0 ? (
                                <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
                                    <Avatar name={selected.userName} url={selected.userAvatar} />
                                    <p className="mt-3 font-medium text-neutral-900">Start your conversation with {firstName}</p>
                                    <p className="mt-1 text-sm text-neutral-600">Say hello, mention the skill you're interested in, and suggest when you could meet.</p>
                                </div>
                            ) : (
                                <ol>
                                    {thread.map((m: Message, i) => {
                                        const mine = Number(m.senderId) === myId;
                                        const prev = thread[i - 1];
                                        const next = thread[i + 1];
                                        const day = dayLabel(m.createdAt);
                                        const newDay = !!day && day !== dayLabel(prev?.createdAt);
                                        const lastInGroup = !next || Number(next.senderId) !== Number(m.senderId) || dayLabel(next.createdAt) !== day;
                                        return (
                                            <li key={m.id}>
                                                {newDay && (
                                                    <div className="my-4 flex items-center gap-3 text-xs text-neutral-500">
                                                        <span className="h-px flex-1 bg-neutral-200" />{day}<span className="h-px flex-1 bg-neutral-200" />
                                                    </div>
                                                )}
                                                <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${lastInGroup ? 'mb-3' : 'mb-1'}`}>
                                                    <div className={`flex max-w-[85%] flex-col sm:max-w-[65%] ${mine ? 'items-end' : 'items-start'}`}>
                                                        <div
                                                            className={`rounded-2xl px-3.5 py-2 text-sm ${
                                                                mine
                                                                    ? `bg-primary-600 text-white ${lastInGroup ? 'rounded-br-md' : ''}`
                                                                    : `border border-neutral-200 bg-white text-neutral-900 ${lastInGroup ? 'rounded-bl-md' : ''}`
                                                            }`}
                                                        >
                                                            {m.attachments?.map((att: any, ai: number) => (
                                                                <a
                                                                    key={att.id ?? ai}
                                                                    href={att.fileUrl || att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:underline ${mine ? 'bg-white/15' : 'bg-neutral-100'}`}
                                                                >
                                                                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                                                    <span className="truncate">{att.fileName || att.name || 'Attachment'}</span>
                                                                </a>
                                                            ))}
                                                            {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                                                        </div>
                                                        {lastInGroup && (
                                                            <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-neutral-500">
                                                                {m.timestamp}
                                                                {mine && (m.isRead
                                                                    ? <CheckCheck className="h-3.5 w-3.5 text-primary-600" aria-label="Read" />
                                                                    : <Check className="h-3.5 w-3.5" aria-label="Sent" />)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                            {remoteIsTyping && <p className="mt-2 text-xs text-neutral-500">{firstName} is typing…</p>}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="border-t border-neutral-200 bg-white p-2 sm:p-3">
                            {(pendingAttachments.length > 0 || isUploading) && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                    {pendingAttachments.map((att, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 py-1 pl-2 pr-1 text-xs text-neutral-700">
                                            <Paperclip className="h-3 w-3" />
                                            <span className="max-w-[140px] truncate">{att.name || att.fileName || 'File'}</span>
                                            <button
                                                type="button"
                                                onClick={() => setPendingAttachments(pendingAttachments.filter((_, idx) => idx !== i))}
                                                className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200"
                                                aria-label="Remove file"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                    {isUploading && <span className="self-center text-xs text-neutral-500">Uploading…</span>}
                                </div>
                            )}
                            <div className="flex items-end gap-1.5 sm:gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="rounded-md p-2.5 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
                                    aria-label="Attach a file"
                                    title="Attach a file"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={newMessage}
                                    onChange={(e) => { setNewMessage(e.target.value); autoGrow(); handleTyping(); }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    placeholder={`Message ${firstName}`}
                                    aria-label={`Message ${firstName}`}
                                    className="max-h-[140px] min-h-[42px] min-w-0 flex-1 resize-none rounded-md border border-neutral-300 px-3 py-2.5 text-sm leading-5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                />
                                <button
                                    type="submit"
                                    disabled={isSending || isUploading || (!newMessage.trim() && pendingAttachments.length === 0)}
                                    className="rounded-md bg-primary-600 p-2.5 text-white hover:bg-primary-700 disabled:opacity-40"
                                    aria-label="Send message"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="mt-1.5 hidden text-[11px] text-neutral-400 sm:block">Enter to send · Shift + Enter for a new line</p>
                        </form>
                    </section>
                ) : (
                    <div className="hidden flex-col items-center justify-center p-8 text-center md:flex">
                        <p className="font-medium text-neutral-900">Select a conversation</p>
                        <p className="mt-1 max-w-xs text-sm text-neutral-600">
                            Pick someone on the left to read and reply. You can also call people from here when they're online.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
