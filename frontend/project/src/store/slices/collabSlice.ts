import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/collaboration';

export const startWorkSession = createAsyncThunk('collab/startSession', async (data: { swapRequestId: number, description?: string }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/sessions/start`, data, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to start work session');
    }
});

export const endWorkSession = createAsyncThunk('collab/endSession', async (sessionId: number, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/sessions/${sessionId}/end`, {}, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to end work session');
    }
});

export const fetchWorkSessions = createAsyncThunk('collab/fetchSessions', async (swapRequestId: number, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${BASE_URL}/sessions/${swapRequestId}`, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch work sessions');
    }
});

export const submitReport = createAsyncThunk('collab/submitReport', async (data: { swapRequestId: number, type: 'DAILY' | 'WEEKLY', content: string, completionPercentage?: number, attachments?: any[] }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/reports`, data, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to submit report');
    }
});

export const fetchReports = createAsyncThunk('collab/fetchReports', async (swapRequestId: number, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${BASE_URL}/reports/${swapRequestId}`, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
});

const collabSlice = createSlice({
    name: 'collaboration',
    initialState: {
        activeSession: null as any,
        sessions: [],
        reports: [],
        loading: false,
        error: null as string | null,
    },
    reducers: {
        clearCollabError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(startWorkSession.pending, (state) => { state.loading = true; })
            .addCase(startWorkSession.fulfilled, (state, action) => {
                state.loading = false;
                state.activeSession = action.payload;
                state.sessions.unshift(action.payload as never);
            })
            .addCase(endWorkSession.fulfilled, (state, action) => {
                state.activeSession = null;
                const index = state.sessions.findIndex((s: any) => s.id === action.payload.id);
                if (index !== -1) state.sessions[index] = action.payload as never;
            })
            .addCase(fetchWorkSessions.fulfilled, (state, action) => {
                state.sessions = action.payload;
                state.activeSession = action.payload.find((s: any) => !s.endTime) || null;
            })
            .addCase(fetchReports.fulfilled, (state, action) => {
                state.reports = action.payload;
            })
            .addCase(submitReport.fulfilled, (state, action) => {
                state.reports.unshift(action.payload as never);
            });
    }
});

export const { clearCollabError } = collabSlice.actions;
export default collabSlice.reducer;
