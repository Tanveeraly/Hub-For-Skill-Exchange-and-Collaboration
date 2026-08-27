import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { uploadOncloudinary } from "../utlis/cloudinary.js";
import fs from "fs";

const prisma = new PrismaClient();

const createPost = asynHandler(async (req, res, next) => {
  const { title, description, location, isFeatured, price, categoryId, visibility } = req.body;
  const userId = req.user.id;

  if (!title) {
    return next(new apiError(400, "Title is required"));
  }

  let mediaUrl = null;
  
  // Handle file upload if present
  if (req.file) {
    const uploadResult = await uploadOncloudinary(req.file.path);
    if (uploadResult) {
      mediaUrl = uploadResult.secure_url || uploadResult.url;
    }
  }

  const post = await prisma.skillListing.create({
    data: {
      title,
      description,
      location,
      price: price ? parseFloat(price) : null,
      isFeatured: isFeatured || false,
      userId,
      categoryId: categoryId ? parseInt(categoryId) : null,
      mediaUrl: mediaUrl,
      visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
    },
  });

  return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

const getAllPosts = asynHandler(async (req, res, next) => {
  const userId = req.user?.id;

  const posts = await prisma.skillListing.findMany({
    where: { visibility: 'PUBLIC' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: { avatarUrl: true }
          }
        }
      },
      category: true,
      _count: {
        select: { comments: true, bookmarks: true, likes: true }
      },
      likes: userId ? {
        where: { userId: userId },
        select: { id: true }
      } : false
    },
    orderBy: { createdAt: "desc" },
  });

  const postsWithLikeStatus = posts.map(post => ({
    ...post,
    isLiked: userId ? post.likes.length > 0 : false,
    likes: undefined,
  }));

  return res.status(200).json(new ApiResponse(200, postsWithLikeStatus, "Posts fetched successfully"));
});

const getPostById = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const post = await prisma.skillListing.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
             select: { avatarUrl: true }
          }
        }
      },
      category: true,
      comments: {
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
        orderBy: { createdAt: "desc" }
      },
      _count: {
         select: { bookmarks: true }
      }
    },
  });

  if (!post) {
    return next(new apiError(404, "Post not found"));
  }

  return res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
});

const deletePost = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const post = await prisma.skillListing.findUnique({ where: { id: parseInt(id) } });

  if (!post) {
    return next(new apiError(404, "Post not found"));
  }

  if (post.userId !== userId) {
    return next(new apiError(403, "You are not authorized to delete this post"));
  }

  await prisma.skillListing.delete({ where: { id: parseInt(id) } });

  return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});


const getUserPosts = asynHandler(async (req, res, next) => {
  const userId = req.user.id; // Get logged-in user's ID

  const posts = await prisma.skillListing.findMany({
    where: { userId },
    include: {
      category: true,
      _count: {
        select: { comments: true, bookmarks: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json(new ApiResponse(200, posts, "User posts fetched successfully"));
});

const likePost = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if post exists
  const post = await prisma.skillListing.findUnique({ where: { id: parseInt(id) } });
  if (!post) {
    return next(new apiError(404, "Post not found"));
  }

  // Check if already liked
  const existingLike = await prisma.postLike.findFirst({
    where: {
      postId: parseInt(id),
      userId: userId,
    },
  });

  if (existingLike) {
    return res.status(400).json(new ApiResponse(400, null, "Post already liked"));
  }

  // Create like
  await prisma.postLike.create({
    data: {
      postId: parseInt(id),
      userId: userId,
    },
  });

  // Get updated like count
  const likeCount = await prisma.postLike.count({
    where: { postId: parseInt(id) },
  });

  return res.status(200).json(new ApiResponse(200, { liked: true, likeCount }, "Post liked successfully"));
});

const unlikePost = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Find the like
  const existingLike = await prisma.postLike.findFirst({
    where: {
      postId: parseInt(id),
      userId: userId,
    },
  });

  if (!existingLike) {
    return res.status(400).json(new ApiResponse(400, null, "Post not liked yet"));
  }

  // Delete like
  await prisma.postLike.delete({
    where: { id: existingLike.id },
  });

  // Get updated like count
  const likeCount = await prisma.postLike.count({
    where: { postId: parseInt(id) },
  });

  return res.status(200).json(new ApiResponse(200, { liked: false, likeCount }, "Post unliked successfully"));
});

const getCategories = asynHandler(async (req, res, next) => {
  const categories = await prisma.skillCategory.findMany({
    orderBy: { name: "asc" }
  });
  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

const updatePostVisibility = asynHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { visibility } = req.body;

  if (!visibility || !['PUBLIC', 'PRIVATE'].includes(visibility)) {
    return next(new apiError(400, "visibility must be 'PUBLIC' or 'PRIVATE'"));
  }

  const post = await prisma.skillListing.findUnique({ where: { id: parseInt(id) } });
  if (!post) return next(new apiError(404, "Post not found"));
  if (post.userId !== userId) return next(new apiError(403, "Not authorized to update this post"));

  const updated = await prisma.skillListing.update({
    where: { id: parseInt(id) },
    data: { visibility },
  });

  return res.status(200).json(new ApiResponse(200, updated, `Post visibility updated to ${visibility}`));
});

export { createPost, getAllPosts, getPostById, deletePost, getUserPosts, likePost, unlikePost, getCategories, updatePostVisibility };
