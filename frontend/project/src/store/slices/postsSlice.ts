import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/posts';

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get(BASE_URL, { withCredentials: true });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch posts');
    }
});

export const createPost = createAsyncThunk('posts/createPost', async (postData: any, { rejectWithValue }) => {
    try {
        // If postData contains a file, create FormData
        let data;
        if (postData.file) {
            data = new FormData();
            data.append('title', postData.title);
            data.append('description', postData.description);
            if (postData.location) data.append('location', postData.location);
            if (postData.categoryId) data.append('categoryId', postData.categoryId);
            if (postData.isFeatured !== undefined) data.append('isFeatured', postData.isFeatured);
            data.append('media', postData.file);
            if (postData.visibility) data.append('visibility', postData.visibility);
        } else {
            data = postData;
        }

        const response = await axios.post(BASE_URL, data, {
            withCredentials: true,
            headers: postData.file ? { 'Content-Type': 'multipart/form-data' } : {}
        });
        return response.data.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create post');
    }
});

export const deletePost = createAsyncThunk('posts/deletePost', async (id: number, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/${id}`, { withCredentials: true });
        return id;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete post');
    }
});

export const likePost = createAsyncThunk('posts/likePost', async (postId: number, { rejectWithValue }) => {
    try {
        const response = await axios.post(`${BASE_URL}/${postId}/like`, {}, { withCredentials: true });
        return { postId, ...response.data.data };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to like post');
    }
});

export const unlikePost = createAsyncThunk('posts/unlikePost', async (postId: number, { rejectWithValue }) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${postId}/like`, { withCredentials: true });
        return { postId, ...response.data.data };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || 'Failed to unlike post');
    }
});

export const updatePostVisibility = createAsyncThunk(
    'posts/updatePostVisibility',
    async ({ postId, visibility }: { postId: number; visibility: 'PUBLIC' | 'PRIVATE' }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(
                `${BASE_URL}/${postId}/visibility`,
                { visibility },
                { withCredentials: true }
            );
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update visibility');
        }
    }
);

interface PostsState {
    items: any[];
    loading: boolean;
    error: string | null;
}

const initialState: PostsState = {
    items: [],
    loading: false,
    error: null,
};

const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPosts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPosts.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchPosts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createPost.fulfilled, (state, action) => {
                if (state.items) state.items.unshift(action.payload);
            })
            .addCase(deletePost.fulfilled, (state, action) => {
                if (state.items) state.items = state.items.filter((post: any) => post.id !== action.payload);
            })
            .addCase(likePost.fulfilled, (state, action) => {
                const post = state.items?.find((p: any) => p.id === action.payload.postId);
                if (post) {
                    post.isLiked = true;
                    post._count.likes = action.payload.likeCount;
                }
            })
            .addCase(unlikePost.fulfilled, (state, action) => {
                const post = state.items?.find((p: any) => p.id === action.payload.postId);
                if (post) {
                    post.isLiked = false;
                    post._count.likes = action.payload.likeCount;
                }
            })
            .addCase(updatePostVisibility.fulfilled, (state, action) => {
                const post = state.items?.find((p: any) => p.id === action.payload.id);
                if (post) {
                    post.visibility = action.payload.visibility;
                }
            });
    },
});

export default postsSlice.reducer;

