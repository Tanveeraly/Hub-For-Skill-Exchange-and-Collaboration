import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { startWorkSession, endWorkSession, getWorkSessions } from "../controllers/workSession.controller.js";
import { createReport, getReports } from "../controllers/report.controller.js";

const router = Router();

router.use(verifyjwt);

// Work Sessions
router.post("/sessions/start", startWorkSession);
router.post("/sessions/:sessionId/end", endWorkSession);
router.get("/sessions/:swapRequestId", getWorkSessions);

// Progress Reports
router.post("/reports", createReport);
router.get("/reports/:swapRequestId", getReports);

export default router;
