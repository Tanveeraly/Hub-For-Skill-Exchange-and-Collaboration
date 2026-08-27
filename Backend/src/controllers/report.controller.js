import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

import { getIO } from "../utlis/chat.socket.js";

const prisma = new PrismaClient();

const createReport = asynHandler(async (req, res, next) => {
    const { swapRequestId, type, content, completionPercentage, attachments } = req.body;
    const userId = req.user.id;

    const swap = await prisma.swapRequest.findUnique({ where: { id: parseInt(swapRequestId) } });
    if (!swap || (swap.senderId !== userId && swap.receiverId !== userId)) {
        return next(new apiError(403, "Not authorized to submit reports for this swap"));
    }

    const partnerId = swap.senderId === userId ? swap.receiverId : swap.senderId;

    const report = await prisma.progressReport.create({
        data: {
            swapRequestId: parseInt(swapRequestId),
            userId,
            partnerId,
            type: type || "DAILY",
            content,
            completionPercentage: parseInt(completionPercentage) || 0,
            attachments: attachments || []
        }
    });

    // Notify partner
    await prisma.notification.create({
        data: {
            userId: partnerId,
            senderId: userId,
            type: "SYSTEM",
            title: `${type === 'WEEKLY' ? 'Weekly' : 'Daily'} Progress Report`,
            message: `${req.user.name} has submitted a new progress report for your swap.`
        }
    });

    // Emit socket event for real-time update
    const io = getIO();
    io.to(partnerId.toString()).emit("new_report", report);

    return res.status(201).json(new ApiResponse(201, report, "Progress report submitted"));
});

const getReports = asynHandler(async (req, res, next) => {
    const { swapRequestId } = req.params;
    const userId = req.user.id;

    const reports = await prisma.progressReport.findMany({
        where: {
            swapRequestId: parseInt(swapRequestId),
            swapRequest: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(new ApiResponse(200, reports, "Progress reports fetched"));
});

export { createReport, getReports };
