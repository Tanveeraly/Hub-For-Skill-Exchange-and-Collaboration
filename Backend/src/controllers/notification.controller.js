
import { asynHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const getUserNotifications = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
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

  return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
});

const markNotificationAsRead = asynHandler(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(notificationId) }
  });

  if (!notification) {
    return next(new apiError(404, "Notification not found"));
  }

  if (notification.userId !== userId) {
    return next(new apiError(403, "Not authorized"));
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: parseInt(notificationId) },
    data: { isRead: true }
  });

  return res.status(200).json(new ApiResponse(200, updatedNotification, "Notification marked as read"));
});

const markAllNotificationsAsRead = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true }
  });

  return res.status(200).json(new ApiResponse(200, {}, "All notifications marked as read"));
});

const clearAllNotifications = asynHandler(async (req, res, next) => {
    const userId = req.user.id;
  
    await prisma.notification.deleteMany({
      where: { userId }
    });
  
    return res.status(200).json(new ApiResponse(200, {}, "All notifications cleared"));
});

export {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
    clearAllNotifications
};
