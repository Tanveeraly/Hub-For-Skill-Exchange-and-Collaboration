import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { getIO } from "../utlis/chat.socket.js";
import { logAuditEvent } from "./security.controller.js";

const prisma = new PrismaClient();

// ─── FILE A DISPUTE ───
const fileDispute = asynHandler(async (req, res, next) => {
    const { swapRequestId, subject, description, category, priority, evidence } = req.body;
    const userId = req.user.id;

    if (!swapRequestId || !subject || !description) {
        return next(new apiError(400, "Swap request ID, subject, and description are required"));
    }

    const swap = await prisma.swapRequest.findUnique({ where: { id: parseInt(swapRequestId) } });
    if (!swap) return next(new apiError(404, "Swap request not found"));

    if (swap.senderId !== userId && swap.receiverId !== userId) {
        return next(new apiError(403, "You are not part of this swap"));
    }

    const againstId = swap.senderId === userId ? swap.receiverId : swap.senderId;

    // Check for existing open dispute
    const existingDispute = await prisma.dispute.findFirst({
        where: { swapRequestId: parseInt(swapRequestId), filedById: userId, status: { in: ["OPEN", "UNDER_REVIEW", "ESCALATED"] } }
    });
    if (existingDispute) {
        return next(new apiError(400, "You already have an active dispute for this swap"));
    }

    const dispute = await prisma.dispute.create({
        data: {
            subject,
            description,
            category: category || "GENERAL",
            priority: priority || "MEDIUM",
            evidence: evidence || null,
            filedById: userId,
            againstId,
            swapRequestId: parseInt(swapRequestId)
        },
        include: {
            filedBy: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            against: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            swapRequest: { select: { id: true, offeredSkill: true, requestedSkill: true, status: true } }
        }
    });

    // Notify the other party
    const notification = await prisma.notification.create({
        data: {
            userId: againstId,
            senderId: userId,
            type: "DISPUTE_FILED",
            title: "Dispute Filed Against You",
            message: `${req.user.name} has filed a dispute regarding your swap: "${subject}"`,
        },
        include: { sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } }
    });

    try {
        const io = getIO();
        io.to(againstId.toString()).emit("notification", notification);
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    return res.status(201).json(new ApiResponse(201, dispute, "Dispute filed successfully"));
});

// ─── GET USER'S DISPUTES ───
const getMyDisputes = asynHandler(async (req, res) => {
    const userId = req.user.id;

    const disputes = await prisma.dispute.findMany({
        where: {
            OR: [{ filedById: userId }, { againstId: userId }]
        },
        include: {
            filedBy: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            against: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            swapRequest: { select: { id: true, offeredSkill: true, requestedSkill: true, status: true, scheduledAt: true } },
            resolvedBy: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
    });

    return res.status(200).json(new ApiResponse(200, disputes, "Disputes fetched"));
});

// ─── ESCROW CONFIRM ───
const escrowConfirm = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;

    const swap = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });
    if (!swap) return next(new apiError(404, "Swap request not found"));

    if (swap.status !== "ACCEPTED") {
        return next(new apiError(400, "Only accepted swaps can be confirmed via escrow"));
    }

    if (swap.senderId !== userId && swap.receiverId !== userId) {
        return next(new apiError(403, "You are not part of this swap"));
    }

    const updateData = {};
    if (swap.senderId === userId) {
        if (swap.senderConfirmed) return next(new apiError(400, "You have already confirmed"));
        updateData.senderConfirmed = true;
    } else {
        if (swap.receiverConfirmed) return next(new apiError(400, "You have already confirmed"));
        updateData.receiverConfirmed = true;
    }

    const updatedSwap = await prisma.swapRequest.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
            sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            skill: true
        }
    });

    // Notify the other party
    const partnerId = swap.senderId === userId ? swap.receiverId : swap.senderId;
    const notification = await prisma.notification.create({
        data: {
            userId: partnerId,
            senderId: userId,
            type: "ESCROW_CONFIRMED",
            title: "Swap Confirmation Received",
            message: `${req.user.name} has confirmed their commitment to the swap.`,
        },
        include: { sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } }
    });

    try {
        const io = getIO();
        io.to(partnerId.toString()).emit("notification", notification);
        io.to(partnerId.toString()).emit("escrow_update", updatedSwap);
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    // Check if both confirmed
    const bothConfirmed = (updatedSwap.senderConfirmed && updatedSwap.receiverConfirmed);

    return res.status(200).json(new ApiResponse(200, { ...updatedSwap, bothConfirmed }, "Escrow confirmation recorded"));
});

