import { Router } from "express";
import { verifyjwt as verifyJWT } from "../middlewares/authmiddleware.js";
import { getUserAnalytics, getSkillTrends } from "../controllers/analytics.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/user-stats", getUserAnalytics);
router.get("/trends", getSkillTrends);

export default router;
