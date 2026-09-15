import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Message {
    id: string;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
    isSent: boolean;
    attachments?: Attachment[];
}

export interface Attachment {
    id: number;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

export interface Conversation {
    id: string;
    userId: number;
    userName: string;
    userAvatar?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isOnline: boolean;
}

interface ChatState {
    messages: Message[];
    conversations: Conversation[];
    selectedConversationId: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: ChatState = {
    messages: [],

    conversations: [],
    selectedConversationId: null,
    loading: false,
    error: null,
};

// Async Thunks
export const fetchMessages = createAsyncThunk(
    'chat/fetchMessages',
    async ({ userId1, userId2 }: { userId1: number; userId2: number }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/message/between/${userId1}/${userId2}`, {
                withCredentials: true
            });
            // Normalized response from backend now comes in .data.data
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async (messageData: { senderId: number; receiverId: number; content: string; attachments?: any[] }, { rejectWithValue }) => {
        try {
            const response = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/message/send', {
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                messageText: messageData.content,
                attachments: messageData.attachments
            }, {
                withCredentials: true
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to send message');
        }
    }
);

export const uploadFile = createAsyncThunk(
    'chat/uploadFile',
    async (file: File, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
        }
    }
);

export const fetchConversations = createAsyncThunk(
    'chat/fetchConversations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/message/conversations', {
                withCredentials: true
            });
            return response.data; // Assuming { success: true, data: Conversation[] }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
        }
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
        },
        updateConversation: (state, action: PayloadAction<Conversation>) => {
            const index = state.conversations.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.conversations[index] = action.payload;
            }
        },
        setSelectedConversationId: (state, action: PayloadAction<string | null>) => {
            state.selectedConversationId = action.payload;
            state.messages = []; // Clear messages when switching conversations to avoid flickering
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Messages
            .addCase(fetchMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                // Standardize: backend now returns data in action.payload.data
                const rawMessages = Array.isArray(action.payload) ? action.payload : (action.payload.data || []);
                state.messages = rawMessages.map((msg: any) => ({
                    ...msg,
                    id: msg.id.toString(),
                    senderId: Number(msg.senderId),
                    receiverId: Number(msg.receiverId),
                    content: msg.content || msg.messageText || '',
                    timestamp: msg.timestamp || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isSent: true,
                    attachments: msg.attachments || []
                }));
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Send Message
            .addCase(sendMessage.pending, () => {
                // Optimistic update could happen here or in component
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                // If the socket also sends the message back, we might get duplicates if we add here AND listen to socket.
                // Usually, the sender adds optimistically or waits for success.
                // If the socket broadcasts to sender too, we need to handle deduping.
                // For now, let's assume we rely on the socket for the "receive" part or add it here if socket doesn't echo back to sender.
                // But typically, `sendMessage` response confirms it's saved.
                // Let's add it if it's not already there (by ID).
                const rawMsg = action.payload.data || action.payload;
                if (rawMsg) {
                    const newMessage = {
                        ...rawMsg,
                        id: rawMsg.id.toString(),
                        content: rawMsg.content || rawMsg.messageText || '',
                        timestamp: rawMsg.timestamp || (rawMsg.createdAt ? new Date(rawMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
                        isSent: true
                    };
                    if (!state.messages.find(m => m.id === newMessage.id)) {
                        state.messages.push(newMessage);
                    }
                }
            })

            .addCase(sendMessage.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Fetch Conversations
            .addCase(fetchConversations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = Array.isArray(action.payload) ? action.payload : (action.payload.data || []);
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setMessages,
    addMessage,
    setConversations,
    updateConversation,
    setSelectedConversationId,
    setLoading,
    setError
} = chatSlice.actions;

export default chatSlice.reducer;
