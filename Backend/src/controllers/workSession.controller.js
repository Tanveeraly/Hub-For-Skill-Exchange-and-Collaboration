import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { getIO } from "../utlis/chat.socket.js";

const prisma = new PrismaClient();

const startWorkSession = asynHandler(async (req, res, next) => {
    const { swapRequestId, description } = req.body;
    const userId = req.user.id;

    const swap = await prisma.swapRequest.findUnique({ where: { id: parseInt(swapRequestId) } });
    if (!swap || (swap.senderId !== userId && swap.receiverId !== userId)) {
        return next(new apiError(403, "Not authorized to start work on this swap"));
    }

    if (swap.status !== "ACCEPTED") {
        return next(new apiError(400, "You can only track work sessions for accepted swaps"));
    }

    // Check if there's already an active session
    const activeSession = await prisma.workSession.findFirst({
        where: { swapRequestId: parseInt(swapRequestId), endTime: null }
    });

    if (activeSession) {
        return next(new apiError(400, "A work session is already active for this swap"));
    }

    const session = await prisma.workSession.create({
        data: {
            swapRequestId: parseInt(swapRequestId),
            description,
            startTime: new Date()
        }
    });

    const partnerId = swap.senderId === userId ? swap.receiverId : swap.senderId;
    try {
        const io = getIO();
        io.to(partnerId.toString()).emit("session_started", { 
            swapRequestId: parseInt(swapRequestId), 
            senderName: req.user.name 
        });
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    return res.status(201).json(new ApiResponse(201, session, "Work session started"));
});

const endWorkSession = asynHandler(async (req, res, next) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await prisma.workSession.findUnique({
        where: { id: parseInt(sessionId) },
        include: { swapRequest: true }
    });

    if (!session || (session.swapRequest.senderId !== userId && session.swapRequest.receiverId !== userId)) {
        return next(new apiError(404, "Work session not found or access denied"));
    }

    if (session.endTime) {
        return next(new apiError(400, "Work session already ended"));
    }

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const hoursWorked = Math.abs(endTime - startTime) / 36e5; // Convert ms to hours

    const updatedSession = await prisma.workSession.update({
        where: { id: parseInt(sessionId) },
        data: {
            endTime,
            hoursWorked: parseFloat(hoursWorked.toFixed(2))
        }
    });

    const partnerId = session.swapRequest.senderId === userId ? session.swapRequest.receiverId : session.swapRequest.senderId;
    try {
        const io = getIO();
        io.to(partnerId.toString()).emit("session_stopped", { 
            swapRequestId: session.swapRequestId, 
            senderName: req.user.name 
        });
    } catch (err) {
        console.error("Socket notification failed:", err.message);
    }

    return res.status(200).json(new ApiResponse(200, updatedSession, "Work session ended"));
});

const getWorkSessions = asynHandler(async (req, res, next) => {
    const { swapRequestId } = req.params;
    const userId = req.user.id;

    const sessions = await prisma.workSession.findMany({
        where: {
            swapRequestId: parseInt(swapRequestId),
            swapRequest: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            }
        },
        orderBy: { startTime: 'desc' }
    });

    return res.status(200).json(new ApiResponse(200, sessions, "Work sessions fetched"));
});

export { startWorkSession, endWorkSession, getWorkSessions };
