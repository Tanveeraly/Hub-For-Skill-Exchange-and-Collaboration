import { PrismaClient, Prisma } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { getIO } from "../utlis/chat.socket.js";

const prisma = new PrismaClient();

const createSwapRequest = asynHandler(async (req, res, next) => {
  const { skillId, message, offeredSkill, requestedSkill, preferredTimeSlots } = req.body;
  const senderId = req.user.id;

  if (!skillId) {
    return next(new apiError(400, "Skill ID is required"));
  }

  const skill = await prisma.skillListing.findUnique({ where: { id: parseInt(skillId) } });
  if (!skill) {
    return next(new apiError(404, "Skill not found"));
  }

  if (skill.userId === senderId) {
    return next(new apiError(400, "You cannot swap with your own skill"));
  }

  const existingSwap = await prisma.swapRequest.findFirst({
    where: {
      senderId,
      skillId: parseInt(skillId),
      status: "PENDING"
    }
  });

  if (existingSwap) {
    return next(new apiError(400, "You already have a pending swap request for this skill"));
  }

  const swapRequest = await prisma.swapRequest.create({
    data: {
      senderId,
      receiverId: skill.userId,
      skillId: parseInt(skillId),
      message,
      offeredSkill,
      requestedSkill,
      preferredTimeSlots: preferredTimeSlots || [],
      status: "PENDING"
    }
  });

  // Create Notification for the receiver
  const notification = await prisma.notification.create({
    data: {
      userId: skill.userId,
      senderId,
      type: "SWAP_REQUEST",
      title: "New Swap Request",
      message: `${req.user.name || 'A user'} wants to swap ${offeredSkill || 'skills'} with you!`,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profile: { select: { avatarUrl: true } }
        }
      }
    }
  });

  // Real-time socket notification
  try {
    const io = getIO();
    io.to(skill.userId.toString()).emit("notification", notification);
  } catch (err) {
    console.error("Socket notification failed:", err.message);
  }

  return res.status(201).json(new ApiResponse(201, swapRequest, "Swap request sent successfully"));
});

const getReceivedSwapRequests = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const requests = await prisma.swapRequest.findMany({
    where: { receiverId: userId },
    include: {
      sender: {
         select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: { avatarUrl: true }
          }
        }
      },
      skill: true,
      attachments: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.status(200).json(new ApiResponse(200, requests, "Received swap requests fetched successfully"));
});

