import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ========================================
// TYPES
// ========================================

export type CallState = 'idle' | 'calling' | 'receiving' | 'connecting' | 'connected';
export type CallType = 'audio' | 'video';

export interface CallUser {
    id: number;
    name: string;
    avatarUrl?: string;
}

export interface CallHistoryItem {
    id: number;
    type: CallType;
    status: 'missed' | 'completed' | 'rejected';
    duration: number | null;
    createdAt: string;
    isOutgoing: boolean;
    otherUser: CallUser;
}

export interface CallError {
    message: string;
    code: string;
}

export interface MeetingInvitation {
    senderId: number;
    senderName: string;
    senderAvatar?: string;
    swapDetails?: {
        id: number;
        offeredSkill: string;
        requestedSkill: string;
        scheduledAt?: string;
    };
    timestamp: string;
}

interface CallSliceState {
    // Current call state
    callState: CallState;
    callType: CallType | null;

    // Remote user info
    remoteUser: CallUser | null;

    // Call controls
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeakerOn: boolean;

    // Call timing
    callStartTime: number | null;
    callDuration: number;

    // WebRTC data
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    // Call history
    callHistory: CallHistoryItem[];
    historyLoading: boolean;

    // Online users
    onlineUsers: number[];

    // Error handling
    error: CallError | null;

    // Incoming call data (for the modal)
    incomingCallData: {
        callerId: number;
        callerName: string;
        callerAvatar?: string;
        callType: CallType;
        offer?: RTCSessionDescriptionInit;
    } | null;

    // Meeting invitations
    meetingInvitation: MeetingInvitation | null;

    // Screen sharing
    isScreenSharing: boolean;
    remoteScreenSharing: boolean;
}

const initialState: CallSliceState = {
    callState: 'idle',
    callType: null,
    remoteUser: null,
    isMuted: false,
    isCameraOff: false,
    isSpeakerOn: true,
    callStartTime: null,
    callDuration: 0,
    localStream: null,
    remoteStream: null,
    callHistory: [],
    historyLoading: false,
    onlineUsers: [],
    error: null,
    incomingCallData: null,
    meetingInvitation: null,
    isScreenSharing: false,
    remoteScreenSharing: false,
};

// ========================================
// ASYNC THUNKS
// ========================================

export const fetchCallHistory = createAsyncThunk(
    'call/fetchCallHistory',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('http://localhost:5000/api/v1/calls/history', {
                withCredentials: true
            });
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.response?.data?.message || 'Failed to fetch call history',
                code: 'FETCH_HISTORY_ERROR'
            });
        }
    }
);

export const saveCallRecord = createAsyncThunk(
    'call/saveCallRecord',
    async (data: {
        callerId: number;
        receiverId: number;
        callType: 'audio' | 'video';
        status: 'missed' | 'completed' | 'rejected';
        duration?: number;
    }, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/v1/calls/record', {
                ...data,
                callType: data.callType.toUpperCase(),
                status: data.status.toUpperCase()
            }, {
                withCredentials: true
            });
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue({
                message: error.response?.data?.message || 'Failed to save call record',
                code: 'SAVE_RECORD_ERROR'
            });
        }
    }
);

// ========================================
// SLICE
// ========================================

