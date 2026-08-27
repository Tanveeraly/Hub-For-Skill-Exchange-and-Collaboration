import { PrismaClient } from "../generated/prisma/index.js";
import { Server } from "socket.io";
const prisma = new PrismaClient();

let io;
const onlineUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId

export const initSocket = (server) => {
  const corsOrigin = process.env.CORS_ORIGIN?.replace(/\/$/, '') || "http://localhost:5173";
  
  io = new Server(server, {
    cors: { 
      origin: corsOrigin,
      credentials: true 
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins their room for receiving messages/calls
    socket.on("join", (userId) => {
      const parsedUserId = parseInt(userId);
      socket.join(parsedUserId.toString());
      
      // Track online status
      onlineUsers.set(parsedUserId, socket.id);
      userSockets.set(socket.id, parsedUserId);
      
      // Broadcast online status to all users
      io.emit("user-online", { userId: parsedUserId });
      
      // Send list of currently online users to the joining user
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit("online-users", onlineUserIds);
      
      console.log(`User ${parsedUserId} joined, online users:`, onlineUserIds);
    });

    // ========================================
    // MESSAGING EVENTS
    // ========================================
    
    socket.on("send_message", async (data) => {
      try {
        const message = await prisma.message.create({
          data: {
            senderId: data.senderId,
            receiverId: data.receiverId,
            messageText: data.messageText,
            attachments: data.attachments?.length > 0 ? {
                create: data.attachments.map(att => ({
                    fileUrl: att.url || att.fileUrl,
                    fileName: att.name || att.fileName,
                    fileType: att.type || att.fileType,
                    fileSize: att.size || att.fileSize || 0
                }))
            } : undefined
          },
          include: {
            sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            attachments: true
          }
        });

        const formattedMessage = {
          id: message.id.toString(),
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.messageText,
          messageText: message.messageText,
          createdAt: message.createdAt,
          timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          isSent: true,
          attachments: message.attachments || []
        };

        io.to(data.receiverId.toString()).emit("receive_message", formattedMessage);
        socket.emit("message_sent", formattedMessage);
      } catch (error) {
        console.error("Error sending message via socket:", error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // Session Events
    socket.on("start_work", ({ swapRequestId, receiverId, senderName }) => {
        console.log(`User ${senderName} started work on swap ${swapRequestId}`);
        io.to(receiverId.toString()).emit("session_started", { swapRequestId, senderName });
    });

    socket.on("stop_work", ({ swapRequestId, receiverId, senderName }) => {
        console.log(`User ${senderName} stopped work on swap ${swapRequestId}`);
        io.to(receiverId.toString()).emit("session_stopped", { swapRequestId, senderName });
    });

    // Typing indicators
    socket.on("typing-start", ({ senderId, receiverId }) => {
      io.to(receiverId.toString()).emit("user-typing", { userId: senderId, isTyping: true });
    });

    socket.on("typing-stop", ({ senderId, receiverId }) => {
      io.to(receiverId.toString()).emit("user-typing", { userId: senderId, isTyping: false });
    });

    // ========================================
    // WEBRTC CALLING EVENTS
    // ========================================

    // Initiate a call
    socket.on("call-user", async ({ callerId, receiverId, callerName, callerAvatar, callType, offer }) => {
      try {
        console.log(`Call initiated: ${callerId} -> ${receiverId}, type: ${callType}`);
        
        // Check if receiver is online
        const receiverSocketId = onlineUsers.get(parseInt(receiverId));
        
        if (!receiverSocketId) {
          socket.emit("call-error", { 
            error: "User is offline", 
            code: "USER_OFFLINE" 
          });
          return;
        }

        // Send call notification to receiver
        io.to(receiverId.toString()).emit("incoming-call", {
          callerId,
          callerName,
          callerAvatar,
          callType,
          offer
        });

        socket.emit("call-ringing", { receiverId });
      } catch (error) {
        console.error("Error initiating call:", error);
        socket.emit("call-error", { error: "Failed to initiate call", code: "CALL_INIT_FAILED" });
      }
    });

    // Accept a call
    socket.on("call-accepted", ({ callerId, receiverId, answer }) => {
      try {
        console.log(`Call accepted: ${receiverId} accepted call from ${callerId}`);
        io.to(callerId.toString()).emit("call-accepted", {
          receiverId,
          answer
        });
      } catch (error) {
        console.error("Error accepting call:", error);
        socket.emit("call-error", { error: "Failed to accept call", code: "CALL_ACCEPT_FAILED" });
      }
    });

    // Reject a call
    socket.on("call-rejected", ({ callerId, receiverId, reason }) => {
      try {
        console.log(`Call rejected: ${receiverId} rejected call from ${callerId}, reason: ${reason}`);
        io.to(callerId.toString()).emit("call-rejected", {
          receiverId,
          reason: reason || "User declined the call"
        });
      } catch (error) {
        console.error("Error rejecting call:", error);
      }
    });

    // ICE candidate exchange
    socket.on("ice-candidate", ({ targetUserId, candidate }) => {
      try {
        io.to(targetUserId.toString()).emit("ice-candidate", {
          candidate,
          fromUserId: userSockets.get(socket.id)
        });
      } catch (error) {
        console.error("Error sending ICE candidate:", error);
      }
    });

    // End call
    socket.on("call-ended", ({ targetUserId, callerId, receiverId, duration, callType }) => {
      try {
        console.log(`Call ended between ${callerId} and ${receiverId}, duration: ${duration}s`);
        
        // Notify both parties
        if (targetUserId) {
          io.to(targetUserId.toString()).emit("call-ended", {
            reason: "Call ended by other party",
            duration
          });
        }

        // Save call record if there was a connection
        if (duration && duration > 0) {
          prisma.call.create({
            data: {
              callerId: parseInt(callerId),
              receiverId: parseInt(receiverId),
              callType: callType?.toUpperCase() || 'AUDIO',
              status: 'COMPLETED',
              duration: Math.floor(duration),
              startedAt: new Date(Date.now() - duration * 1000),
              endedAt: new Date()
            }
          }).catch(err => console.error("Error saving call record:", err));
        }
      } catch (error) {
        console.error("Error ending call:", error);
      }
    });

    // Call cancelled (before answer)
    socket.on("call-cancelled", ({ receiverId }) => {
      io.to(receiverId.toString()).emit("call-cancelled", {
        reason: "Caller cancelled the call"
      });
    });

    // ========================================
    // MEETING INVITATION EVENTS
    // ========================================

    // Send meeting invitation
    socket.on("meeting-invite", ({ senderId, receiverId, senderName, senderAvatar, swapDetails }) => {
      try {
        console.log(`Meeting invitation: ${senderId} -> ${receiverId}, swap: ${swapDetails?.id}`);
        
        const receiverSocketId = onlineUsers.get(parseInt(receiverId));
        
        if (!receiverSocketId) {
          socket.emit("meeting-invite-error", { 
            error: "User is offline", 
            code: "USER_OFFLINE" 
          });
          return;
        }

        io.to(receiverId.toString()).emit("meeting-invite-received", {
          senderId,
          senderName,
          senderAvatar,
          swapDetails,
          timestamp: new Date().toISOString()
        });

        socket.emit("meeting-invite-sent", { receiverId });
      } catch (error) {
        console.error("Error sending meeting invitation:", error);
        socket.emit("meeting-invite-error", { error: "Failed to send invitation" });
      }
    });

    // Accept meeting invitation
    socket.on("meeting-invite-accepted", ({ senderId, receiverId, acceptorName }) => {
      try {
        console.log(`Meeting invitation accepted: ${receiverId} accepted invitation from ${senderId}`);
        
        io.to(senderId.toString()).emit("meeting-invite-accepted", {
          receiverId,
          acceptorName,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error accepting meeting invitation:", error);
      }
    });

    // Reject meeting invitation
    socket.on("meeting-invite-rejected", ({ senderId, receiverId, reason }) => {
      try {
        console.log(`Meeting invitation rejected: ${receiverId} rejected invitation from ${senderId}`);
        
        io.to(senderId.toString()).emit("meeting-invite-rejected", {
          receiverId,
          reason: reason || "User declined the invitation",
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error rejecting meeting invitation:", error);
      }
    });

    // ========================================
    // SCREEN SHARING EVENTS
    // ========================================

    // Start screen sharing
    socket.on("screen-share-started", ({ userId, targetUserId }) => {
      try {
        console.log(`Screen sharing started: ${userId} -> ${targetUserId}`);
        io.to(targetUserId.toString()).emit("remote-screen-share-started", {
          userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error notifying screen share start:", error);
      }
    });

    // Stop screen sharing
    socket.on("screen-share-stopped", ({ userId, targetUserId }) => {
      try {
        console.log(`Screen sharing stopped: ${userId}`);
        io.to(targetUserId.toString()).emit("remote-screen-share-stopped", {
          userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error notifying screen share stop:", error);
      }
    });

    // Screen share offer
    socket.on("screen-share-offer", ({ targetUserId, offer }) => {
      try {
        const senderId = userSockets.get(socket.id);
        console.log(`Screen share offer: ${senderId} -> ${targetUserId}`);
        
        io.to(targetUserId.toString()).emit("screen-share-offer", {
          senderId,
          offer
        });
      } catch (error) {
        console.error("Error sending screen share offer:", error);
      }
    });

    // Screen share answer
    socket.on("screen-share-answer", ({ targetUserId, answer }) => {
      try {
        const senderId = userSockets.get(socket.id);
        console.log(`Screen share answer: ${senderId} -> ${targetUserId}`);
        
        io.to(targetUserId.toString()).emit("screen-share-answer", {
          senderId,
          answer
        });
      } catch (error) {
        console.error("Error sending screen share answer:", error);
      }
    });

    // ========================================
    // DISCONNECT HANDLING
    // ========================================

    socket.on("disconnect", () => {
      const userId = userSockets.get(socket.id);
      
      if (userId) {
        onlineUsers.delete(userId);
        userSockets.delete(socket.id);
        
        // Broadcast offline status
        io.emit("user-offline", { userId });
        
        console.log(`User ${userId} disconnected`);
      }
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(parseInt(userId));
};
