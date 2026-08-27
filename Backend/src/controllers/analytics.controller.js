import { PrismaClient } from "../generated/prisma/index.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

const prisma = new PrismaClient();

const getUserAnalytics = asynHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching analytics for user ID:', userId);

        // 1. Swap Statistics (Be more inclusive to show "Real Data")
        console.log('Querying swap counts...');
        const allSwaps = await prisma.swapRequest.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            select: { id: true, status: true }
        });

        const totalSwaps = allSwaps.length;
        const activeSwaps = allSwaps.filter(s => s.status === 'ACCEPTED').length;
        const completedSwaps = allSwaps.filter(s => s.status === 'COMPLETED').length;
        const swapIds = allSwaps.map(s => s.id);

        console.log(`Swaps - Total: ${totalSwaps}, Active: ${activeSwaps}, Completed: ${completedSwaps}`);

        // 2. Work Session Analytics
        let workSessions = [];
        if (swapIds.length > 0) {
            console.log('Querying work sessions...');
            workSessions = await prisma.workSession.findMany({
                where: { swapRequestId: { in: swapIds } },
                select: { hoursWorked: true, startTime: true }
            });
        }
        
        const totalHours = workSessions.reduce((acc, session) => acc + (session.hoursWorked || 0), 0);
        const totalSessions = workSessions.length;
        console.log(`Work Sessions - Total: ${totalSessions}, Hours: ${totalHours}`);

        // 3. Overall Progress
        let progressReports = [];
        if (swapIds.length > 0) {
            console.log('Querying progress reports...');
            progressReports = await prisma.progressReport.findMany({
                where: {
                    swapRequestId: { in: swapIds },
                    swapRequest: { status: 'ACCEPTED' }
                },
                select: { completionPercentage: true }
            });
        }

        const overallProgress = progressReports.length > 0
            ? progressReports.reduce((acc, report) => acc + (report.completionPercentage || 0), 0) / progressReports.length
            : 0;
        console.log(`Overall Progress: ${overallProgress}%`);

        // 4. User Rating
        console.log('Querying ratings...');
        const ratings = await prisma.swapRating.findMany({
            where: { toUserId: userId },
            select: { rating: true }
        });
        
        const avgRating = ratings.length > 0 
            ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length 
            : 0;
        console.log(`Average Rating: ${avgRating}`);

        // 5. Activity Over Time (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSessions = workSessions.filter(s => s.startTime && new Date(s.startTime) >= sevenDaysAgo);

        // Group manually by date
        const weeklyActivityMap = new Map();
        recentSessions.forEach(session => {
            if (session.startTime) {
                const dateKey = new Date(session.startTime).toISOString().split('T')[0];
                if (!weeklyActivityMap.has(dateKey)) {
                    weeklyActivityMap.set(dateKey, {
                        startTime: new Date(session.startTime).toISOString(),
                        _sum: { hoursWorked: 0 }
                    });
                }
                const existing = weeklyActivityMap.get(dateKey);
                existing._sum.hoursWorked += (session.hoursWorked || 0);
            }
        });

        const weeklyActivity = Array.from(weeklyActivityMap.values())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        console.log('Analytics generation complete. Sending response...');
        return res.status(200).json(new ApiResponse(200, {
            totalSwaps,
            activeSwaps,
            runningProjects: activeSwaps,
            totalHours: Number(totalHours.toFixed(2)),
            totalSessions,
            overallProgress: Math.round(overallProgress),
            averageRating: Number(avgRating.toFixed(1)),
            weeklyActivity
        }, "User analytics fetched successfully"));
    } catch (error) {
        console.error('ANALYTICS ERROR:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch analytics",
            error: error.message,
            at: "getUserAnalytics"
        });
    }
});

const getSkillTrends = asynHandler(async (req, res) => {
    // Top 5 most requested skills (mock logic or real based on SwapRequest fields if structured)
    // Since skills in SwapRequest are strings, we might aggregate from UserSkill or SkillListing activity
    
    // Aggregating from SkillListing views or Connections could be better, but for now lets aggregate listed skills
    const skillCounts = await prisma.userSkill.groupBy({
        by: ['skillName'],
        _count: {
            skillName: true
        },
        orderBy: {
            _count: {
                skillName: 'desc'
            }
        },
        take: 5
    });

    const trends = skillCounts.map(s => ({
        name: s.skillName,
        count: s._count.skillName
    }));

    return res.status(200).json(new ApiResponse(200, trends, "Skill trends fetched"));
});

export { getUserAnalytics, getSkillTrends };
