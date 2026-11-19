import { io } from 'socket.io-client';
import { API_ORIGIN } from '../config';

const SOCKET_URL = API_ORIGIN;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
});

// ---------------------------------------------------------------------------
// WebRTC configuration
// STUN lets two browsers find each other's public address. It is enough on the
// same Wi-Fi and on many home networks, but NOT on mobile data, university or
// office networks. Those need a TURN relay. Set these in .env to add one:
//   VITE_TURN_URL=turn:your-turn-host:3478   (comma-separate several URLs)
//   VITE_TURN_USERNAME=...
//   VITE_TURN_CREDENTIAL=...
// ---------------------------------------------------------------------------
const turnUrls = (import.meta.env.VITE_TURN_URL || '')
    .split(',')
    .map((u: string) => u.trim())
    .filter(Boolean);

export const hasTurnServer = turnUrls.length > 0;

export const rtcConfig: RTCConfiguration = {
    iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
        ...(hasTurnServer
            ? [{
                urls: turnUrls,
                username: import.meta.env.VITE_TURN_USERNAME,
                credential: import.meta.env.VITE_TURN_CREDENTIAL,
            }]
            : []),
    ],
    iceCandidatePoolSize: 4,
};

// ---------------------------------------------------------------------------
// ICE candidate routing
// The caller starts sending network candidates the moment the call rings,
// before the receiver has opened the call window. Candidates are buffered
// here until a call (or screen share) connection registers to receive them,
// instead of being silently dropped.
// ---------------------------------------------------------------------------
export type IceKind = 'call' | 'screen';
type IceSink = (candidate: RTCIceCandidateInit, fromUserId: number) => void;

const iceSinks: Partial<Record<IceKind, IceSink>> = {};
const iceBuffer: Record<IceKind, { candidate: RTCIceCandidateInit; from: number }[]> = { call: [], screen: [] };

socket.on('ice-candidate', ({ candidate, fromUserId, kind }: { candidate: RTCIceCandidateInit; fromUserId: number; kind?: IceKind }) => {
    if (!candidate) return;
    const k: IceKind = kind === 'screen' ? 'screen' : 'call';
    const sink = iceSinks[k];
    if (sink) sink(candidate, Number(fromUserId));
    else iceBuffer[k].push({ candidate, from: Number(fromUserId) });
});

/** Start receiving candidates of this kind. Buffered ones from `fromUserId` are delivered immediately. */
export function setIceSink(kind: IceKind, sink: IceSink | null, fromUserId?: number) {
    if (!sink) {
        delete iceSinks[kind];
        return;
    }
    iceSinks[kind] = sink;
    const waiting = iceBuffer[kind];
    iceBuffer[kind] = [];
    waiting
        .filter((c) => fromUserId === undefined || c.from === Number(fromUserId))
        .forEach((c) => sink(c.candidate, c.from));
}

/** Forget candidates left over from a previous call. */
export function clearIceBuffer(kind?: IceKind) {
    if (kind) iceBuffer[kind] = [];
    else { iceBuffer.call = []; iceBuffer.screen = []; }
}

export function sendIceCandidate(kind: IceKind, targetUserId: number | string, candidate: RTCIceCandidate) {
    socket.emit('ice-candidate', { targetUserId, candidate: candidate.toJSON(), kind });
}
