
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/notifications';

export interface Notification {
    id: number;
    type: 'CONNECTION_REQUEST' | 'CONNECTION_ACCEPTED' | 'LIKE' | 'COMMENT' | 'SWAP_REQUEST' | 'SWAP_ACCEPTED' | 'SWAP_REJECTED' | 'SYSTEM';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        id: number;
        name: string;
        profile?: {
            avatarUrl: string;
        };
    };
}

interface NotificationState {
    items: Notification[];
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(BASE_URL, { withCredentials: true });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id: number, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/${id}/read`, {}, { withCredentials: true });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/read-all`, {}, { withCredentials: true });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
        }
    }
);

export const clearAllNotifications = createAsyncThunk(
    'notifications/clearAllNotifications',
    async (_, { rejectWithValue }) => {
        try {
            await axios.delete(`${BASE_URL}/clear-all`, { withCredentials: true });
            return;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to clear notifications');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.items.unshift(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const updated = action.payload;
                const index = state.items.findIndex((n) => n.id === updated.id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...updated };
                }
            })
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.items.forEach((n) => (n.isRead = true));
            })
            .addCase(clearAllNotifications.fulfilled, (state) => {
                state.items = [];
            });
    },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
