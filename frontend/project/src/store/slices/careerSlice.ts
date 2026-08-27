import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/career';
const config = { withCredentials: true };

export const fetchCareerProfile = createAsyncThunk('career/fetchProfile', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/profile`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch career profile');
    }
});

export const fetchResume = createAsyncThunk('career/fetchResume', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/resume`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to generate resume');
    }
});

export const fetchCertifications = createAsyncThunk('career/fetchCerts', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/certifications`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch certifications');
    }
});

export const fetchCareerAnalytics = createAsyncThunk('career/fetchAnalytics', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/analytics`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
    }
});

export const fetchLinkedInExport = createAsyncThunk('career/fetchLinkedIn', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/linkedin-export`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch LinkedIn export');
    }
});

export const fetchEndorsements = createAsyncThunk('career/fetchEndorsements', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/endorsements`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch endorsements');
    }
});

export const submitEndorsement = createAsyncThunk('career/submitEndorsement', async (data: {
    swapRequestId: number;
    skillName: string;
    message?: string;
}, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/endorsements`, data, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to submit endorsement');
    }
});

export const addExternalCertification = createAsyncThunk('career/addExternalCert', async (data: {
    skillName: string;
    provider?: string;
    credentialUrl?: string;
    hoursLogged?: number;
    certImage?: string;
    platformName?: string;
}, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/external-certification`, data, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to add certification');
    }
});

export const fetchRecommendations = createAsyncThunk('career/fetchRecommendations', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/recommendations`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch recommendations');
    }
});

interface CareerState {
    profile: any | null;
    resume: any | null;
    certifications: any[];
    analytics: any | null;
    linkedIn: any | null;
    endorsements: any | null;
    recommendations: any | null;
    loading: boolean;
    loadingRecommendations: boolean;
    error: string | null;
}

const initialState: CareerState = {
    profile: null,
    resume: null,
    certifications: [],
    analytics: null,
    linkedIn: null,
    endorsements: null,
    recommendations: null,
    loading: false,
    loadingRecommendations: false,
    error: null,
};

const careerSlice = createSlice({
    name: 'career',
    initialState,
    reducers: {
        clearCareerError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCareerProfile.pending, (state) => { state.loading = true; })
            .addCase(fetchCareerProfile.fulfilled, (state, action) => { state.loading = false; state.profile = action.payload; })
            .addCase(fetchCareerProfile.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

            .addCase(fetchResume.fulfilled, (state, action) => { state.resume = action.payload; })
            .addCase(fetchCertifications.fulfilled, (state, action) => { state.certifications = action.payload; })
            .addCase(fetchCareerAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; })
            .addCase(fetchLinkedInExport.fulfilled, (state, action) => { state.linkedIn = action.payload; })
            .addCase(fetchEndorsements.fulfilled, (state, action) => { state.endorsements = action.payload; })

            .addCase(submitEndorsement.fulfilled, (state, action) => {
                if (state.endorsements?.eligibleForEndorsement) {
                    state.endorsements.eligibleForEndorsement = state.endorsements.eligibleForEndorsement.filter(
                        (e: any) => e.swapId !== action.payload.swapRequestId
                    );
                }
            })

            .addCase(addExternalCertification.fulfilled, (state, action) => {
                state.certifications.unshift(action.payload);
            })

            .addCase(fetchRecommendations.pending, (state) => {
                state.loadingRecommendations = true;
            })
            .addCase(fetchRecommendations.fulfilled, (state, action) => {
                state.loadingRecommendations = false;
                state.recommendations = action.payload;
            })
            .addCase(fetchRecommendations.rejected, (state, action) => {
                state.loadingRecommendations = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCareerError } = careerSlice.actions;
export default careerSlice.reducer;
