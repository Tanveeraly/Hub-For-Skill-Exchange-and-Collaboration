import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { createSwapRequest, getReceivedSwapRequests, respondToSwapRequest, getSentSwapRequests, proposeReschedule, completeSwap, requestMoreInfo, attachFileToSwap } from "../controllers/swap.controller.js";

const router = Router();

router.use(verifyjwt);

router.route("/").post(createSwapRequest); // Send swap request
router.route("/sent").get(getSentSwapRequests); // Get sent requests
router.route("/received").get(getReceivedSwapRequests); // Get received requests
router.route("/:id/respond").post(respondToSwapRequest); // Accept/Reject
router.route("/:id/reschedule").post(proposeReschedule); // Propose reschedule
router.route("/:id/complete").post(completeSwap); // Mark as completed
router.route("/:id/request-info").post(requestMoreInfo); // Request more info
router.route("/:id/attach").post(attachFileToSwap); // Attach file

export default router;

