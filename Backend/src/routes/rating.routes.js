import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { submitRating, getUserRatings } from "../controllers/rating.controller.js";

const router = Router();

router.use(verifyjwt);

router.post("/", submitRating);
router.get("/user/:userId", getUserRatings);

export default router;
