import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { logAuditEvent } from "./security.controller.js";
import os from "os";

const prisma = new PrismaClient();

// ─── ADMIN MIDDLEWARE ───
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return next(new apiError(403, "Access denied. Admin only."));
    }
    next();
};

// ─── ADMIN OVERVIEW ───
const getAdminOverview = asynHandler(async (req, res) => {
    const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalPortfolios,
        totalCertifications,
        pendingCertifications,
        totalComplaints,
        openComplaints,
        totalSwaps,
        completedSwaps,
        totalDisputes,
        openDisputes,
        escalatedDisputes,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "ACTIVE" } }),
        prisma.user.count({ where: { status: "SUSPENDED" } }),
        prisma.portfolio.count(),
        prisma.skillCertification.count(),
        prisma.skillCertification.count({ where: { verificationStatus: "PENDING" } }),
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: "OPEN" } }),
        prisma.swapRequest.count(),
        prisma.swapRequest.count({ where: { status: "COMPLETED" } }),
        prisma.dispute.count(),
        prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
        prisma.dispute.count({ where: { status: "ESCALATED" } }),
    ]);

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersThisWeek = await prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
    });

    return res.status(200).json(new ApiResponse(200, {
        totalUsers,
        activeUsers,
        suspendedUsers,
        newUsersThisWeek,
        totalPortfolios,
        totalCertifications,
        pendingCertifications,
        totalComplaints,
        openComplaints,
        totalSwaps,
        completedSwaps,
        totalDisputes,
        openDisputes,
        escalatedDisputes,
        serverHealth: {
            totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
            freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
            usedMemoryPercent: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1) + "%",
            cpuLoad: os.loadavg()[0].toFixed(2),
            uptime: (os.uptime() / 3600).toFixed(1) + " Hours",
            platform: os.platform(),
            architecture: os.arch()
        }
    }, "Admin overview fetched"));
});

// ─── USER MANAGEMENT ───
const getAllUsersAdmin = asynHandler(async (req, res) => {
    const { search, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
        ];
    }
    if (status) {
        where.status = status;
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                isVerified: true,
                provider: true,
                createdAt: true,
                profile: { select: { avatarUrl: true, location: true } },
                _count: {
                    select: {
                        portfolios: true,
                        skills: true,
                        certifications: true,
                        sentSwaps: true,
                        receivedSwaps: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.user.count({ where }),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        users,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    }, "Users fetched"));
});

const suspendUser = asynHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return next(new apiError(404, "User not found"));
    if (user.role === "ADMIN") return next(new apiError(400, "Cannot suspend admin"));

    const updated = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { status: user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED" },
        select: { id: true, name: true, email: true, status: true },
    });

    logAuditEvent({
        action: 'ACCOUNT_SUSPENDED',
        category: 'USER_MGMT',
        description: `User ${updated.name} (${updated.email}) ${updated.status === 'SUSPENDED' ? 'suspended' : 'reactivated'} by admin`,
        severity: updated.status === 'SUSPENDED' ? 'WARNING' : 'INFO',
        userId: parseInt(userId),
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id, newStatus: updated.status },
    });

    return res.status(200).json(new ApiResponse(200, updated,
        `User ${updated.status === "SUSPENDED" ? "suspended" : "reactivated"} successfully`));
});

const deleteUser = asynHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return next(new apiError(404, "User not found"));
    if (user.role === "ADMIN") return next(new apiError(400, "Cannot delete admin"));

    logAuditEvent({
        action: 'ACCOUNT_DELETED',
        category: 'USER_MGMT',
        description: `User ${user.name} (${user.email}) deleted by admin`,
        severity: 'CRITICAL',
        userId: parseInt(userId),
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id, deletedUserEmail: user.email },
    });

    await prisma.user.delete({ where: { id: parseInt(userId) } });
    return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

// ─── PORTFOLIO MANAGEMENT ───
const getAllPortfoliosAdmin = asynHandler(async (req, res) => {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
        ];
    }

    const [portfolios, total] = await Promise.all([
        prisma.portfolio.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.portfolio.count({ where }),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        portfolios,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    }, "Portfolios fetched"));
});

const deletePortfolio = asynHandler(async (req, res, next) => {
    const { portfolioId } = req.params;
    const portfolio = await prisma.portfolio.findUnique({ where: { id: parseInt(portfolioId) } });
    if (!portfolio) return next(new apiError(404, "Portfolio not found"));

    logAuditEvent({
        action: 'PORTFOLIO_DELETED',
        category: 'CONTENT',
        description: `Portfolio "${portfolio.title}" (ID: ${portfolioId}) deleted by admin`,
        severity: 'INFO',
        userId: portfolio.userId,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id },
    });

    await prisma.portfolio.delete({ where: { id: parseInt(portfolioId) } });
    return res.status(200).json(new ApiResponse(200, null, "Portfolio deleted successfully"));
});

