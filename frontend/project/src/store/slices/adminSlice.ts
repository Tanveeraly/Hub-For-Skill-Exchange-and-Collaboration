import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/admin';
const config = { withCredentials: true };

// ─── THUNKS ───
export const fetchAdminOverview = createAsyncThunk('admin/fetchOverview', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/overview`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch overview');
    }
});

export const fetchAdminUsers = createAsyncThunk('admin/fetchUsers', async (params: { search?: string; status?: string; page?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/users`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
    }
});

export const suspendUserAdmin = createAsyncThunk('admin/suspendUser', async (userId: number, { rejectWithValue }) => {
    try {
        const res = await axios.patch(`${BASE_URL}/users/${userId}/suspend`, {}, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to suspend user');
    }
});

export const deleteUserAdmin = createAsyncThunk('admin/deleteUser', async (userId: number, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/users/${userId}`, config);
        return userId;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete user');
    }
});

export const fetchAdminPortfolios = createAsyncThunk('admin/fetchPortfolios', async (params: { search?: string; page?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/portfolios`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch portfolios');
    }
});

export const deletePortfolioAdmin = createAsyncThunk('admin/deletePortfolio', async (portfolioId: number, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/portfolios/${portfolioId}`, config);
        return portfolioId;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete portfolio');
    }
});

export const fetchAdminCertifications = createAsyncThunk('admin/fetchCerts', async (params: { status?: string; page?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/certifications`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch certifications');
    }
});

export const verifyCertAdmin = createAsyncThunk('admin/verifyCert', async ({ certId, action }: { certId: number; action: string }, { rejectWithValue }) => {
    try {
        const res = await axios.patch(`${BASE_URL}/certifications/${certId}/verify`, { action }, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to verify cert');
    }
});

export const deleteCertAdmin = createAsyncThunk('admin/deleteCert', async (certId: number, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/certifications/${certId}`, config);
        return certId;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete cert');
    }
});

export const fetchAdminComplaints = createAsyncThunk('admin/fetchComplaints', async (params: { status?: string; page?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/complaints`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch complaints');
    }
});

export const resolveComplaintAdmin = createAsyncThunk('admin/resolveComplaint', async ({ complaintId, status }: { complaintId: number; status: string }, { rejectWithValue }) => {
    try {
        const res = await axios.patch(`${BASE_URL}/complaints/${complaintId}`, { status }, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to resolve complaint');
    }
});

export const submitComplaint = createAsyncThunk('admin/submitComplaint', async (data: { subject: string; description: string; targetId?: number; postId?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/complaints`, data, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to submit complaint');
    }
});

export const fetchAdminJobLogs = createAsyncThunk('admin/fetchJobLogs', async (params: { page?: number }, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/jobs`, { ...config, params });
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch job logs');
    }
});

export const deletePostAdmin = createAsyncThunk('admin/deletePostAdmin', async (postId: number, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/posts/${postId}`, config);
        return postId;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete post');
    }
});

// ─── STATE ───
interface AdminState {
    overview: any | null;
    users: { users: any[]; total: number; page: number; totalPages: number } | null;
    portfolios: { portfolios: any[]; total: number; page: number; totalPages: number } | null;
    certifications: { certifications: any[]; total: number; page: number; totalPages: number } | null;
    complaints: { complaints: any[]; total: number; page: number; totalPages: number } | null;
    jobLogs: { logs: any[]; total: number; page: number; totalPages: number } | null;
    loading: boolean;
    error: string | null;
}

const initialState: AdminState = {
    overview: null,
    users: null,
    portfolios: null,
    certifications: null,
    complaints: null,
    jobLogs: null,
    loading: false,
    error: null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearAdminError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            // Overview
            .addCase(fetchAdminOverview.pending, (state) => { state.loading = true; })
            .addCase(fetchAdminOverview.fulfilled, (state, action) => { state.loading = false; state.overview = action.payload; })
            .addCase(fetchAdminOverview.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            // Users
            .addCase(fetchAdminUsers.fulfilled, (state, action) => { state.users = action.payload; })
            .addCase(suspendUserAdmin.fulfilled, (state, action) => {
                if (state.users) {
                    state.users.users = state.users.users.map((u: any) =>
                        u.id === action.payload.id ? { ...u, status: action.payload.status } : u
                    );
                }
            })
            .addCase(deleteUserAdmin.fulfilled, (state, action) => {
                if (state.users) {
                    state.users.users = state.users.users.filter((u: any) => u.id !== action.payload);
                    state.users.total -= 1;
                }
            })
            // Portfolios
            .addCase(fetchAdminPortfolios.fulfilled, (state, action) => { state.portfolios = action.payload; })
            .addCase(deletePortfolioAdmin.fulfilled, (state, action) => {
                if (state.portfolios) {
                    state.portfolios.portfolios = state.portfolios.portfolios.filter((p: any) => p.id !== action.payload);
                    state.portfolios.total -= 1;
                }
            })
            // Certifications
            .addCase(fetchAdminCertifications.fulfilled, (state, action) => { state.certifications = action.payload; })
            .addCase(verifyCertAdmin.fulfilled, (state, action) => {
                if (state.certifications) {
                    state.certifications.certifications = state.certifications.certifications.map((c: any) =>
                        c.id === action.payload.id ? { ...c, verificationStatus: action.payload.verificationStatus, partnerVerified: action.payload.partnerVerified } : c
                    );
                }
            })
            .addCase(deleteCertAdmin.fulfilled, (state, action) => {
                if (state.certifications) {
                    state.certifications.certifications = state.certifications.certifications.filter((c: any) => c.id !== action.payload);
                    state.certifications.total -= 1;
                }
            })
            // Complaints
            .addCase(fetchAdminComplaints.fulfilled, (state, action) => { state.complaints = action.payload; })
            .addCase(resolveComplaintAdmin.fulfilled, (state, action) => {
                if (state.complaints) {
                    state.complaints.complaints = state.complaints.complaints.map((c: any) =>
                        c.id === action.payload.id ? { ...c, status: action.payload.status } : c
                    );
                }
            })
            // Job Logs
            .addCase(fetchAdminJobLogs.fulfilled, (state, action) => { state.jobLogs = action.payload; });
    },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
