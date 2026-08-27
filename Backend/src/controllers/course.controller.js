import { asynHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// ─── ADMIN ENDPOINTS ───

export const createCourse = asynHandler(async (req, res, next) => {
    const { title, description, level, hours, imageUrl, skills } = req.body;
    
    if (!title || !description || !hours || !skills) {
        return next(new apiError(400, "Title, description, hours, and skills are required"));
    }

    const course = await prisma.course.create({
        data: {
            title,
            description,
            level: level || "BEGINNER",
            hours: Number(hours),
            imageUrl: imageUrl || null,
            skills
        }
    });

    return res.status(201).json(new ApiResponse(201, course, "Course created successfully"));
});

export const updateCourse = asynHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const updateData = req.body;
    
    const course = await prisma.course.update({
        where: { id: parseInt(courseId) },
        data: updateData
    });

    return res.status(200).json(new ApiResponse(200, course, "Course updated successfully"));
});

export const deleteCourse = asynHandler(async (req, res, next) => {
    const { courseId } = req.params;
    
    await prisma.course.delete({
        where: { id: parseInt(courseId) }
    });

    return res.status(200).json(new ApiResponse(200, null, "Course deleted successfully"));
});

// ─── PUBLIC / USER ENDPOINTS ───

export const getAllCourses = asynHandler(async (req, res, next) => {
    const courses = await prisma.course.findMany({
        orderBy: { createdAt: "desc" }
    });
    
    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully"));
});

export const registerForCourse = asynHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    const course = await prisma.course.findUnique({
        where: { id: parseInt(courseId) }
    });

    if (!course) {
        return next(new apiError(404, "Course not found"));
    }

    // Check if already registered
    const existing = await prisma.courseRegistration.findUnique({
        where: {
            userId_courseId: { userId, courseId: parseInt(courseId) }
        }
    });

    if (existing) {
        return next(new apiError(400, "Already registered for this course"));
    }

    const registration = await prisma.courseRegistration.create({
        data: {
            userId,
            courseId: parseInt(courseId),
            progress: 0,
            status: "IN_PROGRESS"
        },
        include: { course: true }
    });

    return res.status(201).json(new ApiResponse(201, registration, "Successfully registered for course"));
});

export const getUserRegistrations = asynHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    const registrations = await prisma.courseRegistration.findMany({
        where: { userId },
        include: { course: true },
        orderBy: { registeredAt: "desc" }
    });
    
    return res.status(200).json(new ApiResponse(200, registrations, "Registrations fetched successfully"));
});

export const updateCourseProgress = asynHandler(async (req, res, next) => {
    const { courseId } = req.params;
    const { progress } = req.body;
    const userId = req.user.id;

    if (progress < 0 || progress > 100) {
        return next(new apiError(400, "Progress must be between 0 and 100"));
    }

    let registration = await prisma.courseRegistration.findUnique({
        where: { userId_courseId: { userId, courseId: parseInt(courseId) } },
        include: { course: true }
    });

    if (!registration) {
        return next(new apiError(404, "Course registration not found"));
    }

    const isComplete = progress === 100;
    const status = isComplete ? "COMPLETED" : "IN_PROGRESS";
    const completedAt = isComplete ? new Date() : null;

    registration = await prisma.courseRegistration.update({
        where: { id: registration.id },
        data: {
            progress: Number(progress),
            status,
            completedAt
        },
        include: { course: true }
    });

    // If just completed, generate a certificate
    if (isComplete) {
        // Check if certificate already exists
        const existingCert = await prisma.skillCertification.findFirst({
            where: {
                userId,
                courseId: parseInt(courseId)
            }
        });

        if (!existingCert) {
            await prisma.skillCertification.create({
                data: {
                    skillName: registration.course.title,
                    hoursLogged: registration.course.hours,
                    partnerVerified: true, // Platform verified
                    userId,
                    courseId: registration.course.id,
                    provider: "SkillHub",
                    platformName: "SkillHub",
                    verificationStatus: "VERIFIED"
                }
            });
        }
    }

    return res.status(200).json(new ApiResponse(200, registration, "Progress updated successfully"));
});
