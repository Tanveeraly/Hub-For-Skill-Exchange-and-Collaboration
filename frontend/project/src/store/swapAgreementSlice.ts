import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface SwapAgreementState {
    hasAcceptedTerms: boolean;
    acceptedAt: string | null;
    showTermsModal: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: SwapAgreementState = {
    hasAcceptedTerms: false,
    acceptedAt: null,
    showTermsModal: false,
    loading: false,
    error: null
};

// Async thunk to fetch T&C acceptance status from backend
export const fetchTermsAcceptance = createAsyncThunk(
    'swapAgreement/fetchTermsAcceptance',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/terms/check', {
                withCredentials: true
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch terms acceptance status');
        }
    }
);

// Async thunk to accept T&C and save to backend
export const acceptTerms = createAsyncThunk(
    'swapAgreement/acceptTerms',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post(
                'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/terms/accept',
                {},
                { withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to accept terms');
        }
    }
);

const swapAgreementSlice = createSlice({
    name: 'swapAgreement',
    initialState,
    reducers: {
        setShowTermsModal: (state, action: PayloadAction<boolean>) => {
            state.showTermsModal = action.payload;
        },
        resetError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch terms acceptance status
            .addCase(fetchTermsAcceptance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTermsAcceptance.fulfilled, (state, action) => {
                state.loading = false;
                state.hasAcceptedTerms = action.payload.hasAccepted || false;
                state.acceptedAt = action.payload.acceptedAt || null;
            })
            .addCase(fetchTermsAcceptance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                // If endpoint doesn't exist yet, assume not accepted
                state.hasAcceptedTerms = false;
            })
            // Accept terms
            .addCase(acceptTerms.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(acceptTerms.fulfilled, (state, action) => {
                state.loading = false;
                state.hasAcceptedTerms = true;
                state.acceptedAt = action.payload.acceptedAt || new Date().toISOString();
                state.showTermsModal = false;
            })
            .addCase(acceptTerms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setShowTermsModal, resetError } = swapAgreementSlice.actions;
export default swapAgreementSlice.reducer;
