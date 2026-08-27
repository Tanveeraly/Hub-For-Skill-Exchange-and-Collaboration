import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { addComment, getCommentsByPost, deleteComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyjwt); // Apply verifyJWT to all routes

router.route("/").post(addComment); // Add comment
router.route("/:skillId").get(getCommentsByPost); // Get comments for a post
router.route("/:id").delete(deleteComment); // Delete comment

export default router;
