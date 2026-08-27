import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/connections';

export interface Connection {
    id: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    senderId: number;
    receiverId: number;
    sender?: {
        id: number;
        name: string;
        profile?: { avatarUrl: string };
    };
    receiver?: {
        id: number;
        name: string;
        profile?: { avatarUrl: string };
    };
}

interface ConnectionState {
    connections: any[]; // Users I am connected with
    pendingRequests: Connection[]; // Requests waiting for my acceptance
    sentRequests: Connection[]; // Requests I have sent
    loading: boolean;
    error: string | null;
}

const initialState: ConnectionState = {
    connections: [],
    pendingRequests: [],
    sentRequests: [],
    loading: false,
    error: null,
};

export const sendConnectionRequest = createAsyncThunk(
    'connections/sendRequest',
    async (receiverId: number, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/request`, { receiverId }, { withCredentials: true });
            return response.data;
        } catch (error: any) {
            console.error("Connection Request Error:", error.response?.data);
            return rejectWithValue(error.response?.data?.message || 'Failed to send request');
        }
    }
);

export const acceptConnectionRequest = createAsyncThunk(
    'connections/acceptRequest',
    async (connectionId: number, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/accept/${connectionId}`, {}, { withCredentials: true });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to accept request');
        }
    }
);

export const rejectConnectionRequest = createAsyncThunk(
    'connections/rejectRequest',
    async (connectionId: number, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${BASE_URL}/reject/${connectionId}`, {}, { withCredentials: true });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to reject request');
        }
    }
);

export const fetchPendingRequests = createAsyncThunk(
    'connections/fetchPendingRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BASE_URL}/pending`, { withCredentials: true });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending requests');
        }
    }
);

export const fetchConnections = createAsyncThunk(
    'connections/fetchConnections',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BASE_URL}/`, { withCredentials: true });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch connections');
        }
    }
);

export const fetchSentRequests = createAsyncThunk(
    'connections/fetchSentRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${BASE_URL}/sent`, { withCredentials: true });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch sent requests');
        }
    }
);

const connectionSlice = createSlice({
    name: 'connections',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Send Request
            .addCase(sendConnectionRequest.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            .addCase(sendConnectionRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Pending
            .addCase(fetchPendingRequests.fulfilled, (state, action) => {
                state.pendingRequests = action.payload;
            })
            .addCase(fetchConnections.fulfilled, (state, action) => {
                state.connections = action.payload;
            })
            // Fetch Sent Requests
            .addCase(fetchSentRequests.fulfilled, (state, action) => {
                state.sentRequests = action.payload;
            })
            // Send Request - Optimistic Update
            .addCase(sendConnectionRequest.fulfilled, (state, action) => {
                state.loading = false;
                // Add the new request to sentRequests so the UI updates immediately
                if (action.payload.data) {
                    state.sentRequests.push(action.payload.data);
                }
            })
            // Accept Request
            .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
                // Remove from pending
                const updatedConnection = action.payload.data;
                state.pendingRequests = state.pendingRequests.filter(req => req.id !== updatedConnection.id);
                // Add to connections (we might need to fetch user details or just re-fetch all connections)
                // For simplicity, let's re-fetch or just let the UI update on next load. 
                // Ideally we'd add the user to `connections` if the backend returned the user object, but it returns the connection object.
            })
            // Reject Request
            .addCase(rejectConnectionRequest.fulfilled, (state, action) => {
                const updatedConnection = action.payload.data;
                state.pendingRequests = state.pendingRequests.filter(req => req.id !== updatedConnection.id);
            });
    },
});

export default connectionSlice.reducer;