// ─── CANCEL SWAP ───
const cancelSwap = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const swap = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });
    if (!swap) return next(new apiError(404, "Swap request not found"));

    if (swap.senderId !== userId && swap.receiverId !== userId) {
        return next(new apiError(403, "You are not part of this swap"));
    }

    if (swap.status === "COMPLETED" || swap.status === "CANCELLED") {
        return next(new apiError(400, `Swap is already ${swap.status.toLowerCase()}`));
    }

    // Check cancellation deadline - if scheduled and deadline passed
    if (swap.cancellationDeadline && new Date() > new Date(swap.cancellationDeadline)) {
        return next(new apiError(400, "Cancellation deadline has passed. Please file a dispute instead."));
    }

    // If swap is ACCEPTED and scheduled within 24 hours, warn but allow
    const updatedSwap = await prisma.swapRequest.update({
        where: { id: parseInt(id) },
        data: {
            status: "CANCELLED",
            cancelledBy: userId,
            cancelledAt: new Date(),
            cancellationReason: reason || "No reason provided"
        },
        include: {
            sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            skill: true
        }
    });

    // Notify the other party
    const partnerId = swap.senderId === userId ? swap.receiverId : swap.senderId;
    const notification = await prisma.notification.create({
        data: {
            userId: partnerId,
            senderId: userId,
            type: "SWAP_CANCELLED",
            title: "Swap Cancelled",
            message: `${req.user.name} has cancelled the swap. Reason: ${reason || 'No reason provided'}`,
        },
        include: { sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } }
    });

    try {
        const io = getIO();
        io.to(partnerId.toString()).emit("notification", notification);
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    return res.status(200).json(new ApiResponse(200, updatedSwap, "Swap cancelled successfully"));
});

// ─── SET CANCELLATION DEADLINE ───
const setCancellationDeadline = asynHandler(async (req, res, next) => {
    const { id } = req.params;
    const { deadline } = req.body;
    const userId = req.user.id;

    const swap = await prisma.swapRequest.findUnique({ where: { id: parseInt(id) } });
    if (!swap) return next(new apiError(404, "Swap request not found"));

    if (swap.receiverId !== userId) {
        return next(new apiError(403, "Only the receiver can set the cancellation deadline"));
    }

    if (swap.status !== "ACCEPTED") {
        return next(new apiError(400, "Can only set deadline for accepted swaps"));
    }

    const updatedSwap = await prisma.swapRequest.update({
        where: { id: parseInt(id) },
        data: { cancellationDeadline: new Date(deadline) },
        include: {
            sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            skill: true
        }
    });

    return res.status(200).json(new ApiResponse(200, updatedSwap, "Cancellation deadline set"));
});

// ─── ADMIN: GET ALL DISPUTES ───
const getAllDisputes = asynHandler(async (req, res) => {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
            where,
            include: {
                filedBy: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
                against: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
                swapRequest: {
                    select: {
                        id: true,
                        offeredSkill: true,
                        requestedSkill: true,
                        status: true,
                        scheduledAt: true,
                        duration: true,
                        senderConfirmed: true,
                        receiverConfirmed: true,
                        cancellationDeadline: true,
                        cancelledAt: true,
                        cancellationReason: true,
                        message: true,
                        sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                        receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
                    }
                },
                resolvedBy: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit)
        }),
        prisma.dispute.count({ where })
    ]);

    return res.status(200).json(new ApiResponse(200, {
        disputes,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
    }, "Disputes fetched"));
});

