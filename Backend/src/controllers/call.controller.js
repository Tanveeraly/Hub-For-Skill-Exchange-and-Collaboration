import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Get call history for the authenticated user
 * Returns both outgoing and incoming calls
 */
const getCallHistory = asynHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const calls = await prisma.call.findMany({
            where: {
                OR: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                caller: {
                    select: {
                        id: true,
                        name: true,
                        profile: { select: { avatarUrl: true } }
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        profile: { select: { avatarUrl: true } }
                    }
                }
            }
        });

        // Format call history for frontend
        const formattedCalls = calls.map(call => ({
            id: call.id,
            type: call.callType.toLowerCase(),
            status: call.status.toLowerCase(),
            duration: call.duration,
            createdAt: call.createdAt,
            isOutgoing: call.callerId === userId,
            otherUser: call.callerId === userId
                ? {
                    id: call.receiver.id,
                    name: call.receiver.name,
                    avatarUrl: call.receiver.profile?.avatarUrl
                }
                : {
                    id: call.caller.id,
                    name: call.caller.name,
                    avatarUrl: call.caller.profile?.avatarUrl
                }
        }));

        return res.status(200).json(new ApiResponse(200, formattedCalls, "Call history fetched successfully"));
    } catch (error) {
        console.error("Error fetching call history:", error);
        return next(new apiError(500, "Failed to fetch call history"));
    }
});

/**
 * Save a call record manually (for missed/rejected calls)
 * Completed calls are saved automatically by socket handler
 */
const saveCallRecord = asynHandler(async (req, res, next) => {
    const { callerId, receiverId, callType, status, duration } = req.body;

    if (!callerId || !receiverId || !callType || !status) {
        return next(new apiError(400, "Missing required fields: callerId, receiverId, callType, status"));
    }

    const validTypes = ['AUDIO', 'VIDEO'];
    const validStatuses = ['MISSED', 'COMPLETED', 'REJECTED'];

    if (!validTypes.includes(callType.toUpperCase())) {
        return next(new apiError(400, "Invalid call type. Must be AUDIO or VIDEO"));
    }

    if (!validStatuses.includes(status.toUpperCase())) {
        return next(new apiError(400, "Invalid call status. Must be MISSED, COMPLETED, or REJECTED"));
    }

    try {
        const call = await prisma.call.create({
            data: {
                callerId: parseInt(callerId),
                receiverId: parseInt(receiverId),
                callType: callType.toUpperCase(),
                status: status.toUpperCase(),
                duration: duration ? parseInt(duration) : null,
                startedAt: status === 'COMPLETED' ? new Date(Date.now() - (duration || 0) * 1000) : null,
                endedAt: status === 'COMPLETED' ? new Date() : null
            }
        });

        return res.status(201).json(new ApiResponse(201, call, "Call record saved successfully"));
    } catch (error) {
        console.error("Error saving call record:", error);
        return next(new apiError(500, "Failed to save call record"));
    }
});

/**
 * Delete a call record from history
 */
const deleteCallRecord = asynHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { callId } = req.params;

    if (!callId) {
        return next(new apiError(400, "Call ID is required"));
    }

    try {
        // Verify the call belongs to the user
        const call = await prisma.call.findFirst({
            where: {
                id: parseInt(callId),
                OR: [
                    { callerId: userId },
                    { receiverId: userId }
                ]
            }
        });

        if (!call) {
            return next(new apiError(404, "Call record not found or access denied"));
        }

        await prisma.call.delete({
            where: { id: parseInt(callId) }
        });

        return res.status(200).json(new ApiResponse(200, null, "Call record deleted successfully"));
    } catch (error) {
        console.error("Error deleting call record:", error);
        return next(new apiError(500, "Failed to delete call record"));
    }
});

export {
    getCallHistory,
    saveCallRecord,
    deleteCallRecord
};
