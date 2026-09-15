import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/swaps';

export const fetchReceivedSwaps = createAsyncThunk('swaps/fetchReceived', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${BASE_URL}/received`, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch received swaps');
    }
});

export const fetchSentSwaps = createAsyncThunk('swaps/fetchSent', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${BASE_URL}/sent`, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch sent swaps');
    }
});

export const createSwapRequest = createAsyncThunk('swaps/create', async (data: {
    skillId: number;
    message: string;
    offeredSkill: string;
    requestedSkill: string;
    preferredTimeSlots: string[]
}, { rejectWithValue }) => {
    try {
        const response = await axios.post(BASE_URL, data, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to send swap request');
    }
});

export const respondToSwap = createAsyncThunk('swaps/respond', async ({ id, status, rejectionReason, scheduledAt, duration }: {
    id: number;
    status: string;
    rejectionReason?: string;
    scheduledAt?: string;
    duration?: number;
}, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/${id}/respond`, { status, rejectionReason, scheduledAt, duration }, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to respond to swap request');
    }
});

export const rescheduleSwap = createAsyncThunk('swaps/reschedule', async ({ id, proposedTimeSlot, message, meetingAgenda }: {
    id: number;
    proposedTimeSlot: any;
    message?: string;
    meetingAgenda?: string;
}, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/${id}/reschedule`, { proposedTimeSlot, message, meetingAgenda }, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to propose reschedule');
    }
});

export const completeSwap = createAsyncThunk('swaps/complete', async (id: number, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/${id}/complete`, {}, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to complete swap');
    }
});

export const submitRating = createAsyncThunk('swaps/submitRating', async (data: {
    swapRequestId: number;
    rating: number;
    feedback?: string;
}, { rejectWithValue }) => {
    try {
        const response = await axios.post('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/ratings', data, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to submit rating');
    }
});

export const requestMoreInfo = createAsyncThunk('swaps/requestInfo', async ({ id, message }: { id: number; message?: string }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/${id}/request-info`, { message }, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to request more info');
    }
});

const swapsSlice = createSlice({
    name: 'swaps',
    initialState: {
        sent: [] as any[],
        received: [] as any[],
        loading: false,
        error: null as string | null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchReceivedSwaps.fulfilled, (state, action) => {
                state.received = action.payload;
            })
            .addCase(fetchSentSwaps.fulfilled, (state, action) => {
                state.sent = action.payload;
            })
            .addCase(createSwapRequest.fulfilled, (state, action) => {
                state.sent.unshift(action.payload as never);
            })
            .addMatcher(
                (action) => [respondToSwap.fulfilled.type, rescheduleSwap.fulfilled.type, completeSwap.fulfilled.type, requestMoreInfo.fulfilled.type].includes(action.type),
                (state, actionWithPayload: PayloadAction<any>) => {
                    const receivedIndex = state.received.findIndex((s: any) => s.id === actionWithPayload.payload.id);
                    if (receivedIndex !== -1) {
                        state.received[receivedIndex] = actionWithPayload.payload as never;
                    }
                    const sentIndex = state.sent.findIndex((s: any) => s.id === actionWithPayload.payload.id);
                    if (sentIndex !== -1) {
                        state.sent[sentIndex] = actionWithPayload.payload as never;
                    }
                }
            );
    },
});

export default swapsSlice.reducer;
