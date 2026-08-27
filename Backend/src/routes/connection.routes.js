import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  getConnections,
  getSentRequests
} from "../controllers/connection.controller.js";

const router = Router();

router.use(verifyjwt); // Apply auth middleware to all routes

router.post("/request", sendConnectionRequest);
router.post("/accept/:connectionId", acceptConnectionRequest);
router.post("/reject/:connectionId", rejectConnectionRequest);
router.get("/pending", getPendingRequests);
router.get("/sent", getSentRequests);
router.get("/", getConnections);

export default router;
