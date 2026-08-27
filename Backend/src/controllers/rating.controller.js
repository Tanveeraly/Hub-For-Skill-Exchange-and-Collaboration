import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

const prisma = new PrismaClient();

const submitRating = asynHandler(async (req, res, next) => {
    const { swapRequestId, rating, feedback } = req.body;
    const fromUserId = req.user.id;

    if (!swapRequestId || !rating) {
        return next(new apiError(400, "Swap Request ID and Rating are required"));
    }

    const swapRequest = await prisma.swapRequest.findUnique({
        where: { id: parseInt(swapRequestId) },
        include: { rating: true }
    });

    if (!swapRequest) {
        return next(new apiError(404, "Swap request not found"));
    }

    if (swapRequest.status !== "COMPLETED") {
        return next(new apiError(400, "Can only rate completed swaps"));
    }

    if (swapRequest.senderId !== fromUserId && swapRequest.receiverId !== fromUserId) {
        return next(new apiError(403, "Not authorized to rate this swap"));
    }

    // Check if user already rated
    const existingRating = await prisma.swapRating.findFirst({
        where: {
            swapRequestId: parseInt(swapRequestId),
            fromUserId
        }
    });

    if (existingRating) {
        return next(new apiError(400, "You have already rated this swap"));
    }

    const toUserId = fromUserId === swapRequest.senderId ? swapRequest.receiverId : swapRequest.senderId;

    const newRating = await prisma.swapRating.create({
        data: {
            rating: parseInt(rating),
            feedback,
            swapRequestId: parseInt(swapRequestId),
            fromUserId,
            toUserId
        }
    });

    // Update user's average rating (optional but recommended)
    // For now, we'll just store and can calculate on the fly

    return res.status(201).json(new ApiResponse(201, newRating, "Rating submitted successfully"));
});

const getUserRatings = asynHandler(async (req, res, next) => {
    const { userId } = req.params;

    const ratings = await prisma.swapRating.findMany({
        where: { toUserId: parseInt(userId) },
        include: {
            fromUser: {
                select: { name: true, profile: { select: { avatarUrl: true } } }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const averageRating = ratings.length > 0 
        ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
        : 0;

    return res.status(200).json(new ApiResponse(200, { ratings, averageRating }, "User ratings fetched"));
});

export { submitRating, getUserRatings };
