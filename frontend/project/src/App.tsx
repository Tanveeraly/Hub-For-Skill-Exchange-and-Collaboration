import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Profile from "./pages/Profile.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import GoogleLoginPage from "./pages/test.tsx";
import ForgotPass from "./pages/forgetpass.tsx";
import SwapScheduling from "./pages/SwapScheduling.tsx";
import HomeFeed from "./pages/HomeFeed.tsx";
import Notifications from "./pages/Notifications.tsx";
import Messages from "./pages/Messages.tsx";
import Calendar from "./pages/Calendar.tsx";
import ProtectedRoute from "./components/protectedRoutes.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import IncomingCallModal from "./components/IncomingCallModal.tsx";
import MeetingInvitationModal from "./components/MeetingInvitationModal.tsx";
import VideoCall from "./components/VideoCall.tsx";
import AnalyticsDashboard from "./pages/AnalyticsDashboard.tsx";
import Network from "./pages/Network.tsx";
import CareerBooster from "./pages/CareerBooster.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import AdminPortal from "./pages/AdminPortal.tsx";
import SecurityDashboard from "./pages/SecurityDashboard.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminDisputes from "./pages/admin/AdminDisputes.tsx";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs.tsx";
import AdminComplaints from "./pages/admin/AdminComplaints.tsx";
import AdminPortfolios from "./pages/admin/AdminPortfolios.tsx";
import AdminCertifications from "./pages/admin/AdminCertifications.tsx";
import AdminCourses from "./pages/admin/AdminCourses.tsx";
import Footer from "./components/Footer.tsx";
import AppShell from "./components/layout/AppShell.tsx";
import AdminShell from "./components/layout/AdminShell.tsx";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "./store/store.ts";
import { setUser, logout as logoutAction } from "./store/slices/authSlice.ts";
import { addMessage } from "./store/slices/chatSlice.ts";
import {
  receiveCall,
  callRejected,
  endCall,
  callCancelled,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setCallError,
  saveCallRecord,
  receiveMeetingInvite,
  acceptMeetingInvite,
  rejectMeetingInvite,
  initiateCall,
} from "./store/slices/callSlice.ts";
import { socket } from "./services/socket.ts";
import axios from "axios";

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { callState, incomingCallData, remoteUser, callType, meetingInvitation } = useSelector((state: RootState) => state.call);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("https://hub-for-skill-exchange-and-collaboration.onrender.com/api/v1/auth/getme", {
          withCredentials: true,
        });
        if (res.data.success) {
          const userData = res.data.data || res.data.user;
          dispatch(setUser(userData));
        } else {
          dispatch(logoutAction());
        }
      } catch (err) {
        dispatch(logoutAction());
      }
    };
    checkAuth();
  }, [dispatch]);

  // Socket connection and event handling
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    console.log("Setting up socket for user:", user.id);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join", user.id);

    // Messaging Events
    socket.on("receive_message", (msg: any) => {
      const formattedMessage = {
        id: msg.id?.toString() || Date.now().toString(),
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content || msg.messageText || '',
        timestamp: msg.timestamp || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: msg.isRead || false,
        isSent: true,
        attachments: msg.attachments || []
      };
      dispatch(addMessage(formattedMessage));
    });

    socket.on("message_sent", (msg: any) => {
      const formattedMessage = {
        id: msg.id?.toString() || Date.now().toString(),
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content || msg.messageText || '',
        timestamp: msg.timestamp || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        isSent: true,
        attachments: msg.attachments || []
      };
      dispatch(addMessage(formattedMessage));
    });

    socket.on("message_error", ({ error }: { error: string }) => {
      console.error("Message error:", error);
    });

    // Presence Events
    socket.on("online-users", (userIds: number[]) => {
      dispatch(setOnlineUsers(userIds));
    });

    socket.on("user-online", ({ userId }: { userId: number }) => {
      dispatch(addOnlineUser(userId));
    });

    socket.on("user-offline", ({ userId }: { userId: number }) => {
      dispatch(removeOnlineUser(userId));
    });

    // Call Events
    socket.on("incoming-call", (data: {
      callerId: number;
      callerName: string;
      callerAvatar?: string;
      callType: 'audio' | 'video';
      offer?: RTCSessionDescriptionInit;
    }) => {
      dispatch(receiveCall(data));
    });

    socket.on("call-rejected", ({ reason }: { reason?: string }) => {
      dispatch(callRejected({ reason }));
    });

    socket.on("call-ended", () => {
      dispatch(endCall());
    });

    socket.on("call-cancelled", () => {
      dispatch(callCancelled());
    });

    socket.on("call-error", ({ error, code }: { error: string; code: string }) => {
      dispatch(setCallError({ message: error, code }));
      if (code === 'USER_OFFLINE' && user?.id && remoteUser?.id) {
        dispatch(saveCallRecord({
          callerId: Number(user.id),
          receiverId: Number(remoteUser.id),
          callType: callType || 'audio',
          status: 'missed'
        }));
      }
    });

    socket.on("notification", (notification: any) => {
      import("./store/slices/notificationsSlice").then(({ addNotification }) => {
        dispatch(addNotification(notification));
      });
    });

    // Meeting Invitation Events
    socket.on("meeting-invite-received", (data: any) => {
      console.log("📨 Meeting invitation received:", data);
      dispatch(receiveMeetingInvite(data));
    });

    socket.on("meeting-invite-accepted", ({ receiverId, acceptorName }: { receiverId: number; acceptorName: string }) => {
      console.log("✅ Meeting invitation accepted by:", acceptorName);
      // Automatically start the call when invitation is accepted
      dispatch(initiateCall({
        remoteUser: {
          id: receiverId,
          name: acceptorName,
          avatarUrl: undefined
        },
        callType: 'video'
      }));
    });

    socket.on("meeting-invite-rejected", ({ reason }: { reason?: string }) => {
      console.log("❌ Meeting invitation rejected:", reason);
      dispatch(rejectMeetingInvite());
      alert(`Meeting invitation declined: ${reason || 'User declined'}`);
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_sent");
      socket.off("message_error");
      socket.off("online-users");
      socket.off("user-online");
      socket.off("user-offline");
      socket.off("incoming-call");
      socket.off("call-rejected");
      socket.off("call-ended");
      socket.off("call-cancelled");
      socket.off("call-error");
      socket.off("notification");
      socket.off("meeting-invite-received");
      socket.off("meeting-invite-accepted");
      socket.off("meeting-invite-rejected");
      socket.disconnect();
    };
  }, [dispatch, isAuthenticated, user, remoteUser, callType]);

  const location = useLocation();
  const publicPaths = new Set(['/','/login','/signup','/forgot-password','/test','/forgetpassword']);
  const showFooter = publicPaths.has(location.pathname);

  return (
    <div className="min-h-screen bg-neutral-50">
      <IncomingCallModal />
      <MeetingInvitationModal
        isOpen={!!meetingInvitation}
        senderName={meetingInvitation?.senderName || ''}
        senderAvatar={meetingInvitation?.senderAvatar}
        swapDetails={meetingInvitation?.swapDetails}
        onAccept={() => {
          if (meetingInvitation && user) {
            console.log("Accepting meeting invitation from:", meetingInvitation.senderName);

            socket.emit('meeting-invite-accepted', {
              senderId: meetingInvitation.senderId,
              receiverId: user.id,
              acceptorName: user.name
            });

            dispatch(acceptMeetingInvite());

            dispatch(initiateCall({
              remoteUser: {
                id: meetingInvitation.senderId,
                name: meetingInvitation.senderName,
                avatarUrl: meetingInvitation.senderAvatar
              },
              callType: 'video'
            }));
          }
        }}
        onReject={() => {
          if (meetingInvitation && user) {
            console.log("Rejecting meeting invitation from:", meetingInvitation.senderName);

            socket.emit('meeting-invite-rejected', {
              senderId: meetingInvitation.senderId,
              receiverId: user.id,
              reason: 'User declined the invitation'
            });

            dispatch(rejectMeetingInvite());
          }
        }}
      />
      {(callState === 'calling' || callState === 'connecting' || callState === 'connected') && (
        <VideoCall
          offer={incomingCallData?.offer}
          isIncoming={callState === 'connecting' && !!incomingCallData}
        />
      )}
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/test" element={<GoogleLoginPage />} />
        <Route path="/forgetpassword" element={<ForgotPass />} />

        <Route path="/home" element={<ProtectedRoute><AppShell><HomeFeed /></AppShell></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AppShell><AnalyticsDashboard /></AppShell></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />
        <Route path="/marketplace" element={<AppShell><Marketplace /></AppShell>} />
        <Route path="/swaps" element={<ProtectedRoute><AppShell><SwapScheduling /></AppShell></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><AppShell><Notifications /></AppShell></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><AppShell><Messages /></AppShell></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><AppShell><Network /></AppShell></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><AppShell><Calendar /></AppShell></ProtectedRoute>} />
        <Route path="/career" element={<ProtectedRoute><AppShell><CareerBooster /></AppShell></ProtectedRoute>} />

        <Route path="/admin-portal" element={<AdminRoute><AdminShell><AdminPortal /></AdminShell></AdminRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminShell><AdminDashboard /></AdminShell></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminShell><AdminUsers /></AdminShell></AdminRoute>} />
        <Route path="/admin/disputes" element={<AdminRoute><AdminShell><AdminDisputes /></AdminShell></AdminRoute>} />
        <Route path="/admin/audit-logs" element={<AdminRoute><AdminShell><AdminAuditLogs /></AdminShell></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminShell><AdminDashboard /></AdminShell></AdminRoute>} />
        <Route path="/admin/portfolios" element={<AdminRoute><AdminShell><AdminPortfolios /></AdminShell></AdminRoute>} />
        <Route path="/admin/certifications" element={<AdminRoute><AdminShell><AdminCertifications /></AdminShell></AdminRoute>} />
        <Route path="/admin/complaints" element={<AdminRoute><AdminShell><AdminComplaints /></AdminShell></AdminRoute>} />
        <Route path="/admin/courses" element={<AdminRoute><AdminShell><AdminCourses /></AdminShell></AdminRoute>} />
        <Route path="/admin/security" element={<AdminRoute><AdminShell><SecurityDashboard /></AdminShell></AdminRoute>} />
      </Routes>
      {showFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
