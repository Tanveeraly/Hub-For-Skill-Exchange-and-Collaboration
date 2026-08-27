import { Router } from "express";
import { verifyjwt } from "../middlewares/authmiddleware.js";
import { isAdmin } from "../controllers/admin.controller.js";
import {
    createCourse,
    updateCourse,
    deleteCourse,
    getAllCourses,
    registerForCourse,
    getUserRegistrations,
    updateCourseProgress
} from "../controllers/course.controller.js";

const router = Router();

// Public / All users routes
router.get("/", getAllCourses);

// User registration routes (require auth)
router.use("/registrations", verifyjwt);
router.get("/registrations", getUserRegistrations);
router.post("/:courseId/register", registerForCourse);
router.patch("/:courseId/progress", updateCourseProgress);

// Admin routes (require auth + admin)
router.post("/", verifyjwt, isAdmin, createCourse);
router.put("/:courseId", verifyjwt, isAdmin, updateCourse);
router.delete("/:courseId", verifyjwt, isAdmin, deleteCourse);

export default router;
