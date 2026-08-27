import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { toggleBookmark, getUserBookmarks } from "../controllers/bookmark.controller.js";

const router = Router();

router.use(verifyjwt);

router.route("/").post(toggleBookmark); // Toggle bookmark
router.route("/").get(getUserBookmarks); // Get user bookmarks

export default router;
