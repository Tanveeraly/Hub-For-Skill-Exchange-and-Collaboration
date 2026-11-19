import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
    endCall,
    toggleMute,
    toggleCamera,
    callConnected,
    updateCallDuration,
    setCallError,
    saveCallRecord,
    setScreenSharing,
    setRemoteScreenSharing,
} from '../store/slices/callSlice';
import { socket, rtcConfig, hasTurnServer, setIceSink, clearIceBuffer, sendIceCandidate } from '../services/socket';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Maximize2, Minimize2, MonitorUp, MonitorX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoCallProps {
    offer?: RTCSessionDescriptionInit;
    isIncoming?: boolean;
}

const NETWORK_FAIL_MESSAGE = hasTurnServer
    ? 'Could not connect the call. Check your internet connection and try again.'
    : 'Could not connect the call. This usually happens when you are on different networks (for example mobile data and Wi-Fi). Try both being on the same Wi-Fi, or ask the admin to add a TURN server.';

export default function VideoCall({ offer, isIncoming = false }: VideoCallProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { callState, callType, remoteUser, isMuted, isCameraOff, callStartTime, isScreenSharing, remoteScreenSharing } = useSelector(
        (state: RootState) => state.call
    );
    const { user } = useSelector((state: RootState) => state.auth);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

    // The role and peer of this call are fixed when the window opens.
    // Reading them from props/state later is what used to restart the call.
    const roleRef = useRef({ isIncoming, offer, remoteUser, user, callType });

    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('Connecting…');
    const [error, setError] = useState<string | null>(null);

    // Screen sharing
    const screenPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const remoteScreenVideoRef = useRef<HTMLVideoElement>(null);
    const pendingScreenIceRef = useRef<RTCIceCandidateInit[]>([]);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // ---------- ICE helpers ----------
    // Candidates can only be added after the remote description is set. Queue them until then.
    const addRemoteIce = useCallback((candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription) {
            pc.addIceCandidate(candidate).catch((err) => console.warn('Ignoring ICE candidate:', err?.message));
        } else {
            pendingIceRef.current.push(candidate);
        }
    }, []);

    const flushRemoteIce = useCallback(() => {
        const pc = peerConnectionRef.current;
        if (!pc || !pc.remoteDescription) return;
        const queued = pendingIceRef.current;
        pendingIceRef.current = [];
        queued.forEach((c) => pc.addIceCandidate(c).catch((err) => console.warn('Ignoring ICE candidate:', err?.message)));
    }, []);

    const addScreenIce = useCallback((candidate: RTCIceCandidateInit) => {
        const pc = screenPeerConnectionRef.current;
        if (pc && pc.remoteDescription) {
            pc.addIceCandidate(candidate).catch(() => undefined);
        } else {
            pendingScreenIceRef.current.push(candidate);
        }
    }, []);

    const flushScreenIce = useCallback(() => {
        const pc = screenPeerConnectionRef.current;
        if (!pc || !pc.remoteDescription) return;
        const queued = pendingScreenIceRef.current;
        pendingScreenIceRef.current = [];
        queued.forEach((c) => pc.addIceCandidate(c).catch(() => undefined));
    }, []);

    // ---------- cleanup ----------
    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        pendingIceRef.current = [];
        setRemoteStream(null);
        clearIceBuffer('call');
    }, []);

    const cleanupScreenShare = useCallback(() => {
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        screenPeerConnectionRef.current?.close();
        screenPeerConnectionRef.current = null;
        pendingScreenIceRef.current = [];
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
        clearIceBuffer('screen');
        dispatch(setScreenSharing(false));
    }, [dispatch]);

    // ---------- peer connection ----------
    const createPeer = useCallback((stream: MediaStream, audioOnly: boolean) => {
        const { remoteUser: peer } = roleRef.current;
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            // Some browsers send tracks without a stream; build one so audio still plays.
            const incoming = event.streams[0] ?? new MediaStream([event.track]);
            setRemoteStream((prev) => {
                if (prev && prev.id === incoming.id) return prev;
                if (prev && !event.streams[0]) {
                    prev.addTrack(event.track);
                    return new MediaStream(prev.getTracks());
                }
                return incoming;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && peer) sendIceCandidate('call', peer.id, event.candidate);
        };

        pc.onconnectionstatechange = () => {
            switch (pc.connectionState) {
                case 'connecting':
                    setConnectionStatus('Connecting…');
                    break;
                case 'connected':
                    setError(null);
                    setConnectionStatus(audioOnly ? 'Connected (audio only)' : 'Connected');
                    dispatch(callConnected());
                    break;
                case 'disconnected':
                    // Often recovers by itself on a brief network blip.
                    setConnectionStatus('Reconnecting…');
                    break;
                case 'failed':
                    setError(NETWORK_FAIL_MESSAGE);
                    dispatch(setCallError({ message: 'Connection failed', code: 'CONNECTION_FAILED' }));
                    break;
            }
        };

        return pc;
    }, [dispatch]);

    const describeMediaError = (err: any, wantedVideo: boolean) => {
        switch (err?.name) {
            case 'NotAllowedError':
                return { code: 'PERMISSION_DENIED', message: 'Camera/microphone access was blocked. Allow it in your browser (the icon in the address bar) and try again.' };
            case 'NotFoundError':
                return { code: 'DEVICE_NOT_FOUND', message: 'No camera or microphone was found. Connect one and try again.' };
            case 'NotReadableError':
                return {
                    code: 'DEVICE_IN_USE',
                    message: wantedVideo
                        ? 'Your camera or microphone is being used by another app or tab. Close it, or use “Try audio only”.'
                        : 'Your microphone is being used by another app. Close it and try again.',
                };
            case 'OverconstrainedError':
                return { code: 'DEVICE_CONSTRAINTS', message: 'Your camera or microphone does not support the requested settings.' };
            default:
                return { code: 'MEDIA_ERROR', message: 'Could not access your camera or microphone.' };
        }
    };

    // ---------- start the call (runs once) ----------
    const startCall = useCallback(async (audioOnly = false) => {
        const { isIncoming: incoming, offer: remoteOffer, remoteUser: peer, user: me, callType: type } = roleRef.current;
        if (!peer) return;
        const wantVideo = !audioOnly && type === 'video';

        try {
            setError(null);
            setConnectionStatus('Getting camera and microphone…');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: wantVideo });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;

            const pc = createPeer(stream, !wantVideo);

            // Deliver candidates that arrived while the call was ringing.
            setIceSink('call', (c, from) => { if (from === Number(peer.id)) addRemoteIce(c); }, Number(peer.id));

            if (incoming && remoteOffer) {
                setConnectionStatus('Answering…');
                await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
                flushRemoteIce();
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('call-accepted', { callerId: peer.id, receiverId: me?.id, answer });
            } else {
                setConnectionStatus('Ringing…');
                const offerDesc = await pc.createOffer();
                await pc.setLocalDescription(offerDesc);
                socket.emit('call-user', {
                    callerId: me?.id,
                    receiverId: peer.id,
                    callerName: me?.name || 'User',
                    callerAvatar: me?.profile?.avatarUrl,
                    callType: wantVideo ? 'video' : 'audio',
                    offer: offerDesc,
                });
            }
        } catch (err: any) {
            console.error('Error starting call:', err);
            const { code, message } = describeMediaError(err, wantVideo);
            setError(message);
            dispatch(setCallError({ message, code }));
        }
    }, [addRemoteIce, createPeer, dispatch, flushRemoteIce]);

    // Retry without the camera (only offered on the calling side).
    const retryWithAudioOnly = useCallback(async () => {
        cleanup();
        await startCall(true);
    }, [cleanup, startCall]);

    useEffect(() => {
        startCall();
        return () => {
            setIceSink('call', null);
            setIceSink('screen', null);
            cleanup();
            screenStreamRef.current?.getTracks().forEach((t) => t.stop());
            screenPeerConnectionRef.current?.close();
        };
        // Mount/unmount only: this window lives for exactly one call.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ---------- attach remote media ----------
    useEffect(() => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            if (remoteStream) remoteAudioRef.current.play().catch(() => setConnectionStatus('Tap anywhere to turn on sound'));
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            if (remoteStream) remoteVideoRef.current.play().catch(() => undefined);
        }
    }, [remoteStream, callType]);

    useEffect(() => {
        if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = remoteScreenStream;
    }, [remoteScreenStream, remoteScreenSharing]);

    // Browsers may block sound until the user interacts with the page.
    useEffect(() => {
        const unlock = () => remoteAudioRef.current?.play().catch(() => undefined);
        document.addEventListener('click', unlock);
        return () => document.removeEventListener('click', unlock);
    }, []);

    // ---------- signalling ----------
    useEffect(() => {
        const handleCallAccepted = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            const pc = peerConnectionRef.current;
            if (!pc || pc.signalingState !== 'have-local-offer') return;
            try {
                setConnectionStatus('Connecting…');
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                flushRemoteIce();
            } catch (err) {
                console.error('Error applying answer:', err);
                setError('Could not connect the call. Please try again.');
            }
        };

        const handleCallEnded = () => {
            cleanup();
            cleanupScreenShare();
            dispatch(endCall());
        };

        // Screen sharing uses its own connection and its own ICE channel.
        const handleScreenShareOffer = async ({ senderId, offer: screenOffer }: { senderId: number; offer: RTCSessionDescriptionInit }) => {
            try {
                screenPeerConnectionRef.current?.close();
                const screenPc = new RTCPeerConnection(rtcConfig);
                screenPeerConnectionRef.current = screenPc;
                screenPc.ontrack = (event) => {
                    setRemoteScreenStream(event.streams[0] ?? new MediaStream([event.track]));
                    dispatch(setRemoteScreenSharing(true));
                };
                screenPc.onicecandidate = (event) => {
                    if (event.candidate) sendIceCandidate('screen', senderId, event.candidate);
                };
                setIceSink('screen', (c) => addScreenIce(c), Number(senderId));
                await screenPc.setRemoteDescription(new RTCSessionDescription(screenOffer));
                flushScreenIce();
                const answer = await screenPc.createAnswer();
                await screenPc.setLocalDescription(answer);
                socket.emit('screen-share-answer', { targetUserId: senderId, answer });
            } catch (err) {
                console.error('Error handling screen share offer:', err);
            }
        };

        const handleScreenShareAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            try {
                const pc = screenPeerConnectionRef.current;
                if (pc && pc.signalingState === 'have-local-offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                    flushScreenIce();
                }
            } catch (err) {
                console.error('Error handling screen share answer:', err);
            }
        };

        const handleRemoteScreenShareStarted = () => dispatch(setRemoteScreenSharing(true));
        const handleRemoteScreenShareStopped = () => {
            dispatch(setRemoteScreenSharing(false));
            setRemoteScreenStream(null);
        };

        socket.on('call-accepted', handleCallAccepted);
        socket.on('call-ended', handleCallEnded);
        socket.on('screen-share-offer', handleScreenShareOffer);
        socket.on('screen-share-answer', handleScreenShareAnswer);
        socket.on('remote-screen-share-started', handleRemoteScreenShareStarted);
        socket.on('remote-screen-share-stopped', handleRemoteScreenShareStopped);

        return () => {
            socket.off('call-accepted', handleCallAccepted);
            socket.off('call-ended', handleCallEnded);
            socket.off('screen-share-offer', handleScreenShareOffer);
            socket.off('screen-share-answer', handleScreenShareAnswer);
            socket.off('remote-screen-share-started', handleRemoteScreenShareStarted);
            socket.off('remote-screen-share-stopped', handleRemoteScreenShareStopped);
        };
    }, [addScreenIce, cleanup, cleanupScreenShare, dispatch, flushRemoteIce, flushScreenIce]);

    // Call duration timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (callState === 'connected' && callStartTime) {
            interval = setInterval(() => {
                const duration = Math.floor((Date.now() - callStartTime) / 1000);
                setCallDuration(duration);
                dispatch(updateCallDuration(duration));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callState, callStartTime, dispatch]);

    // Give up if nobody answers within 45 seconds.
    useEffect(() => {
        if (callState !== 'calling') return;
        const t = setTimeout(() => {
            const peer = roleRef.current.remoteUser;
            if (peer) socket.emit('call-cancelled', { receiverId: peer.id });
            setError(`${peer?.name || 'They'} didn't answer.`);
            setConnectionStatus('No answer');
        }, 45000);
        return () => clearTimeout(t);
    }, [callState]);

    const handleToggleMute = () => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = isMuted;
            dispatch(toggleMute());
        }
    };

    const handleToggleCamera = () => {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = isCameraOff;
            dispatch(toggleCamera());
        }
    };

    const handleEndCall = () => {
        if (callState === 'connected' && remoteUser && user) {
            dispatch(saveCallRecord({
                callerId: Number(user.id),
                receiverId: Number(remoteUser.id),
                callType: callType || 'audio',
                status: 'completed',
                duration: callDuration,
            }));
        }
        if (remoteUser) {
            if (callState === 'calling') {
                socket.emit('call-cancelled', { receiverId: remoteUser.id });
            }
            socket.emit('call-ended', {
                targetUserId: remoteUser.id,
                callerId: user?.id,
                receiverId: remoteUser.id,
                duration: callDuration,
                callType,
            });
        }
        cleanup();
        cleanupScreenShare();
        dispatch(endCall());
    };

    const handleStartScreenShare = async () => {
        if (!remoteUser) return;
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false } as MediaStreamConstraints);
            screenStreamRef.current = screenStream;
            if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream;

            const screenPc = new RTCPeerConnection(rtcConfig);
            screenPeerConnectionRef.current = screenPc;
            screenStream.getTracks().forEach((track) => screenPc.addTrack(track, screenStream));
            screenPc.onicecandidate = (event) => {
                if (event.candidate) sendIceCandidate('screen', remoteUser.id, event.candidate);
            };
            setIceSink('screen', (c) => addScreenIce(c), Number(remoteUser.id));

            const screenOffer = await screenPc.createOffer();
            await screenPc.setLocalDescription(screenOffer);
            socket.emit('screen-share-offer', { targetUserId: remoteUser.id, offer: screenOffer });
            socket.emit('screen-share-started', { userId: user?.id, targetUserId: remoteUser.id });
            dispatch(setScreenSharing(true));

            screenStream.getVideoTracks()[0].onended = () => handleStopScreenShare();
        } catch (err: any) {
            console.error('Error starting screen share:', err);
            if (err?.name !== 'NotAllowedError') setError('Could not start screen sharing.');
        }
    };

    const handleStopScreenShare = () => {
        cleanupScreenShare();
        if (remoteUser) {
            socket.emit('screen-share-stopped', { userId: user?.id, targetUserId: remoteUser.id });
        }
    };

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    if (callState === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-50 bg-neutral-900 ${isFullscreen ? '' : 'p-4 md:p-8'
                    }`}
            >
                <div className={`relative w-full h-full ${isFullscreen ? '' : 'rounded-xl overflow-hidden'}`}>
                    {/* The other person's sound plays here, for audio and video calls alike. */}
                    <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
                    {/* Remote Video (Full screen) */}
                    <div className="absolute inset-0 bg-neutral-900">
                        {callType === 'video' ? (
                            <>
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${remoteStream ? '' : 'hidden'}`}
                                />
                                {!remoteStream && (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <div className="text-center">
                                            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-primary-600 text-4xl font-semibold text-white">
                                                {remoteUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <h2 className="text-xl font-semibold text-white">{remoteUser?.name || 'Unknown'}</h2>
                                            <p className="mt-2 text-neutral-400">{connectionStatus}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto rounded-full bg-primary-500 flex items-center justify-center text-5xl font-bold text-white mb-4">
                                        {remoteUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <h2 className="text-2xl font-semibold text-white">{remoteUser?.name || 'Unknown'}</h2>
                                    <p className="text-neutral-400 mt-2">
                                        {callState === 'connected' ? 'Audio Call' : connectionStatus}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Local Video (PiP) */}
                    {callType === 'video' && (
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            className="absolute bottom-24 right-4 w-40 h-56 rounded-xl overflow-hidden shadow-lg border-2 border-neutral-700"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
                            />
                            {isCameraOff && (
                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                    <VideoOff className="w-8 h-8 text-neutral-400" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Remote Screen Share (overlays remote video when active) */}
                    {remoteScreenSharing && (
                        <div className="absolute inset-0 bg-black z-10">
                            <video
                                ref={remoteScreenVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center space-x-2">
                                <MonitorUp className="w-4 h-4" />
                                <span>{remoteUser?.name} is sharing screen</span>
                            </div>
                        </div>
                    )}

                    {/* Local Screen Share Preview */}
                    {isScreenSharing && (
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            className="absolute bottom-24 left-4 w-64 h-48 rounded-xl overflow-hidden shadow-lg border-2 border-primary-500 z-20"
                        >
                            <video
                                ref={screenVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain bg-black"
                            />
                            <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
                                <MonitorUp className="w-3 h-3" />
                                <span>Your screen</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                                {remoteUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">{remoteUser?.name || 'Unknown'}</h3>
                                <p className="text-neutral-300 text-sm">
                                    {callState === 'connected' ? formatDuration(callDuration) : connectionStatus}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="w-5 h-5 text-white" />
                                ) : (
                                    <Maximize2 className="w-5 h-5 text-white" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Connection Status / Error */}
                    {error && (
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-neutral-900/95 text-white px-6 py-4 rounded-xl shadow-lg max-w-md border border-error-500/50">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error-500/20 flex items-center justify-center">
                                    <PhoneOff className="w-5 h-5 text-error-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-error-400 mb-1">Connection Error</h4>
                                    <p className="text-sm text-neutral-300 mb-3">{error}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {callType === 'video' && (
                                            <button
                                                onClick={retryWithAudioOnly}
                                                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition flex items-center space-x-1"
                                            >
                                                <Mic className="w-4 h-4" />
                                                <span>Try Audio Only</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleEndCall}
                                            className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-lg transition"
                                        >
                                            Cancel Call
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calling Animation */}
                    {callState === 'calling' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-32 h-32 mx-auto rounded-full bg-primary-500 flex items-center justify-center text-5xl font-bold text-white mb-4"
                                >
                                    {remoteUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </motion.div>
                                <h2 className="text-2xl font-semibold text-white">{remoteUser?.name}</h2>
                                <p className="text-neutral-400 mt-2">{connectionStatus}</p>
                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="mt-4"
                                >
                                    <Phone className="w-8 h-8 text-success-500 mx-auto" />
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-center space-x-4">
                            {/* Mute Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleToggleMute}
                                className={`p-4 rounded-full transition ${isMuted ? 'bg-error-500 hover:bg-error-600' : 'bg-white/20 hover:bg-white/30'
                                    }`}
                            >
                                {isMuted ? (
                                    <MicOff className="w-6 h-6 text-white" />
                                ) : (
                                    <Mic className="w-6 h-6 text-white" />
                                )}
                            </motion.button>

                            {/* Camera Toggle (Video calls only) */}
                            {callType === 'video' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleToggleCamera}
                                    className={`p-4 rounded-full transition ${isCameraOff ? 'bg-error-500 hover:bg-error-600' : 'bg-white/20 hover:bg-white/30'
                                        }`}
                                >
                                    {isCameraOff ? (
                                        <VideoOff className="w-6 h-6 text-white" />
                                    ) : (
                                        <Video className="w-6 h-6 text-white" />
                                    )}
                                </motion.button>
                            )}

                            {/* Speaker Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition"
                            >
                                <Volume2 className="w-6 h-6 text-white" />
                            </motion.button>

                            {/* Screen Share Button */}
                            {callType === 'video' && (
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                                    className={`p-4 rounded-full transition ${isScreenSharing
                                        ? 'bg-primary-500 hover:bg-primary-600'
                                        : 'bg-white/20 hover:bg-white/30'
                                        }`}
                                >
                                    {isScreenSharing ? (
                                        <MonitorX className="w-6 h-6 text-white" />
                                    ) : (
                                        <MonitorUp className="w-6 h-6 text-white" />
                                    )}
                                </motion.button>
                            )}

                            {/* End Call Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleEndCall}
                                className="p-4 rounded-full bg-error-500 hover:bg-error-600 transition"
                            >
                                <PhoneOff className="w-6 h-6 text-white" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