// ─── ADMIN: ESCALATE DISPUTE ───
const escalateDispute = asynHandler(async (req, res, next) => {
    const { disputeId } = req.params;
    const { adminNotes, priority } = req.body;

    const dispute = await prisma.dispute.findUnique({ where: { id: parseInt(disputeId) } });
    if (!dispute) return next(new apiError(404, "Dispute not found"));

    const updated = await prisma.dispute.update({
        where: { id: parseInt(disputeId) },
        data: {
            status: "ESCALATED",
            priority: priority || "HIGH",
            adminNotes: adminNotes || dispute.adminNotes
        },
        include: {
            filedBy: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            against: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            swapRequest: { select: { id: true, offeredSkill: true, requestedSkill: true } },
            resolvedBy: { select: { id: true, name: true } }
        }
    });

    // Notify both parties
    for (const userId of [dispute.filedById, dispute.againstId]) {
        const notification = await prisma.notification.create({
            data: {
                userId,
                senderId: req.user.id,
                type: "SYSTEM",
                title: "Dispute Escalated",
                message: `Your dispute has been escalated for priority review by admin.`,
            }
        });
        try {
            const io = getIO();
            io.to(userId.toString()).emit("notification", notification);
        } catch (err) { console.error(err.message); }
    }

    logAuditEvent({
        action: 'DISPUTE_RESOLVED',
        category: 'SECURITY',
        description: `Dispute #${disputeId} "${dispute.subject}" escalated to ${priority || 'HIGH'} by admin`,
        severity: 'WARNING',
        userId: dispute.filedById,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id, disputeId: parseInt(disputeId), priority: priority || 'HIGH' },
    });

    return res.status(200).json(new ApiResponse(200, updated, "Dispute escalated"));
});

// ─── ADMIN: RESOLVE DISPUTE ───
const resolveDispute = asynHandler(async (req, res, next) => {
    const { disputeId } = req.params;
    const { status, resolution, adminNotes } = req.body;

    if (!["RESOLVED", "DISMISSED"].includes(status)) {
        return next(new apiError(400, "Status must be RESOLVED or DISMISSED"));
    }

    const dispute = await prisma.dispute.findUnique({ where: { id: parseInt(disputeId) } });
    if (!dispute) return next(new apiError(404, "Dispute not found"));

    const updated = await prisma.dispute.update({
        where: { id: parseInt(disputeId) },
        data: {
            status,
            resolution: resolution || null,
            adminNotes: adminNotes || dispute.adminNotes,
            resolvedAt: new Date(),
            resolvedById: req.user.id
        },
        include: {
            filedBy: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            against: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            swapRequest: { select: { id: true, offeredSkill: true, requestedSkill: true } },
            resolvedBy: { select: { id: true, name: true } }
        }
    });

    // Notify both parties
    for (const userId of [dispute.filedById, dispute.againstId]) {
        const notification = await prisma.notification.create({
            data: {
                userId,
                senderId: req.user.id,
                type: "DISPUTE_RESOLVED",
                title: `Dispute ${status === "RESOLVED" ? "Resolved" : "Dismissed"}`,
                message: `Your dispute "${dispute.subject}" has been ${status.toLowerCase()} by admin.${resolution ? ` Resolution: ${resolution}` : ''}`,
            }
        });
        try {
            const io = getIO();
            io.to(userId.toString()).emit("notification", notification);
        } catch (err) { console.error(err.message); }
    }

    logAuditEvent({
        action: 'DISPUTE_RESOLVED',
        category: 'SECURITY',
        description: `Dispute #${disputeId} "${dispute.subject}" ${status.toLowerCase()} by admin`,
        severity: status === 'RESOLVED' ? 'INFO' : 'WARNING',
        userId: dispute.filedById,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id, disputeId: parseInt(disputeId), resolution: status },
    });

    return res.status(200).json(new ApiResponse(200, updated, `Dispute ${status.toLowerCase()}`));
});

// ─── ADMIN: GET DISPUTE STATS ───
const getDisputeStats = asynHandler(async (req, res) => {
    const [total, open, escalated, resolved, dismissed] = await Promise.all([
        prisma.dispute.count(),
        prisma.dispute.count({ where: { status: "OPEN" } }),
        prisma.dispute.count({ where: { status: "ESCALATED" } }),
        prisma.dispute.count({ where: { status: "RESOLVED" } }),
        prisma.dispute.count({ where: { status: "DISMISSED" } }),
    ]);

    return res.status(200).json(new ApiResponse(200, { total, open, escalated, resolved, dismissed }, "Dispute stats"));
});

export {
    fileDispute,
    getMyDisputes,
    escrowConfirm,
    cancelSwap,
    setCancellationDeadline,
    getAllDisputes,
    escalateDispute,
    resolveDispute,
    getDisputeStats
};
