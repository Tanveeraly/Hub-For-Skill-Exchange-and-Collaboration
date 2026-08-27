import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/disputes';
const config = { withCredentials: true };

// ─── USER THUNKS ───
export const fileDispute = createAsyncThunk('disputes/file', async (data: {
    swapRequestId: number;
    subject: string;
    description: string;
    category?: string;
    priority?: string;
    evidence?: any;
}, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/file`, data, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to file dispute');
    }
});

export const fetchMyDisputes = createAsyncThunk('disputes/fetchMy', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/my`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch disputes');
    }
});

export const escrowConfirm = createAsyncThunk('disputes/escrowConfirm', async (id: number, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/${id}/escrow-confirm`, {}, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to confirm');
    }
});

export const cancelSwapRequest = createAsyncThunk('disputes/cancelSwap', async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/${id}/cancel`, { reason }, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to cancel swap');
    }
});

export const setCancellationDeadline = createAsyncThunk('disputes/setDeadline', async ({ id, deadline }: { id: number; deadline: string }, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/${id}/deadline`, { deadline }, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to set deadline');
    }
});

// ─── ADMIN THUNKS ───
export const fetchAllDisputes = createAsyncThunk('disputes/fetchAll', async (params: { status?: string; priority?: string; page?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/admin/all`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch disputes');
    }
});

export const fetchDisputeStats = createAsyncThunk('disputes/fetchStats', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/admin/stats`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats');
    }
});

export const escalateDisputeAdmin = createAsyncThunk('disputes/escalate', async ({ disputeId, adminNotes, priority }: { disputeId: number; adminNotes?: string; priority?: string }, { rejectWithValue }) => {
    try {
        const res = await axios.patch(`${BASE_URL}/admin/${disputeId}/escalate`, { adminNotes, priority }, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to escalate');
    }
});

export const resolveDisputeAdmin = createAsyncThunk('disputes/resolve', async ({ disputeId, status, resolution, adminNotes }: {
    disputeId: number; status: string; resolution?: string; adminNotes?: string;
}, { rejectWithValue }) => {
    try {
        const res = await axios.patch(`${BASE_URL}/admin/${disputeId}/resolve`, { status, resolution, adminNotes }, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to resolve');
    }
});

// ─── STATE ───
interface DisputeState {
    myDisputes: any[];
    adminDisputes: { disputes: any[]; total: number; page: number; totalPages: number } | null;
    stats: { total: number; open: number; escalated: number; resolved: number; dismissed: number } | null;
    loading: boolean;
    error: string | null;
}

const initialState: DisputeState = {
    myDisputes: [],
    adminDisputes: null,
    stats: null,
    loading: false,
    error: null,
};

const disputeSlice = createSlice({
    name: 'disputes',
    initialState,
    reducers: {
        clearDisputeError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyDisputes.pending, (state) => { state.loading = true; })
            .addCase(fetchMyDisputes.fulfilled, (state, action) => { state.loading = false; state.myDisputes = action.payload; })
            .addCase(fetchMyDisputes.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            .addCase(fileDispute.fulfilled, (state, action) => { state.myDisputes.unshift(action.payload); })
            .addCase(fileDispute.rejected, (state, action) => { state.error = action.payload as string; })
            .addCase(fetchAllDisputes.fulfilled, (state, action) => { state.adminDisputes = action.payload; })
            .addCase(fetchDisputeStats.fulfilled, (state, action) => { state.stats = action.payload; })
            .addCase(escalateDisputeAdmin.fulfilled, (state, action) => {
                if (state.adminDisputes) {
                    state.adminDisputes.disputes = state.adminDisputes.disputes.map((d: any) =>
                        d.id === action.payload.id ? action.payload : d
                    );
                }
            })
            .addCase(resolveDisputeAdmin.fulfilled, (state, action) => {
                if (state.adminDisputes) {
                    state.adminDisputes.disputes = state.adminDisputes.disputes.map((d: any) =>
                        d.id === action.payload.id ? action.payload : d
                    );
                }
            })
            .addCase(escrowConfirm.rejected, (state, action) => { state.error = action.payload as string; })
            .addCase(cancelSwapRequest.rejected, (state, action) => { state.error = action.payload as string; });
    },
});

export const { clearDisputeError } = disputeSlice.actions;
export default disputeSlice.reducer;
