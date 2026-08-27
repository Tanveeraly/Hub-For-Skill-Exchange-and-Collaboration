
import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
} from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyjwt);

router.get("/", getUserNotifications);
router.post("/:notificationId/read", markNotificationAsRead);
router.post("/read-all", markAllNotificationsAsRead);
router.delete("/clear-all", clearAllNotifications);

export default router;
