import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import swapAgreementReducer from './swapAgreementSlice';
import chatReducer from './slices/chatSlice';
import callReducer from './slices/callSlice';
import postsReducer from './slices/postsSlice';
import commentsReducer from './slices/commentsSlice';
import bookmarksReducer from './slices/bookmarksSlice';
import swapsReducer from './slices/swapsSlice';
import connectionsReducer from './slices/connectionSlice';
import notificationsReducer from './slices/notificationsSlice';
import collabReducer from './slices/collabSlice';
import careerReducer from './slices/careerSlice';
import adminReducer from './slices/adminSlice';
import coursesReducer from './slices/coursesSlice';
import disputeReducer from './slices/disputeSlice';
import securityReducer from './slices/securitySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    swapAgreement: swapAgreementReducer,
    chat: chatReducer,
    call: callReducer,
    posts: postsReducer,
    comments: commentsReducer,
    bookmarks: bookmarksReducer,
    swaps: swapsReducer,
    connections: connectionsReducer,
    notifications: notificationsReducer,
    collaboration: collabReducer,
    career: careerReducer,
    admin: adminReducer,
    courses: coursesReducer,
    disputes: disputeReducer,
    security: securityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
