import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1/courses';
const config = { withCredentials: true };

// --- User Thunks ---

export const fetchAllCourses = createAsyncThunk('courses/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(BASE_URL, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
    }
});

export const fetchUserRegistrations = createAsyncThunk('courses/fetchRegistrations', async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${BASE_URL}/registrations`, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to fetch registrations');
    }
});

export const registerForCourse = createAsyncThunk('courses/register', async (courseId: number, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${BASE_URL}/registrations/${courseId}/register`, {}, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to register for course');
    }
});

export const updateCourseProgress = createAsyncThunk(
    'courses/updateProgress',
    async ({ courseId, progress }: { courseId: number; progress: number }, { rejectWithValue }) => {
        try {
            const res = await axios.patch(`${BASE_URL}/registrations/${courseId}/progress`, { progress }, config);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update progress');
        }
    }
);

// --- Admin Thunks ---

export const createCourse = createAsyncThunk('courses/create', async (data: any, { rejectWithValue }) => {
    try {
        const res = await axios.post(BASE_URL, data, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to create course');
    }
});

export const updateCourse = createAsyncThunk('courses/update', async ({ id, data }: { id: number; data: any }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${BASE_URL}/${id}`, data, config);
        return res.data.data;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to update course');
    }
});

export const deleteCourse = createAsyncThunk('courses/delete', async (id: number, { rejectWithValue }) => {
    try {
        await axios.delete(`${BASE_URL}/${id}`, config);
        return id;
    } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || 'Failed to delete course');
    }
});

const initialState = {
    courses: [] as any[],
    registrations: [] as any[],
    loading: false,
    error: null as string | null,
};

const coursesSlice = createSlice({
    name: 'courses',
    initialState,
    reducers: {
        clearCoursesError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Courses
            .addCase(fetchAllCourses.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchAllCourses.fulfilled, (state, action) => { state.loading = false; state.courses = action.payload; })
            .addCase(fetchAllCourses.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            
            // Fetch Registrations
            .addCase(fetchUserRegistrations.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchUserRegistrations.fulfilled, (state, action) => { state.loading = false; state.registrations = action.payload; })
            .addCase(fetchUserRegistrations.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
            
            // Register
            .addCase(registerForCourse.fulfilled, (state, action) => {
                state.registrations = [action.payload, ...state.registrations];
            })
            
            // Update Progress
            .addCase(updateCourseProgress.fulfilled, (state, action) => {
                const index = state.registrations.findIndex((r: any) => r.id === action.payload.id);
                if (index !== -1) {
                    state.registrations[index] = action.payload;
                }
            })
            
            // Admin: Create
            .addCase(createCourse.fulfilled, (state, action) => {
                state.courses = [action.payload, ...state.courses];
            })
            
            // Admin: Update
            .addCase(updateCourse.fulfilled, (state, action) => {
                const index = state.courses.findIndex((c: any) => c.id === action.payload.id);
                if (index !== -1) {
                    state.courses[index] = action.payload;
                }
            })
            
            // Admin: Delete
            .addCase(deleteCourse.fulfilled, (state, action) => {
                state.courses = state.courses.filter((c: any) => c.id !== action.payload);
            });
    }
});

export const { clearCoursesError } = coursesSlice.actions;
export default coursesSlice.reducer;