// ─── CERTIFICATION MANAGEMENT ───
const getAllCertificationsAdmin = asynHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { swapRequestId: null }; // Only external certs
    if (status) {
        where.verificationStatus = status;
    }

    const [certifications, total] = await Promise.all([
        prisma.skillCertification.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
                swapRequest: { select: { offeredSkill: true, requestedSkill: true } },
            },
            orderBy: { issuedAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.skillCertification.count({ where }),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        certifications,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    }, "Certifications fetched"));
});

const verifyCertification = asynHandler(async (req, res, next) => {
    const { certId } = req.params;
    const { action } = req.body; // 'VERIFIED' or 'REJECTED'

    if (!["VERIFIED", "REJECTED"].includes(action)) {
        return next(new apiError(400, "Action must be VERIFIED or REJECTED"));
    }

    const cert = await prisma.skillCertification.findUnique({ where: { id: parseInt(certId) } });
    if (!cert) return next(new apiError(404, "Certification not found"));

    const updated = await prisma.skillCertification.update({
        where: { id: parseInt(certId) },
        data: {
            verificationStatus: action,
            partnerVerified: action === "VERIFIED",
        },
    });

    logAuditEvent({
        action: action === 'VERIFIED' ? 'CERT_VERIFIED' : 'CERT_REJECTED',
        category: 'CONTENT',
        description: `Certificate for "${cert.skillName}" (ID: ${certId}) ${action.toLowerCase()} by admin`,
        severity: action === 'REJECTED' ? 'WARNING' : 'INFO',
        userId: cert.userId,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id, certAction: action },
    });

    return res.status(200).json(new ApiResponse(200, updated, `Certification ${action.toLowerCase()}`));
});

const deleteCertification = asynHandler(async (req, res, next) => {
    const { certId } = req.params;
    const cert = await prisma.skillCertification.findUnique({ where: { id: parseInt(certId) } });
    if (!cert) return next(new apiError(404, "Certification not found"));

    logAuditEvent({
        action: 'CERT_REJECTED',
        category: 'CONTENT',
        description: `Certificate "${cert.skillName}" (ID: ${certId}) deleted by admin`,
        severity: 'WARNING',
        userId: cert.userId,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id },
    });

    await prisma.skillCertification.delete({ where: { id: parseInt(certId) } });
    return res.status(200).json(new ApiResponse(200, null, "Certification deleted"));
});

// ─── COMPLAINT MANAGEMENT ───
const getAllComplaints = asynHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
        where.status = status;
    }

    const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
            where,
            include: {
                sender: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
                target: { select: { id: true, name: true, email: true, profile: { select: { avatarUrl: true } } } },
                post: { select: { id: true, title: true, description: true } }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.complaint.count({ where }),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        complaints,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    }, "Complaints fetched"));
});

const resolveComplaint = asynHandler(async (req, res, next) => {
    const { complaintId } = req.params;
    const { status } = req.body; // 'RESOLVED' or 'DISMISSED'

    if (!["RESOLVED", "DISMISSED"].includes(status)) {
        return next(new apiError(400, "Status must be RESOLVED or DISMISSED"));
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: parseInt(complaintId) } });
    if (!complaint) return next(new apiError(404, "Complaint not found"));

    const updated = await prisma.complaint.update({
        where: { id: parseInt(complaintId) },
        data: { status },
    });

    logAuditEvent({
        action: 'COMPLAINT_RESOLVED',
        category: 'USER_MGMT',
        description: `Complaint #${complaintId} ${status.toLowerCase()} by admin`,
        severity: 'INFO',
        userId: complaint.senderId,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id, complaintStatus: status },
    });

    return res.status(200).json(new ApiResponse(200, updated, `Complaint ${status.toLowerCase()}`));
});

// ─── CREATE COMPLAINT (for regular users) ───
const createComplaint = asynHandler(async (req, res, next) => {
    const { subject, description, targetId, postId } = req.body;
    const senderId = req.user.id;

    if (!subject || !description) {
        return next(new apiError(400, "Subject and description are required"));
    }

    const complaint = await prisma.complaint.create({
        data: {
            subject,
            description,
            senderId,
            targetId: targetId ? parseInt(targetId) : null,
            postId: postId ? parseInt(postId) : null,
        },
    });

    return res.status(201).json(new ApiResponse(201, complaint, "Complaint submitted successfully"));
});

// ─── AUTOMATED JOB LOGS ───
const getJobLogs = asynHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
        prisma.jobLog.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
        }),
        prisma.jobLog.count(),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        logs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    }, "Job logs fetched"));
});

// ─── POST MANAGEMENT ───
const deletePostAdmin = asynHandler(async (req, res, next) => {
    const { postId } = req.params;
    const post = await prisma.skillListing.findUnique({ where: { id: parseInt(postId) } });
    if (!post) return next(new apiError(404, "Post not found"));

    logAuditEvent({
        action: 'POST_DELETED',
        category: 'CONTENT',
        description: `Post "${post.title}" (ID: ${postId}) deleted by admin`,
        severity: 'WARNING',
        userId: post.userId,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
        metadata: { adminId: req.user.id },
    });

    await prisma.skillListing.delete({ where: { id: parseInt(postId) } });
    return res.status(200).json(new ApiResponse(200, null, "Post deleted successfully"));
});

export {
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
};
