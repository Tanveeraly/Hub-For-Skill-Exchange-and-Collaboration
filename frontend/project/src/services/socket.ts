import { io } from 'socket.io-client';
import { API_ORIGIN } from '../config';

const SOCKET_URL = API_ORIGIN;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});

// WebRTC configuration with STUN servers
export const rtcConfig: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
};
