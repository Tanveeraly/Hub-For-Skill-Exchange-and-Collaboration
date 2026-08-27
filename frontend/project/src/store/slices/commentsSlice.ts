import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/comments';

export const fetchComments = createAsyncThunk('comments/fetchComments', async (skillId: number, { rejectWithValue }) => {
    try {
        const response = await axios.get(`${BASE_URL}/${skillId}`, { withCredentials: true });
        return { skillId, comments: response.data.data };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
});

export const addComment = createAsyncThunk('comments/addComment', async (commentData: { skillId: number; text: string }, { rejectWithValue }) => {
    try {
        const response = await axios.post(BASE_URL, commentData, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
});

const commentsSlice = createSlice({
    name: 'comments',
    initialState: {
        byPostId: {} as Record<number, any[]>,
        loading: false,
        error: null as string | null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchComments.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchComments.fulfilled, (state, action) => {
                state.loading = false;
                state.byPostId[action.payload.skillId] = action.payload.comments;
            })
            .addCase(fetchComments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addComment.fulfilled, (state, action) => {
                const { skillId } = action.payload;
                if (!state.byPostId[skillId]) {
                    state.byPostId[skillId] = [];
                }
                state.byPostId[skillId].unshift(action.payload);
            });
    },
});

export default commentsSlice.reducer;
