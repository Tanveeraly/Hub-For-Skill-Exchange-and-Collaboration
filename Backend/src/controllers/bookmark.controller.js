import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

const prisma = new PrismaClient();

const toggleBookmark = asynHandler(async (req, res, next) => {
  const { skillId } = req.body;
  const userId = req.user.id;

  if (!skillId) {
    return next(new apiError(400, "Skill ID is required"));
  }

  const existingBookmark = await prisma.bookmark.findFirst({
    where: {
      userId,
      skillId: parseInt(skillId),
    },
  });

  if (existingBookmark) {
    await prisma.bookmark.delete({
      where: { id: existingBookmark.id },
    });
    return res.status(200).json(new ApiResponse(200, { bookmarked: false }, "Bookmark removed"));
  } else {
    await prisma.bookmark.create({
      data: {
        userId,
        skillId: parseInt(skillId),
      },
    });
    return res.status(201).json(new ApiResponse(201, { bookmarked: true }, "Bookmark added"));
  }
});

const getUserBookmarks = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      skill: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { avatarUrl: true }
              }
            }
          },
          category: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, bookmarks, "Bookmarks fetched successfully"));
});

export { toggleBookmark, getUserBookmarks };
