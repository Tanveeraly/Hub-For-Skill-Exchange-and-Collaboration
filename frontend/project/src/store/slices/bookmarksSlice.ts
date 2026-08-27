import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/bookmarks';

export const fetchBookmarks = createAsyncThunk('bookmarks/fetchBookmarks', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(BASE_URL, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookmarks');
    }
});

export const toggleBookmark = createAsyncThunk('bookmarks/toggleBookmark', async (skillId: number, { rejectWithValue }) => {
    try {
        const response = await axios.post(BASE_URL, { skillId }, { withCredentials: true });
        return { skillId, bookmarked: response.data.data.bookmarked };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle bookmark');
    }
});

const bookmarksSlice = createSlice({
    name: 'bookmarks',
    initialState: {
        items: [],
        loading: false,
        error: null as string | null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBookmarks.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(toggleBookmark.fulfilled, (state, action) => {
                if (action.payload.bookmarked) {
                    // Re-fetch or simplistic update? 
                    // For now, relies on fetchBookmarks being called elsewhere or just knowing it's bookmarked.
                    // Ideally we add it to the list if we have the full object, but here we only have ID.
                    // We might just trigger a re-fetch of bookmarks or posts.
                } else {
                    state.items = state.items.filter((b: any) => b.skillId !== action.payload.skillId);
                }
            });
    },
});

export default bookmarksSlice.reducer;
