import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/admin/security';
const config = { withCredentials: true };

// ─── THUNKS ───
export const fetchSecurityOverview = createAsyncThunk('security/fetchOverview', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/overview`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch security overview');
    }
});

export const fetchAuditLogs = createAsyncThunk('security/fetchLogs', async (params: {
    search?: string;
    action?: string;
    category?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/logs`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch audit logs');
    }
});

export const exportAuditLogs = createAsyncThunk('security/exportLogs', async (params: {
    format: 'csv' | 'json';
    startDate?: string;
    endDate?: string;
    action?: string;
    category?: string;
}, { rejectWithValue }) => {
    try {
        if (params.format === 'csv') {
            const res = await axios.get(`${BASE_URL}/export`, {
                ...config,
                params,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { format: 'csv', success: true };
        } else {
            const res = await axios.get(`${BASE_URL}/export`, { ...config, params: { ...params, format: 'json' } });
            const dataStr = JSON.stringify(res.data.data, null, 2);
            const url = window.URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${Date.now()}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { format: 'json', success: true };
        }
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to export logs');
    }
});

// ─── STATE ───
interface SecurityState {
    overview: {
        totalLogs: number;
        failedLogins: number;
        blockedAttacks: number;
        activeUsers: number;
        recentCritical: number;
        logsByCategory: any[];
        logsByDay: any[];
    } | null;
    logs: {
        logs: any[];
        total: number;
        page: number;
        totalPages: number;
    } | null;
    loading: boolean;
    exportLoading: boolean;
    error: string | null;
}

const initialState: SecurityState = {
    overview: null,
    logs: null,
    loading: false,
    exportLoading: false,
    error: null,
};

const securitySlice = createSlice({
    name: 'security',
    initialState,
    reducers: {
        clearSecurityError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            // Overview
            .addCase(fetchSecurityOverview.pending, (state) => { state.loading = true; })
            .addCase(fetchSecurityOverview.fulfilled, (state, action) => { state.loading = false; state.overview = action.payload; })
            .addCase(fetchSecurityOverview.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            // Logs
            .addCase(fetchAuditLogs.pending, (state) => { state.loading = true; })
            .addCase(fetchAuditLogs.fulfilled, (state, action) => { state.loading = false; state.logs = action.payload; })
            .addCase(fetchAuditLogs.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            // Export
            .addCase(exportAuditLogs.pending, (state) => { state.exportLoading = true; })
            .addCase(exportAuditLogs.fulfilled, (state) => { state.exportLoading = false; })
            .addCase(exportAuditLogs.rejected, (state, action) => { state.exportLoading = false; state.error = action.payload as string; });
    },
});

export const { clearSecurityError } = securitySlice.actions;
export default securitySlice.reducer;
