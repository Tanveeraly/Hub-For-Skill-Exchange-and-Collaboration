import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

const prisma = new PrismaClient();

// ─── SECURITY OVERVIEW ───
const getSecurityOverview = asynHandler(async (req, res) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLogs, failedLogins, blockedAttacks, activeUsers, recentCritical, logsByCategory, logsByDayRaw] = await Promise.all([
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { action: 'FAILED_LOGIN', createdAt: { gte: twentyFourHoursAgo } } }),
        prisma.auditLog.count({ where: { OR: [{ action: 'ACCOUNT_SUSPENDED' }, { severity: 'CRITICAL' }], createdAt: { gte: twentyFourHoursAgo } } }),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.auditLog.count({ where: { severity: 'CRITICAL', createdAt: { gte: sevenDaysAgo } } }),
        prisma.auditLog.groupBy({ by: ['category'], _count: { id: true } }),
        prisma.$queryRaw`SELECT DATE("createdAt") as date, COUNT(*)::int as count FROM "AuditLog" WHERE "createdAt" >= ${sevenDaysAgo} GROUP BY DATE("createdAt") ORDER BY date ASC`,
    ]);

    // Normalize logsByDay — Prisma raw queries may return BigInt/Date objects
    const logsByDay = (logsByDayRaw || []).map((row) => ({
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
        count: Number(row.count),
    }));

    // Normalize logsByCategory for cleaner frontend consumption
    const normalizedCategories = (logsByCategory || []).map((cat) => ({
        category: cat.category,
        _count: { id: Number(cat._count?.id ?? 0) },
        count: Number(cat._count?.id ?? 0),
    }));

    return res.status(200).json(new ApiResponse(200, {
        totalLogs,
        failedLogins,
        blockedAttacks,
        activeUsers,
        recentCritical,
        logsByCategory: normalizedCategories,
        logsByDay,
    }, "Security overview fetched"));
});

// ─── GET AUDIT LOGS ───
const getAuditLogs = asynHandler(async (req, res) => {
    const { search, action, category, severity, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
        where.OR = [
            { description: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
    }
    if (action) where.action = action;
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, role: true, profile: { select: { avatarUrl: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit),
        }),
        prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json(new ApiResponse(200, {
        logs,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
    }, "Audit logs fetched"));
});

// ─── CREATE AUDIT LOG ───
const createAuditLog = asynHandler(async (req, res) => {
    const { action, category, description, severity, metadata, userId } = req.body;

    if (!action) {
        return res.status(400).json(new ApiResponse(400, null, 'Action is required'));
    }

    const log = await prisma.auditLog.create({
        data: {
            action,
            category: category || 'SYSTEM',
            description,
            severity: severity || 'INFO',
            metadata,
            userId: userId ? parseInt(userId) : null,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
            userAgent: req.headers['user-agent'] || null,
        },
    });

    return res.status(201).json(new ApiResponse(201, log, "Audit log created"));
});

// ─── EXPORT AUDIT LOGS ───
const exportAuditLogs = asynHandler(async (req, res) => {
    const { format = 'csv', startDate, endDate, action, category } = req.query;

    const where = {};
    if (action) where.action = action;
    if (category) where.category = category;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
        where,
        include: {
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
    });

    if (format === 'csv') {
        const headers = 'ID,Action,Category,Description,Severity,User,Email,IP Address,Date\n';
        const rows = logs.map(l =>
            `${l.id},"${l.action}","${l.category}","${(l.description || '').replace(/"/g, '""')}","${l.severity}","${l.user?.name || 'System'}","${l.user?.email || 'N/A'}","${l.ipAddress || 'N/A'}","${new Date(l.createdAt).toISOString()}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.csv`);
        return res.send(headers + rows);
    }

    // JSON format
    return res.status(200).json(new ApiResponse(200, logs, "Audit logs exported"));
});

// ─── UTILITY: LOG AUDIT EVENT PROGRAMMATICALLY ───
const logAuditEvent = async ({ action, category, description, severity, userId, ipAddress, userAgent, metadata }) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                category: category || 'SYSTEM',
                description,
                severity: severity || 'INFO',
                userId,
                ipAddress,
                userAgent,
                metadata,
            },
        });
    } catch (err) {
        console.error('Failed to create audit log:', err);
    }
};

export {
    getSecurityOverview,
    getAuditLogs,
    createAuditLog,
    exportAuditLogs,
    logAuditEvent,
};
