import { asynHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

const sendConnectionRequest = asynHandler(async (req, res, next) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (!receiverId) {
    return next(new apiError(400, "Receiver ID is required"));
  }

  if (senderId === parseInt(receiverId)) {
    return next(new apiError(400, "Cannot send connection request to yourself"));
  }

  // Check if connection already exists
  const existingConnection = await prisma.connection.findFirst({
    where: {
      OR: [
        { senderId, receiverId: parseInt(receiverId) },
        { senderId: parseInt(receiverId), receiverId: senderId }
      ]
    }
  });

  if (existingConnection) {
    if (existingConnection.status === 'ACCEPTED') {
      return next(new apiError(400, "You are already connected"));
    }
    if (existingConnection.status === 'PENDING') {
      return next(new apiError(400, "Connection request already pending"));
    }
    // If REJECTED, we might allow resending, but for now blocking
    // return next(new apiError(400, "Connection request was rejected"));
  }

  const connection = await prisma.connection.create({
    data: {
      senderId,
      receiverId: parseInt(receiverId),
      status: 'PENDING'
    }
  });

  // Create Notification for Receiver
  await prisma.notification.create({
    data: {
      userId: parseInt(receiverId),
      senderId: senderId,
      type: 'CONNECTION_REQUEST',
      title: 'New Connection Request',
      message: `${req.user.name} sent you a connection request.`
    }
  });

  return res.status(201).json(new ApiResponse(201, connection, "Connection request sent successfully"));
});

const acceptConnectionRequest = asynHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  const userId = req.user.id;

  const connection = await prisma.connection.findUnique({
    where: { id: parseInt(connectionId) }
  });

  if (!connection) {
    return next(new apiError(404, "Connection request not found"));
  }

  // Only the receiver can accept
  if (connection.receiverId !== userId) {
    return next(new apiError(403, "Not authorized to accept this request"));
  }

  if (connection.status !== 'PENDING') {
    return next(new apiError(400, "Connection request is not pending"));
  }

  const updatedConnection = await prisma.connection.update({
    where: { id: parseInt(connectionId) },
    data: { status: 'ACCEPTED' }
  });

  // Create Notification for Sender (now connected)
  await prisma.notification.create({
    data: {
      userId: connection.senderId,
      senderId: userId,
      type: 'CONNECTION_ACCEPTED',
      title: 'Connection Accepted',
      message: `${req.user.name} accepted your connection request. You are now connected!`
    }
  });

  return res.status(200).json(new ApiResponse(200, updatedConnection, "Connection accepted successfully"));
});

const rejectConnectionRequest = asynHandler(async (req, res, next) => {
  const { connectionId } = req.params;
  const userId = req.user.id;

  const connection = await prisma.connection.findUnique({
    where: { id: parseInt(connectionId) }
  });

  if (!connection) {
    return next(new apiError(404, "Connection request not found"));
  }

  // Only the receiver can reject (or sender can cancel?)
  // Let's assume only receiver rejects for now. Sender canceling is a different action (delete).
  if (connection.receiverId !== userId) {
    return next(new apiError(403, "Not authorized to reject this request"));
  }

  const updatedConnection = await prisma.connection.update({
    where: { id: parseInt(connectionId) },
    data: { status: 'REJECTED' }
  });

  return res.status(200).json(new ApiResponse(200, updatedConnection, "Connection rejected"));
});

const getPendingRequests = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const requests = await prisma.connection.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING'
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: { avatarUrl: true, bio: true }
          }
        }
      }
    }
  });

  return res.status(200).json(new ApiResponse(200, requests, "Pending requests fetched successfully"));
});

const getConnections = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const connections = await prisma.connection.findMany({
    where: {
      AND: [
        { status: 'ACCEPTED' },
        { OR: [{ senderId: userId }, { receiverId: userId }] }
      ]
    },
    include: {
      sender: {
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

  // Transform data to return the OTHER user (the connection)
  const connectedUsers = connections.map(conn => {
    return conn.senderId === userId ? conn.receiver : conn.sender;
  });

  return res.status(200).json(new ApiResponse(200, connectedUsers, "Connections fetched successfully"));
});

const getSentRequests = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const requests = await prisma.connection.findMany({
    where: {
      senderId: userId,
      status: 'PENDING'
    },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          profile: {
            select: { avatarUrl: true }
          }
        }
      }
    }
  });

  return res.status(200).json(new ApiResponse(200, requests, "Sent requests fetched successfully"));
});

export {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  getConnections,
  getSentRequests
};
