import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    profile?: {
        avatarUrl?: string;
        bio?: string;
        location?: string;
        rating?: number | string;
        hours?: number | string;
    };
    skills?: Array<{
        id?: number;
        skillName?: string;
        expertiseLevel?: string;
    }>;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
            state.loading = false;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.loading = false;
        },
    },
});

export const { setUser, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
