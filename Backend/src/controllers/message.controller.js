
import { createUser, findUserByEmail,userProfileUpdate,addPortfolio} from "../models/userModel.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { getIO } from "../utlis/chat.socket.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const sentMessage = asynHandler(async (req, res, next) => {
    const { senderId, receiverId, messageText, attachments } = req.body;
    if (!senderId || !receiverId ||(!messageText && !attachments)) {
        return next(new apiError(400, "Message text or attachment is required"));
    }   
    
    const message = await prisma.message.create({
        data: {
            senderId,
            receiverId,
            messageText: messageText || "",
            attachments: attachments ? {
                create: attachments.map(att => ({
                    fileUrl: att.url,
                    fileName: att.name,
                    fileType: att.type,
                    fileSize: att.size
                }))
            } : undefined
        },
      include:{
        sender:true,
        receiver:true,
        attachments: true
      }
    })

    if (!message) {
        return next(new apiError(500, "Failed to send message"));
    }

   const  safeuser= {
        id: message.id, // Assuming string/int match, checking frontend type
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.messageText, // Mapped for frontend compatibility
        messageText: message.messageText, // Kept for legacy
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        attachments: message.attachments || [], // Include attachments for real-time
        sender: {
            id: message.sender.id,
            username: message.sender.name || "User", // Fallback if username missing
            email: message.sender.email,
            profilePicture: message.sender.profile?.avatarUrl, // Adjust if nested
        },
        receiver: {
            id: message.receiver.id,
            username: message.receiver.name || "User",
            email: message.receiver.email,
            profilePicture: message.receiver.profile?.avatarUrl,
        }
    }

    // Emit real-time message via socket
    try {
        const io = getIO();
        io.to(receiverId.toString()).emit("receive_message", safeuser);
    } catch (error) {
        console.error("Socket emit failed:", error);
    }

  res.status(201).json(new ApiResponse(201,safeuser,"message Sent suceessfuly"))


})

const getMessages = asynHandler(async (req, res, next) => {
  try {
    const { user1, user2 } = req.params;
    console.log(`[getMessages] Start fetching between ${user1} and ${user2}`);

    const u1 = Number(user1);
    const u2 = Number(user2);

    if (isNaN(u1) || isNaN(u2)) {
      console.log(`[getMessages] Invalid IDs: u1=${user1}, u2=${user2}`);
      return next(new apiError(400, "Invalid user IDs provided"));
    }

    console.log(`[getMessages] Executing Prisma query for u1: ${u1}, u2: ${u2}`);
    
    let messages;
    try {
        messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: u1, receiverId: u2 },
              { senderId: u2, receiverId: u1 }
            ]
          },
          include: { 
            attachments: true,
            sender: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "asc" }
        });
    } catch (prismaError) {
        console.error("[getMessages] PRISMA QUERY FAILED:", prismaError);
        throw prismaError;
    }

    console.log(`[getMessages] Found ${messages?.length || 0} messages`);

    if (!messages) {
      return res.json(new ApiResponse(200, [], "No messages found"));
    }

    const formattedMessages = messages.map((msg, index) => {
      try {
        if (!msg) return null;
        return {
          id: msg.id?.toString() || `temp-${index}`,
          senderId: Number(msg.senderId),
          receiverId: Number(msg.receiverId),
          content: msg.messageText || "",
          messageText: msg.messageText || "",
          createdAt: msg.createdAt,
          timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          attachments: msg.attachments || [],
          sender: msg.sender,
          receiver: msg.receiver
        };
      } catch (mapError) {
        console.error(`[getMessages] Map error at index ${index}:`, mapError);
        return null;
      }
    }).filter(Boolean);

    console.log(`[getMessages] Returning ${formattedMessages.length} messages`);
    res.json(new ApiResponse(200, formattedMessages, "Messages fetched successfully"));
  } catch (error) {
    console.error("[getMessages] TOP-LEVEL ERROR:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error in getMessages",
        error: error.message,
        stack: error.stack,
        prismaError: error.constructor?.name
    });
  }
});

 
const getConversations = asynHandler(async (req, res, next) => {
    const userId = req.user.id;

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            sender: { 
                select: { id: true, name: true, profile: { select: { avatarUrl: true } } } 
            },
            receiver: { 
                select: { id: true, name: true, profile: { select: { avatarUrl: true } } } 
            }
        }
    });

    const conversationMap = new Map();

    messages.forEach(msg => {
        const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
        if (!conversationMap.has(otherUser.id)) {
            conversationMap.set(otherUser.id, {
                id: otherUser.id.toString(),
                userId: otherUser.id,
                userName: otherUser.name,
                userAvatar: otherUser.profile?.avatarUrl || "",
                lastMessage: msg.messageText || "File",
                lastMessageTime: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unreadCount: 0,
                isOnline: false
            });
        }
    });

    const conversations = Array.from(conversationMap.values());

    return res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched successfully"));
});

export{
    sentMessage,
    getMessages,
    getConversations
}