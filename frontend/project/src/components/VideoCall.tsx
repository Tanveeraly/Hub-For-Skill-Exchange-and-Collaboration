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
import { socket, rtcConfig } from '../services/socket';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Maximize2, Minimize2, MonitorUp, MonitorX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoCallProps {
    offer?: RTCSessionDescriptionInit;
    isIncoming?: boolean;
}

export default function VideoCall({ offer, isIncoming = false }: VideoCallProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { callState, callType, remoteUser, isMuted, isCameraOff, callStartTime, isScreenSharing, remoteScreenSharing } = useSelector(
        (state: RootState) => state.call
    );
    const { user } = useSelector((state: RootState) => state.auth);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const [callDuration, setCallDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
    const [error, setError] = useState<string | null>(null);

    // Screen sharing refs
    const screenPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const remoteScreenVideoRef = useRef<HTMLVideoElement>(null);

    // Format call duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Cleanup function
    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    }, []);

    // Screen sharing cleanup
    const cleanupScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        if (screenPeerConnectionRef.current) {
            screenPeerConnectionRef.current.close();
            screenPeerConnectionRef.current = null;
        }
        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = null;
        }
        if (remoteScreenVideoRef.current) {
            remoteScreenVideoRef.current.srcObject = null;
        }
        dispatch(setScreenSharing(false));
    }, [dispatch]);

    // Initialize WebRTC
    const initializeCall = useCallback(async () => {
        try {
            setConnectionStatus('Getting media access...');

            // Request media permissions
            const constraints = {
                audio: true,
                video: callType === 'video'
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setConnectionStatus('Creating connection...');

            // Create peer connection
            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            // Add local tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle incoming tracks
            pc.ontrack = (event) => {
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setConnectionStatus('Connected');
                    dispatch(callConnected());
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate && remoteUser) {
                    socket.emit('ice-candidate', {
                        targetUserId: remoteUser.id,
                        candidate: event.candidate
                    });
                }
            };

            // Handle connection state changes
            pc.onconnectionstatechange = () => {
                switch (pc.connectionState) {
                    case 'connected':
                        setConnectionStatus('Connected');
                        dispatch(callConnected());
                        break;
                    case 'disconnected':
                        setConnectionStatus('Disconnected');
                        break;
                    case 'failed':
                        setError('Connection failed. Please try again.');
                        dispatch(setCallError({ message: 'Connection failed', code: 'CONNECTION_FAILED' }));
                        break;
                    case 'closed':
                        setConnectionStatus('Call ended');
                        break;
                }
            };

            // Handle ICE connection state
            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === 'failed') {
                    setError('ICE connection failed. Network issue detected.');
                }
            };

            if (isIncoming && offer) {
                // Answer incoming call
                setConnectionStatus('Answering call...');
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socket.emit('call-accepted', {
                    callerId: remoteUser?.id,
                    receiverId: user?.id,
                    answer: answer
                });
            } else {
                // Create offer for outgoing call
                setConnectionStatus('Calling...');
                const offerDesc = await pc.createOffer();
                await pc.setLocalDescription(offerDesc);

                socket.emit('call-user', {
                    callerId: user?.id,
                    receiverId: remoteUser?.id,
                    callerName: user?.name || 'User',
                    callerAvatar: user?.profile?.avatarUrl,
                    callType: callType,
                    offer: offerDesc
                });
            }

        } catch (err: any) {
            console.error('Error initializing call:', err);
            let errorMessage = 'Failed to access camera/microphone.';
            let errorCode = 'MEDIA_ERROR';

            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera/microphone access was denied. Please allow access in your browser settings and try again.';
                errorCode = 'PERMISSION_DENIED';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera/microphone found. Please connect a device and try again.';
                errorCode = 'DEVICE_NOT_FOUND';
            } else if (err.name === 'NotReadableError') {
                errorMessage = callType === 'video'
                    ? 'Camera/microphone is in use by another application or browser tab. Try closing other apps using the camera, or use Audio Call instead.'
                    : 'Microphone is in use by another application. Please close other apps using the microphone and try again.';
                errorCode = 'DEVICE_IN_USE';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = 'Camera/microphone settings are not supported. Please try a different device.';
                errorCode = 'DEVICE_CONSTRAINTS';
            } else if (err.name === 'AbortError') {
                errorMessage = 'Media access was interrupted. Please try again.';
                errorCode = 'MEDIA_ABORTED';
            }

            setError(errorMessage);
            dispatch(setCallError({ message: errorMessage, code: errorCode }));
        }
    }, [callType, dispatch, isIncoming, offer, remoteUser, user]);

    // Retry with audio only (for when video fails)
    const retryWithAudioOnly = useCallback(async () => {
        setError(null);
        setConnectionStatus('Retrying with audio only...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            setConnectionStatus('Creating connection...');

            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.ontrack = (event) => {
                if (remoteVideoRef.current && event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setConnectionStatus('Connected');
                    dispatch(callConnected());
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate && remoteUser) {
                    socket.emit('ice-candidate', {
                        targetUserId: remoteUser.id,
                        candidate: event.candidate
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') {
                    setConnectionStatus('Connected (Audio Only)');
                    dispatch(callConnected());
                } else if (pc.connectionState === 'failed') {
                    setError('Connection failed. Please try again.');
                }
            };

            setConnectionStatus('Calling (Audio Only)...');
            const offerDesc = await pc.createOffer();
            await pc.setLocalDescription(offerDesc);

            socket.emit('call-user', {
                callerId: user?.id,
                receiverId: remoteUser?.id,
                callerName: user?.name || 'User',
                callerAvatar: user?.profile?.avatarUrl,
                callType: 'audio',
                offer: offerDesc
            });

        } catch (retryErr: any) {
            console.error('Audio-only retry failed:', retryErr);
            setError('Unable to access microphone. Please check your device permissions.');
        }
    }, [dispatch, remoteUser, user]);

    // Initialize call on mount
    useEffect(() => {
        if (callState === 'calling' || callState === 'connecting') {
            initializeCall();
        }

        return () => {
            cleanup();
        };
    }, [callState, initializeCall, cleanup]);

    // Handle socket events
    useEffect(() => {
        const handleCallAccepted = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    setConnectionStatus('Connected');
                }
            } catch (err) {
                console.error('Error handling call accepted:', err);
                setError('Failed to establish connection.');
            }
        };

        const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            try {
                if (peerConnectionRef.current && candidate) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        };

        const handleCallEnded = () => {
            cleanup();
            dispatch(endCall());
        };

        socket.on('call-accepted', handleCallAccepted);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('call-ended', handleCallEnded);

        // Screen sharing events
        const handleScreenShareOffer = async ({ senderId, offer }: { senderId: number; offer: RTCSessionDescriptionInit }) => {
            try {
                const screenPc = new RTCPeerConnection(rtcConfig);
                screenPeerConnectionRef.current = screenPc;

                screenPc.ontrack = (event) => {
                    if (remoteScreenVideoRef.current && event.streams[0]) {
                        remoteScreenVideoRef.current.srcObject = event.streams[0];
                        dispatch(setRemoteScreenSharing(true));
                    }
                };

                screenPc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', {
                            targetUserId: senderId,
                            candidate: event.candidate
                        });
                    }
                };

                await screenPc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await screenPc.createAnswer();
                await screenPc.setLocalDescription(answer);

                socket.emit('screen-share-answer', {
                    targetUserId: senderId,
                    answer
                });
            } catch (err) {
                console.error('Error handling screen share offer:', err);
            }
        };

        const handleScreenShareAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            try {
                if (screenPeerConnectionRef.current) {
                    await screenPeerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (err) {
                console.error('Error handling screen share answer:', err);
            }
        };

        const handleRemoteScreenShareStarted = () => {
            dispatch(setRemoteScreenSharing(true));
        };

        const handleRemoteScreenShareStopped = () => {
            dispatch(setRemoteScreenSharing(false));
            if (remoteScreenVideoRef.current) {
                remoteScreenVideoRef.current.srcObject = null;
            }
        };

        socket.on('screen-share-offer', handleScreenShareOffer);
        socket.on('screen-share-answer', handleScreenShareAnswer);
        socket.on('remote-screen-share-started', handleRemoteScreenShareStarted);
        socket.on('remote-screen-share-stopped', handleRemoteScreenShareStopped);

        return () => {
            socket.off('call-accepted', handleCallAccepted);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('call-ended', handleCallEnded);
            socket.off('screen-share-offer', handleScreenShareOffer);
            socket.off('screen-share-answer', handleScreenShareAnswer);
            socket.off('remote-screen-share-started', handleRemoteScreenShareStarted);
            socket.off('remote-screen-share-stopped', handleRemoteScreenShareStopped);
        };
    }, [cleanup, dispatch]);

    // Call duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;

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

    // Toggle mute handler
    const handleToggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted;
                dispatch(toggleMute());
            }
        }
    };

    // Toggle camera handler
    const handleToggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isCameraOff;
                dispatch(toggleCamera());
            }
        }
    };

    // End call handler
    const handleEndCall = () => {
        // Save call record if connected
        if (callState === 'connected' && remoteUser && user) {
            dispatch(saveCallRecord({
                callerId: user.id,
                receiverId: Number(remoteUser.id),
                callType: callType || 'audio',
                status: 'completed',
                duration: callDuration
            }));
        }

        // Notify remote user
        if (remoteUser) {
            socket.emit('call-ended', {
                targetUserId: remoteUser.id,
                callerId: user?.id,
                receiverId: remoteUser.id,
                duration: callDuration,
                callType: callType
            });
        }

        cleanup();
        cleanupScreenShare();
        dispatch(endCall());
    };

    // Start screen sharing
    const handleStartScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            } as MediaStreamConstraints);

            screenStreamRef.current = screenStream;

            if (screenVideoRef.current) {
                screenVideoRef.current.srcObject = screenStream;
            }

            // Create a new peer connection for screen sharing
            const screenPc = new RTCPeerConnection(rtcConfig);
            screenPeerConnectionRef.current = screenPc;

            // Add screen tracks
            screenStream.getTracks().forEach(track => {
                screenPc.addTrack(track, screenStream);
            });

            // Handle ICE candidates for screen share
            screenPc.onicecandidate = (event) => {
                if (event.candidate && remoteUser) {
                    socket.emit('ice-candidate', {
                        targetUserId: remoteUser.id,
                        candidate: event.candidate
                    });
                }
            };

            // Create and send offer
            const offer = await screenPc.createOffer();
            await screenPc.setLocalDescription(offer);

            socket.emit('screen-share-offer', {
                targetUserId: remoteUser?.id,
                offer
            });

            socket.emit('screen-share-started', {
                userId: user?.id,
                targetUserId: remoteUser?.id
            });

            dispatch(setScreenSharing(true));

            // Handle when user stops sharing via browser UI
            screenStream.getVideoTracks()[0].onended = () => {
                handleStopScreenShare();
            };

        } catch (err: any) {
            console.error('Error starting screen share:', err);
            if (err.name === 'NotAllowedError') {
                setError('Screen sharing permission denied');
            } else {
                setError('Failed to start screen sharing');
            }
        }
    };

    // Stop screen sharing
    const handleStopScreenShare = () => {
        cleanupScreenShare();

        if (remoteUser) {
            socket.emit('screen-share-stopped', {
                userId: user?.id,
                targetUserId: remoteUser.id
            });
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (callState === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-50 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black ${isFullscreen ? '' : 'p-4 md:p-8'
                    }`}
            >
                <div className={`relative w-full h-full ${isFullscreen ? '' : 'rounded-2xl overflow-hidden'}`}>
                    {/* Remote Video (Full screen) */}
                    <div className="absolute inset-0 bg-neutral-900">
                        {callType === 'video' ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-5xl font-bold text-white mb-4">
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
                            className="absolute bottom-24 right-4 w-40 h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-neutral-700"
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
                            className="absolute bottom-24 left-4 w-64 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-primary-500 z-20"
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white font-bold">
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
                        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-neutral-900/95 text-white px-6 py-4 rounded-xl shadow-2xl max-w-md border border-error-500/50">
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
                                    className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-5xl font-bold text-white mb-4"
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
