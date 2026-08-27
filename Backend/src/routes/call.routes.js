import express from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { getCallHistory, saveCallRecord, deleteCallRecord } from "../controllers/call.controller.js";

const router = express.Router();

// Get call history for authenticated user
router.get("/history", verifyjwt, getCallHistory);

// Save a call record (for missed/rejected calls)
router.post("/record", verifyjwt, saveCallRecord);

// Delete a call record from history
router.delete("/:callId", verifyjwt, deleteCallRecord);

export { router as CallRoutes };
