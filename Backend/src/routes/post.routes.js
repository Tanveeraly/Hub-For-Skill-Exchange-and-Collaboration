import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { createPost, getAllPosts, getPostById, deletePost, getUserPosts, likePost, unlikePost, getCategories, updatePostVisibility } from "../controllers/post.controller.js";
import { upload } from "../middlewares/multermiddleware.js";

const router = Router();

router.route("/categories").get(getCategories);
router.route("/").get(getAllPosts);
router.route("/").post(verifyjwt, upload.single("media"), createPost); // Create post with optional file upload
router.route("/my-posts").get(verifyjwt, getUserPosts); // Get user's own posts
router.route("/:id").get(verifyjwt, getPostById); // Get post details
router.route("/:id").delete(verifyjwt, deletePost); // Delete post
router.route("/:id/like").post(verifyjwt, likePost); // Like post
router.route("/:id/like").delete(verifyjwt, unlikePost); // Unlike post
router.route("/:id/visibility").patch(verifyjwt, updatePostVisibility); // Toggle post visibility

export default router;