const getSentSwapRequests = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const requests = await prisma.swapRequest.findMany({
    where: { senderId: userId },
    include: {
      receiver: {
         select: {
          id: true,
          name: true,
          profile: {
            select: { avatarUrl: true }
          }
        }
      },
      skill: true,
      attachments: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.status(200).json(new ApiResponse(200, requests, "Sent swap requests fetched successfully"));
});

const respondToSwapRequest = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectionReason, scheduledAt, duration } = req.body; 
  const userId = req.user.id;

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    return next(new apiError(400, "Invalid status"));
  }

  const swapRequest = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });

  if (!swapRequest) {
    return next(new apiError(404, "Swap request not found"));
  }

  // Only receiver can respond to PENDING or RESCHEDULED (if sender proposed)
  // Actually, simplified: Only the current "target" of the status can respond.
  // If it's PENDING, receiver responds. 
  // If it's RESCHEDULED, the other party responds.
  
  const isAuthorized = swapRequest.receiverId === userId || swapRequest.senderId === userId;
  if (!isAuthorized) {
    return next(new apiError(403, "You are not authorized to respond to this request"));
  }

  // Handle response to RESCHEDULED status
  if (swapRequest.status === "RESCHEDULED") {
      if (status === "REJECTED") {
          // Revert to PENDING if reschedule is rejected
          const updatedSwap = await prisma.swapRequest.update({
              where: { id: parseInt(id) },
              data: {
                  status: "PENDING",
                  proposedTimeSlot: Prisma.DbNull, // Clear the proposed slot
                  message: swapRequest.message // Keep original message or update if needed
              },
              include: {
                  sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
                  receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                  skill: true,
                  attachments: true
              }
          });

          // Notify the proposer (who sent the reschedule)
          const targetUserId = userId === swapRequest.senderId ? swapRequest.receiverId : swapRequest.senderId;
          const notification = await prisma.notification.create({
              data: {
                  userId: targetUserId,
                  senderId: userId,
                  type: "SWAP_REJECTED", // Or a specific RESCHEDULE_REJECTED type if available
                  title: "Reschedule Rejected",
                  message: `${req.user.name || 'User'} rejected your reschedule proposal. Swap is back to Pending.`,
              },
              include: {
                  sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
              }
          });
          
          try {
              const io = getIO();
              io.to(targetUserId.toString()).emit("notification", notification);
          } catch (err) {
              console.error("Socket notification failed:", err.message);
          }

          return res.status(200).json(new ApiResponse(200, updatedSwap, "Reschedule rejected, reverted to Pending"));
      }
  }

  const updateData = { status };
  if (status === "REJECTED") {
    updateData.rejectionReason = rejectionReason;
  } else if (status === "ACCEPTED") {
    // If accepting a reschedule, use the proposed time if not explicitly provided
    let finalScheduledAt = scheduledAt;
    if (!finalScheduledAt && swapRequest.status === "RESCHEDULED" && swapRequest.proposedTimeSlot) {
        // Handle both old format (string) and new format (object)
        const slotData = swapRequest.proposedTimeSlot;
        finalScheduledAt = typeof slotData === 'object' && slotData.slot ? slotData.slot : slotData;
    }

    if (!finalScheduledAt) return next(new apiError(400, "scheduledAt is required for acceptance"));
    
    updateData.scheduledAt = new Date(finalScheduledAt);
    updateData.duration = duration || 60; // default 60 mins
    updateData.meetingRoomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Conflict detection
    const conflict = await prisma.swapRequest.findFirst({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId },
                { senderId: swapRequest.senderId },
                { receiverId: swapRequest.senderId }
            ],
            status: "ACCEPTED",
            scheduledAt: {
                // Simplified overlap: same start time or within 1 hour
                // Real conflict detection would use duration
                gte: new Date(new Date(finalScheduledAt).getTime() - 60 * 60 * 1000),
                lte: new Date(new Date(finalScheduledAt).getTime() + 60 * 60 * 1000)
            }
        }
    });

    if (conflict) {
        return next(new apiError(400, "Conflict detected: one of the users has an overlapping session"));
    }
  }

  const updatedSwap = await prisma.swapRequest.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
      receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
      skill: true,
      attachments: true
    }
  });

  const notifType = status === "ACCEPTED" ? "SWAP_ACCEPTED" : "SWAP_REJECTED";
  // Notify the OTHER party
  const targetUserId = userId === swapRequest.senderId ? swapRequest.receiverId : swapRequest.senderId;

  const notification = await prisma.notification.create({
    data: {
      userId: targetUserId,
      senderId: userId,
      type: notifType,
      title: `Swap ${status.charAt(0) + status.slice(1).toLowerCase()}`,
      message: `${req.user.name || 'User'} has ${status.toLowerCase()} the swap request.`,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          profile: { select: { avatarUrl: true } }
        }
      }
    }
  });

  // Real-time socket notification
  try {
    const io = getIO();
    io.to(targetUserId.toString()).emit("notification", notification);
    
    // If Accepted, notify the SENDER (current user) as well for confirmation? 
    // Usually only the other person needs a notification, but for "Swap Confirmed" maybe both?
    // The requirement says: "Both users receive a confirmation notification"
    if (status === "ACCEPTED") {
        const selfNotification = await prisma.notification.create({
            data: {
                userId: userId,
                senderId: targetUserId, // From the other user conceptually
                type: "SWAP_ACCEPTED",
                title: "Swap Confirmed",
                message: `You accepted the swap with ${updatedSwap.senderId === userId ? updatedSwap.receiver.name : updatedSwap.sender.name}.`,
            },
            include: { sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } }
        });
        io.to(userId.toString()).emit("notification", selfNotification);
    }

  } catch (err) {
    console.error("Socket notification failed:", err.message);
  }

  return res.status(200).json(new ApiResponse(200, updatedSwap, `Swap request ${status.toLowerCase()}`));
});

