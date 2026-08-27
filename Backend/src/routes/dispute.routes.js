import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { isAdmin } from "../controllers/admin.controller.js";
import {
    fileDispute,
    getMyDisputes,
    escrowConfirm,
    cancelSwap,
    setCancellationDeadline,
    getAllDisputes,
    escalateDispute,
    resolveDispute,
    getDisputeStats
} from "../controllers/dispute.controller.js";

const router = Router();

// User routes
router.use(verifyjwt);
router.post("/file", fileDispute);
router.get("/my", getMyDisputes);
router.post("/:id/escrow-confirm", escrowConfirm);
router.post("/:id/cancel", cancelSwap);
router.post("/:id/deadline", setCancellationDeadline);

// Admin routes
router.get("/admin/all", isAdmin, getAllDisputes);
router.get("/admin/stats", isAdmin, getDisputeStats);
router.patch("/admin/:disputeId/escalate", isAdmin, escalateDispute);
router.patch("/admin/:disputeId/resolve", isAdmin, resolveDispute);

export default router;