const callSlice = createSlice({
    name: 'call',
    initialState,
    reducers: {
        // Initiate an outgoing call
        initiateCall: (state, action: PayloadAction<{
            remoteUser: CallUser;
            callType: CallType;
        }>) => {
            state.callState = 'calling';
            state.callType = action.payload.callType;
            state.remoteUser = action.payload.remoteUser;
            state.error = null;
            state.isMuted = false;
            state.isCameraOff = false;
        },

        // Receive an incoming call
        receiveCall: (state, action: PayloadAction<{
            callerId: number;
            callerName: string;
            callerAvatar?: string;
            callType: CallType;
            offer?: RTCSessionDescriptionInit;
        }>) => {
            state.callState = 'receiving';
            state.callType = action.payload.callType;
            state.incomingCallData = action.payload;
            state.error = null;
        },

        // Accept an incoming call
        acceptCall: (state) => {
            if (state.incomingCallData) {
                state.callState = 'connecting';
                state.remoteUser = {
                    id: state.incomingCallData.callerId,
                    name: state.incomingCallData.callerName,
                    avatarUrl: state.incomingCallData.callerAvatar
                };
            }
        },

        // Call connected (WebRTC established)
        callConnected: (state) => {
            state.callState = 'connected';
            state.callStartTime = Date.now();
            state.incomingCallData = null;
        },

        // Reject an incoming call
        rejectCall: (state) => {
            state.callState = 'idle';
            state.callType = null;
            state.remoteUser = null;
            state.incomingCallData = null;
        },

        // End current call
        endCall: (state) => {
            state.callState = 'idle';
            state.callType = null;
            state.remoteUser = null;
            state.isMuted = false;
            state.isCameraOff = false;
            state.callStartTime = null;
            state.callDuration = 0;
            state.incomingCallData = null;
            state.error = null;
        },

        // Call was rejected by remote user
        callRejected: (state, action: PayloadAction<{ reason?: string }>) => {
            state.callState = 'idle';
            state.callType = null;
            state.error = {
                message: action.payload.reason || 'Call was declined',
                code: 'CALL_REJECTED'
            };
        },

        // Call error occurred
        setCallError: (state, action: PayloadAction<CallError>) => {
            state.error = action.payload;
            // Don't reset call state here - let the component handle it
        },

        // Clear call error
        clearCallError: (state) => {
            state.error = null;
        },

        // Toggle mute
        toggleMute: (state) => {
            state.isMuted = !state.isMuted;
        },

        // Toggle camera
        toggleCamera: (state) => {
            state.isCameraOff = !state.isCameraOff;
        },

        // Toggle speaker
        toggleSpeaker: (state) => {
            state.isSpeakerOn = !state.isSpeakerOn;
        },

        // Update call duration
        updateCallDuration: (state, action: PayloadAction<number>) => {
            state.callDuration = action.payload;
        },

        // Set online users list
        setOnlineUsers: (state, action: PayloadAction<number[]>) => {
            state.onlineUsers = action.payload;
        },

        // Add online user
        addOnlineUser: (state, action: PayloadAction<number>) => {
            if (!state.onlineUsers.includes(action.payload)) {
                state.onlineUsers.push(action.payload);
            }
        },

        // Remove offline user
        removeOnlineUser: (state, action: PayloadAction<number>) => {
            state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
        },

        // Call cancelled by caller
        callCancelled: (state) => {
            state.callState = 'idle';
            state.callType = null;
            state.incomingCallData = null;
            state.remoteUser = null;
        },

        // Call ringing (for caller feedback)
        callRinging: (_state) => {
            // Just a state marker, actual state stays 'calling'
        },

        // Meeting invitation received
        receiveMeetingInvite: (state, action: PayloadAction<MeetingInvitation>) => {
            state.meetingInvitation = action.payload;
        },

        // Accept meeting invitation
        acceptMeetingInvite: (state) => {
            state.meetingInvitation = null;
        },

        // Reject meeting invitation
        rejectMeetingInvite: (state) => {
            state.meetingInvitation = null;
        },

        // Clear meeting invitation
        clearMeetingInvite: (state) => {
            state.meetingInvitation = null;
        },

        // Toggle screen sharing
        toggleScreenShare: (state) => {
            state.isScreenSharing = !state.isScreenSharing;
        },

        // Set screen sharing status
        setScreenSharing: (state, action: PayloadAction<boolean>) => {
            state.isScreenSharing = action.payload;
        },

        // Set remote screen sharing status
        setRemoteScreenSharing: (state, action: PayloadAction<boolean>) => {
            state.remoteScreenSharing = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch call history
            .addCase(fetchCallHistory.pending, (state) => {
                state.historyLoading = true;
            })
            .addCase(fetchCallHistory.fulfilled, (state, action) => {
                state.historyLoading = false;
                state.callHistory = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchCallHistory.rejected, (state, action) => {
                state.historyLoading = false;
                state.error = action.payload as CallError;
            })
            // Save call record
            .addCase(saveCallRecord.fulfilled, (_state, action) => {
                // Optionally add to history - log for debugging
                if (action.payload) {
                    console.log('Call record saved:', action.payload);
                }
            })
            .addCase(saveCallRecord.rejected, (_state, action) => {
                console.error('Failed to save call record:', action.payload);
            });
    },
});

export const {
    initiateCall,
    receiveCall,
    acceptCall,
    callConnected,
    rejectCall,
    endCall,
    callRejected,
    setCallError,
    clearCallError,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    updateCallDuration,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    callCancelled,
    callRinging,
    receiveMeetingInvite,
    acceptMeetingInvite,
    rejectMeetingInvite,
    clearMeetingInvite,
    toggleScreenShare,
    setScreenSharing,
    setRemoteScreenSharing,
} = callSlice.actions;

export default callSlice.reducer;
