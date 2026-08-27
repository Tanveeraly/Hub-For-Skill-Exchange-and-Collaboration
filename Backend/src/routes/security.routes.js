import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { isAdmin } from "../controllers/admin.controller.js";
import {
    getSecurityOverview,
    getAuditLogs,
    createAuditLog,
    exportAuditLogs,
} from "../controllers/security.controller.js";

const router = Router();

// All security routes require admin
router.use(verifyjwt, isAdmin);

router.get("/overview", getSecurityOverview);
router.get("/logs", getAuditLogs);
router.post("/logs", createAuditLog);
router.get("/export", exportAuditLogs);

export default router;
