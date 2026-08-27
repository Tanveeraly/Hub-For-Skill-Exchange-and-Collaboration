import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

const prisma = new PrismaClient();

const addComment = asynHandler(async (req, res, next) => {
  const { skillId, text } = req.body;
  const userId = req.user.id;

  if (!skillId || !text) {
    return next(new apiError(400, "Skill ID and text are required"));
  }

  const comment = await prisma.comment.create({
    data: {
      text,
      skillId: parseInt(skillId),
      userId,
    },
    include: {
      user: {
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

  return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getCommentsByPost = asynHandler(async (req, res, next) => {
  const { skillId } = req.params;

  const comments = await prisma.comment.findMany({
    where: { skillId: parseInt(skillId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
           profile: {
            select: { avatarUrl: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const deleteComment = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });

  if (!comment) {
    return next(new apiError(404, "Comment not found"));
  }

  if (comment.userId !== userId) {
    return next(new apiError(403, "You are not authorized to delete this comment"));
  }

  await prisma.comment.delete({ where: { id: parseInt(id) } });

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { addComment, getCommentsByPost, deleteComment };
