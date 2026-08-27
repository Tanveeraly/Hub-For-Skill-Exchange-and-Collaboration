import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import {
    getCareerProfile,
    generateResume,
    getSkillCertifications,
    getCareerAnalytics,
    getLinkedInExport,
    getEndorsements,
    createEndorsement,
    addExternalCertification,
    getRecommendations,
} from "../controllers/career.controller.js";

const router = Router();

router.use(verifyjwt);

router.get("/profile", getCareerProfile);
router.get("/resume", generateResume);
router.get("/certifications", getSkillCertifications);
router.get("/analytics", getCareerAnalytics);
router.get("/linkedin-export", getLinkedInExport);
router.get("/endorsements", getEndorsements);
router.post("/endorsements", createEndorsement);
router.post("/external-certification", addExternalCertification);
router.get("/recommendations", getRecommendations);

export default router;

