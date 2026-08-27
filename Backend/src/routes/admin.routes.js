import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import {
    isAdmin,
    getAdminOverview,
    getAllUsersAdmin,
    suspendUser,
    deleteUser,
    getAllPortfoliosAdmin,
    deletePortfolio,
    getAllCertificationsAdmin,
    verifyCertification,
    deleteCertification,
    getAllComplaints,
    resolveComplaint,
    createComplaint,
    getJobLogs,
    deletePostAdmin,
} from "../controllers/admin.controller.js";

const router = Router();

// Complaint submission - requires auth
router.post("/complaints", verifyjwt, createComplaint);

// Admin routes - secured with verifyjwt and isAdmin middlewares
router.use(verifyjwt, isAdmin);

router.get("/overview", getAdminOverview);
router.get("/users", getAllUsersAdmin);
router.patch("/users/:userId/suspend", suspendUser);
router.delete("/users/:userId", deleteUser);
router.get("/portfolios", getAllPortfoliosAdmin);
router.delete("/portfolios/:portfolioId", deletePortfolio);
router.get("/certifications", getAllCertificationsAdmin);
router.patch("/certifications/:certId/verify", verifyCertification);
router.delete("/certifications/:certId", deleteCertification);
router.get("/complaints", getAllComplaints);
router.patch("/complaints/:complaintId", resolveComplaint);
router.get("/jobs", getJobLogs);
router.delete("/posts/:postId", deletePostAdmin);

export default router;