const proposeReschedule = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const { proposedTimeSlot, message, meetingAgenda } = req.body;
    const userId = req.user.id;

    const swapRequest = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });

    if (!swapRequest) {
        return next(new apiError(404, "Swap request not found"));
    }

    if (swapRequest.receiverId !== userId && swapRequest.senderId !== userId) {
        return next(new apiError(403, "Not authorized"));
    }

    const updatedSwap = await prisma.swapRequest.update({
        where: { id: parseInt(id) },
        data: {
            status: "RESCHEDULED",
            proposedTimeSlot: { slot: proposedTimeSlot, initiatorId: userId },
            message: message || swapRequest.message,
            meetingAgenda
        },
        include: {
            sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            skill: true,
            attachments: true
        }
    });

    const targetUserId = userId === swapRequest.senderId ? swapRequest.receiverId : swapRequest.senderId;

    const notification = await prisma.notification.create({
        data: {
            userId: targetUserId,
            senderId: userId,
            type: "SYSTEM",
            title: "Swap Reschedule Proposed",
            message: `${req.user.name} proposed a new time for your swap.`,
        },
        include: {
            sender: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatarUrl: true } }
              }
            }
        }
    });

    // Real-time socket notification
    try {
        const io = getIO();
        io.to(targetUserId.toString()).emit("notification", notification);
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    return res.status(200).json(new ApiResponse(200, updatedSwap, "Reschedule proposed"));
});

const completeSwap = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    const swapRequest = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });

    if (!swapRequest || (swapRequest.senderId !== userId && swapRequest.receiverId !== userId)) {
        return next(new apiError(403, "Not authorized"));
    }

    if (swapRequest.status !== "ACCEPTED") {
        return next(new apiError(400, "Only accepted swaps can be completed"));
    }

    const updatedSwap = await prisma.swapRequest.update({
        where: { id: parseInt(id) },
        data: { status: "COMPLETED" },
        include: {
            sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            skill: true,
            attachments: true
        }
    });

    return res.status(200).json(new ApiResponse(200, updatedSwap, "Swap marked as completed"));
});
const requestMoreInfo = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const swapRequest = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });

    if (!swapRequest || swapRequest.receiverId !== userId) {
        return next(new apiError(403, "Not authorized to request more info on this swap"));
    }

    const updatedSwap = await prisma.swapRequest.update({
        where: { id: parseInt(id) },
        data: {
            status: "MORE_INFO_REQUESTED",
            message: message || "The receiver has requested more details before accepting."
        },
        include: {
            sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            skill: true,
            attachments: true
        }
    });

    const notification = await prisma.notification.create({
        data: {
            userId: swapRequest.senderId,
            senderId: userId,
            type: "SYSTEM",
            title: "More Info Requested",
            message: `${req.user.name} has requested more details regarding your swap request.`,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    profile: { select: { avatarUrl: true } }
                }
            }
        }
    });

    // Real-time socket notification
    try {
        const io = getIO();
        io.to(swapRequest.senderId.toString()).emit("notification", notification);
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    return res.status(200).json(new ApiResponse(200, updatedSwap, "More info requested"));
});

const attachFileToSwap = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const { url, name, type, size } = req.body;
    
    const attachment = await prisma.attachment.create({
        data: {
            swapRequestId: parseInt(id),
            fileUrl: url,
            fileName: name,
            fileType: type,
            fileSize: size
        }
    });

    const swapRequest = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });
    if (swapRequest) {
        const partnerId = swapRequest.senderId === req.user.id ? swapRequest.receiverId : swapRequest.senderId;
        
        // Notify partner
        await prisma.notification.create({
            data: {
                userId: partnerId,
                senderId: req.user.id,
                type: "SYSTEM",
                title: "New File Attachment",
                message: `${req.user.name} attached a file to your swap agreement.`
            }
        });

        // Emit socket event
        try {
            const io = getIO();
            io.to(partnerId.toString()).emit("new_attachment", { swapRequestId: parseInt(id), attachment });
        } catch (err) {
            console.error("Socket notification failed:", err.message);
        }
    }

    return res.status(201).json(new ApiResponse(201, attachment, "File attached to swap"));
});

export { 
    createSwapRequest, 
    getReceivedSwapRequests, 
    getSentSwapRequests, 
    respondToSwapRequest,
    proposeReschedule,
    completeSwap,
    requestMoreInfo,
    attachFileToSwap
};

