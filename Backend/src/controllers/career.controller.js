import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";
import { getIO } from "../utlis/chat.socket.js";

const prisma = new PrismaClient();

// ─── GET CAREER PROFILE (Resume Data Aggregation) ───
const getCareerProfile = asynHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true, name: true, email: true,
            profile: { select: { bio: true, avatarUrl: true, location: true, website: true, socialLinks: true } },
            skills: { select: { id: true, skillName: true, expertiseLevel: true } },
        }
    });

    // Completed swaps
    const completedSwaps = await prisma.swapRequest.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: "COMPLETED"
        },
        include: {
            sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            workSessions: { select: { hoursWorked: true } },
        },
        orderBy: { updatedAt: "desc" }
    });

    // Ratings received
    const ratings = await prisma.swapRating.findMany({
        where: { toUserId: userId },
        select: { rating: true, feedback: true, fromUser: { select: { name: true } }, createdAt: true }
    });

    const avgRating = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        : 0;

    // Total hours
    const swapIds = completedSwaps.map(s => s.id);
    let totalHours = 0;
    if (swapIds.length > 0) {
        const sessions = await prisma.workSession.findMany({
            where: { swapRequestId: { in: swapIds } },
            select: { hoursWorked: true }
        });
        totalHours = sessions.reduce((acc, s) => acc + (s.hoursWorked || 0), 0);
    }

    // Certifications
    const certifications = await prisma.skillCertification.findMany({
        where: { userId },
        orderBy: { issuedAt: "desc" }
    });

    // Endorsements
    const endorsements = await prisma.skillEndorsement.findMany({
        where: { endorseeId: userId },
        include: {
            endorser: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
        },
        orderBy: { createdAt: "desc" }
    });

    // Build experience from swaps
    const experience = completedSwaps.map(swap => {
        const partner = swap.senderId === userId ? swap.receiver : swap.sender;
        const swapHours = swap.workSessions.reduce((acc, s) => acc + (s.hoursWorked || 0), 0);
        return {
            id: swap.id,
            offeredSkill: swap.offeredSkill,
            requestedSkill: swap.requestedSkill,
            partnerName: partner?.name,
            partnerAvatar: partner?.profile?.avatarUrl,
            hoursWorked: Number(swapHours.toFixed(2)),
            completedAt: swap.updatedAt,
            scheduledAt: swap.scheduledAt,
        };
    });

    return res.status(200).json(new ApiResponse(200, {
        user,
        experience,
        totalHours: Number(totalHours.toFixed(2)),
        totalCompletedSwaps: completedSwaps.length,
        averageRating: Number(avgRating.toFixed(1)),
        ratings,
        certifications,
        endorsements,
    }, "Career profile fetched successfully"));
});

// ─── GENERATE RESUME (Structured JSON for PDF) ───
const generateResume = asynHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true, email: true,
            profile: { select: { bio: true, location: true, website: true, socialLinks: true, avatarUrl: true } },
            skills: { select: { skillName: true, expertiseLevel: true } },
        }
    });

    const completedSwaps = await prisma.swapRequest.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: "COMPLETED"
        },
        include: {
            sender: { select: { name: true } },
            receiver: { select: { name: true } },
            workSessions: { select: { hoursWorked: true, startTime: true, endTime: true } },
        },
        orderBy: { updatedAt: "desc" }
    });

    const certifications = await prisma.skillCertification.findMany({
        where: { userId },
        select: { certificateId: true, skillName: true, hoursLogged: true, partnerVerified: true, issuedAt: true }
    });

    const endorsements = await prisma.skillEndorsement.findMany({
        where: { endorseeId: userId },
        include: { endorser: { select: { name: true } } }
    });

    const ratings = await prisma.swapRating.findMany({
        where: { toUserId: userId },
        select: { rating: true }
    });

    const avgRating = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
        : 0;

    let totalHours = 0;
    const swapExperience = completedSwaps.map(swap => {
        const partner = swap.senderId === userId ? swap.receiver : swap.sender;
        const hours = swap.workSessions.reduce((acc, s) => acc + (s.hoursWorked || 0), 0);
        totalHours += hours;
        return {
            role: `Skill Exchange: ${swap.offeredSkill}`,
            description: `Exchanged ${swap.offeredSkill} for ${swap.requestedSkill} with ${partner?.name}`,
            hours: Number(hours.toFixed(2)),
            completedAt: swap.updatedAt,
        };
    });

    return res.status(200).json(new ApiResponse(200, {
        name: user?.name || "Anonymous",
        email: user?.email,
        bio: user?.profile?.bio || "",
        location: user?.profile?.location || "",
        website: user?.profile?.website || "",
        avatarUrl: user?.profile?.avatarUrl || "",
        skills: user?.skills || [],
        experience: swapExperience,
        certifications,
        endorsements: endorsements.map(e => ({
            skill: e.skillName,
            message: e.message,
            endorserName: e.endorser.name,
        })),
        totalHours: Number(totalHours.toFixed(2)),
        totalSwaps: completedSwaps.length,
        averageRating: Number(avgRating.toFixed(1)),
        generatedAt: new Date().toISOString(),
    }, "Resume data generated"));
});

// ─── GET SKILL CERTIFICATIONS ───
const getSkillCertifications = asynHandler(async (req, res) => {
    const userId = req.user.id;

    // Only fetch external certificates (no swap-linked ones)
    const certifications = await prisma.skillCertification.findMany({
        where: { 
            userId,
            swapRequestId: null, // Only external certs, not swap certs
        },
        orderBy: { issuedAt: "desc" }
    });

    return res.status(200).json(new ApiResponse(200, certifications, "Certifications fetched"));
});

// ─── CAREER ANALYTICS ───
const getCareerAnalytics = asynHandler(async (req, res) => {
    const userId = req.user.id;

    // All swaps
    const allSwaps = await prisma.swapRequest.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        select: { id: true, status: true, offeredSkill: true, requestedSkill: true, senderId: true, createdAt: true, updatedAt: true }
    });

    const completed = allSwaps.filter(s => s.status === "COMPLETED");
    const active = allSwaps.filter(s => s.status === "ACCEPTED");

    // Skills learned (from completed swaps where user received the skill)
    const skillsLearned = {};
    completed.forEach(swap => {
        const learned = swap.senderId === userId ? swap.requestedSkill : swap.offeredSkill;
        if (learned) {
            skillsLearned[learned] = (skillsLearned[learned] || 0) + 1;
        }
    });

    // Hours per skill
    const swapIds = allSwaps.map(s => s.id);
    const sessions = swapIds.length > 0 ? await prisma.workSession.findMany({
        where: { swapRequestId: { in: swapIds } },
        include: { swapRequest: { select: { offeredSkill: true, requestedSkill: true, senderId: true } } }
    }) : [];

    const hoursPerSkill = {};
    sessions.forEach(s => {
        const skill = s.swapRequest.senderId === userId ? s.swapRequest.requestedSkill : s.swapRequest.offeredSkill;
        if (skill) {
            hoursPerSkill[skill] = (hoursPerSkill[skill] || 0) + (s.hoursWorked || 0);
        }
    });

    // Rating trend
    const ratings = await prisma.swapRating.findMany({
        where: { toUserId: userId },
        select: { rating: true, createdAt: true },
        orderBy: { createdAt: "asc" }
    });

    // Monthly progress (swaps completed per month)
    const monthlyProgress = {};
    completed.forEach(swap => {
        const monthKey = new Date(swap.updatedAt).toISOString().slice(0, 7); // YYYY-MM
        monthlyProgress[monthKey] = (monthlyProgress[monthKey] || 0) + 1;
    });

    // Endorsement count
    const endorsementCount = await prisma.skillEndorsement.count({ where: { endorseeId: userId } });

    // Certification count
    const certCount = await prisma.skillCertification.count({ where: { userId } });

    const totalHours = Object.values(hoursPerSkill).reduce((a, b) => a + b, 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, r) => a + r.rating, 0) / ratings.length : 0;

    return res.status(200).json(new ApiResponse(200, {
        totalSwaps: allSwaps.length,
        completedSwaps: completed.length,
        activeSwaps: active.length,
        completionRate: allSwaps.length > 0 ? Math.round((completed.length / allSwaps.length) * 100) : 0,
        skillsLearned: Object.entries(skillsLearned).map(([name, count]) => ({ name, count })),
        hoursPerSkill: Object.entries(hoursPerSkill).map(([skill, hours]) => ({ skill, hours: Number(Number(hours).toFixed(2)) })),
        totalHours: Number(Number(totalHours).toFixed(2)),
        ratingTrend: ratings.map(r => ({ rating: r.rating, date: r.createdAt })),
        averageRating: Number(avgRating.toFixed(1)),
        monthlyProgress: Object.entries(monthlyProgress).map(([month, count]) => ({ month, count })),
        endorsementCount,
        certificationCount: certCount,
    }, "Career analytics fetched"));
});

// ─── LINKEDIN EXPORT ───
const getLinkedInExport = asynHandler(async (req, res) => {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            profile: { select: { bio: true, location: true } },
            skills: { select: { skillName: true, expertiseLevel: true } }
        }
    });

    const completedSwaps = await prisma.swapRequest.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: "COMPLETED"
        },
        include: {
            sender: { select: { name: true } },
            receiver: { select: { name: true } },
            workSessions: { select: { hoursWorked: true } },
        },
        orderBy: { updatedAt: "desc" }
    });

    const ratings = await prisma.swapRating.findMany({
        where: { toUserId: userId },
        select: { rating: true }
    });

    const avgRating = ratings.length > 0
        ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1)
        : "N/A";

    const totalHours = completedSwaps.reduce((acc, swap) => {
        return acc + swap.workSessions.reduce((a, s) => a + (s.hoursWorked || 0), 0);
    }, 0);

    const skillsList = (user?.skills || []).map(s => s.skillName).join(" · ");

    // Generate headline
    const topSkills = (user?.skills || []).slice(0, 3).map(s => s.skillName).join(", ");
    const headline = `${topSkills} Specialist | ${completedSwaps.length} Skill Exchanges Completed | SkillSwap Platform`;

    // Generate summary
    const summary = `Passionate skill exchanger with ${completedSwaps.length} completed skill swaps and ${Number(totalHours.toFixed(0))}+ hours of collaborative learning. Rated ${avgRating}/5 by swap partners. Skilled in ${skillsList}.\n\n${user?.profile?.bio || ""}`;

    // Generate experience entries
    const experienceEntries = completedSwaps.slice(0, 5).map(swap => {
        const partner = swap.senderId === userId ? swap.receiver : swap.sender;
        const hours = swap.workSessions.reduce((a, s) => a + (s.hoursWorked || 0), 0);
        const date = new Date(swap.updatedAt);
        return {
            title: `Skill Exchange: ${swap.offeredSkill} ↔ ${swap.requestedSkill}`,
            organization: "SkillSwap Platform",
            period: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            description: `Collaborated with ${partner?.name} in a peer-to-peer skill exchange. Taught ${swap.offeredSkill} while learning ${swap.requestedSkill}. Logged ${Number(hours.toFixed(1))} hours of productive collaboration.`,
        };
    });

    // Certifications
    const certs = await prisma.skillCertification.findMany({
        where: { userId },
        select: { skillName: true, hoursLogged: true, issuedAt: true, certificateId: true }
    });

    const certEntries = certs.map(c => ({
        name: `Verified Skill: ${c.skillName}`,
        organization: "SkillSwap Platform",
        issued: new Date(c.issuedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        credentialId: c.certificateId,
    }));

    return res.status(200).json(new ApiResponse(200, {
        headline,
        summary,
        skillsList,
        experienceEntries,
        certEntries,
        stats: {
            totalSwaps: completedSwaps.length,
            totalHours: Number(totalHours.toFixed(1)),
            averageRating: avgRating,
        }
    }, "LinkedIn export data generated"));
});

// ─── GET ENDORSEMENTS ───
const getEndorsements = asynHandler(async (req, res) => {
    const userId = req.user.id;

    const endorsements = await prisma.skillEndorsement.findMany({
        where: { endorseeId: userId },
        include: {
            endorser: {
                select: { id: true, name: true, profile: { select: { avatarUrl: true } } }
            },
            swapRequest: {
                select: { offeredSkill: true, requestedSkill: true, updatedAt: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    // Also get swaps eligible for endorsement (completed swaps where partner hasn't endorsed you yet)
    const completedSwaps = await prisma.swapRequest.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
            status: "COMPLETED"
        },
        include: {
            sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            receiver: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
            endorsements: { where: { endorserId: userId } }
        }
    });

    const eligibleForEndorsement = completedSwaps
        .filter(swap => swap.endorsements.length === 0)
        .map(swap => {
            const partner = swap.senderId === userId ? swap.receiver : swap.sender;
            return {
                swapId: swap.id,
                partnerId: partner.id,
                partnerName: partner.name,
                partnerAvatar: partner.profile?.avatarUrl,
                offeredSkill: swap.offeredSkill,
                requestedSkill: swap.requestedSkill,
            };
        });

    return res.status(200).json(new ApiResponse(200, {
        endorsements,
        eligibleForEndorsement
    }, "Endorsements fetched"));
});

// ─── CREATE ENDORSEMENT ───
const createEndorsement = asynHandler(async (req, res, next) => {
    const { swapRequestId, skillName, message } = req.body;
    const endorserId = req.user.id;

    if (!swapRequestId || !skillName) {
        return next(new apiError(400, "Swap Request ID and skill name are required"));
    }

    const swap = await prisma.swapRequest.findUnique({
        where: { id: parseInt(swapRequestId) },
        include: {
            sender: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } }
        }
    });

    if (!swap) return next(new apiError(404, "Swap not found"));
    if (swap.status !== "COMPLETED") return next(new apiError(400, "Can only endorse after swap completion"));
    if (swap.senderId !== endorserId && swap.receiverId !== endorserId) {
        return next(new apiError(403, "Not authorized"));
    }

    const endorseeId = endorserId === swap.senderId ? swap.receiverId : swap.senderId;

    // Check duplicate
    const exists = await prisma.skillEndorsement.findUnique({
        where: { endorserId_endorseeId_swapRequestId: { endorserId, endorseeId, swapRequestId: parseInt(swapRequestId) } }
    });
    if (exists) return next(new apiError(400, "You have already endorsed this partner for this swap"));

    const endorsement = await prisma.skillEndorsement.create({
        data: {
            skillName,
            message,
            endorserId,
            endorseeId,
            swapRequestId: parseInt(swapRequestId),
        },
        include: {
            endorser: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }
        }
    });

    // Create notification
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: endorseeId,
                senderId: endorserId,
                type: "ENDORSEMENT",
                title: "New Skill Endorsement",
                message: `${req.user.name} endorsed your ${skillName} skill!`,
            },
            include: { sender: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } } }
        });
        const io = getIO();
        io.to(endorseeId.toString()).emit("notification", notification);
    } catch (err) {
        console.error("Endorsement notification failed:", err.message);
    }

    return res.status(201).json(new ApiResponse(201, endorsement, "Endorsement submitted successfully"));
});

// ─── ADD EXTERNAL CERTIFICATION ───
const addExternalCertification = asynHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { skillName, provider, credentialUrl, hoursLogged, certImage, platformName } = req.body;

    if (!skillName) {
        return next(new apiError(400, "Skill name is required"));
    }

    const cert = await prisma.skillCertification.create({
        data: {
            skillName,
            hoursLogged: hoursLogged ? parseFloat(hoursLogged) : 0,
            partnerVerified: false,
            provider: provider || null,
            credentialUrl: credentialUrl || null,
            certImage: certImage || null,
            platformName: platformName || null,
            verificationStatus: "PENDING",
            userId,
        }
    });

    return res.status(201).json(new ApiResponse(201, cert, "External certification added — pending admin verification"));
});

// ─── SEED DEFAULT COURSES IF EMPTY ───
const seedDefaultCoursesIfEmpty = async () => {
    const count = await prisma.course.count();
    if (count === 0) {
        const defaultCourses = [
            {
                title: "Full-Stack Web Development",
                description: "Master React, Node.js, Express, and databases to build complete dynamic web applications from scratch.",
                level: "ADVANCED",
                hours: 40,
                skills: "React, Node.js, JavaScript, Express, SQL, Database",
                imageUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&auto=format&fit=crop&q=60"
            },
            {
                title: "Introduction to UI/UX Design",
                description: "Learn Figma, visual design theory, wireframing, and user research best practices to create stunning interfaces.",
                level: "BEGINNER",
                hours: 15,
                skills: "UI Design, Figma, Design, Wireframing, UX Research",
                imageUrl: "https://images.unsplash.com/photo-1561070791-26c113006238?w=600&auto=format&fit=crop&q=60"
            },
            {
                title: "Python for Data Science",
                description: "Unlock machine learning, data visualization, pandas, numpy, and python analytics patterns.",
                level: "INTERMEDIATE",
                hours: 25,
                skills: "Python, Data Science, Machine Learning, Analytics, Pandas",
                imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=60"
            },
            {
                title: "Digital Marketing Masterclass",
                description: "Grow any business with SEO, social media marketing, advertising campaigns, and growth analytics.",
                level: "BEGINNER",
                hours: 12,
                skills: "Marketing, SEO, Digital Marketing, Social Media, Growth",
                imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60"
            },
            {
                title: "Mobile App Development with React Native",
                description: "Build premium cross-platform iOS and Android mobile apps using React and Native components.",
                level: "ADVANCED",
                hours: 30,
                skills: "React Native, Mobile Development, Android, iOS, JavaScript",
                imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=60"
            }
        ];
        for (const course of defaultCourses) {
            await prisma.course.create({ data: course });
        }
        console.log("Seeded default courses successfully");
    }
};

// ─── GET RECOMMENDATIONS (Expertise Match & Growth Suggestion System) ───
const getRecommendations = asynHandler(async (req, res) => {
    const userId = req.user.id;

    // Seed courses if they are empty
    await seedDefaultCoursesIfEmpty();

    // 1. Get current user skills
    const currentUserSkills = await prisma.userSkill.findMany({
        where: { userId },
        select: { skillName: true, expertiseLevel: true }
    });
    const offeredSkills = currentUserSkills.map(s => s.skillName.toLowerCase());

    // 2. Fetch current user interests (desired skills)
    // A) From bookmarks
    const bookmarks = await prisma.bookmark.findMany({
        where: { userId },
        include: { skill: { select: { title: true, description: true } } }
    });
    
    // B) From course registrations
    const registrations = await prisma.courseRegistration.findMany({
        where: { userId },
        include: { course: { select: { skills: true } } }
    });

    // C) From swaps sent
    const sentSwaps = await prisma.swapRequest.findMany({
        where: { senderId: userId },
        select: { requestedSkill: true }
    });

    const desiredSkillsSet = new Set();
    
    bookmarks.forEach(b => {
        if (b.skill?.title) desiredSkillsSet.add(b.skill.title.toLowerCase());
    });
    
    registrations.forEach(r => {
        if (r.course?.skills) {
            r.course.skills.split(',').forEach(s => desiredSkillsSet.add(s.trim().toLowerCase()));
        }
    });

    sentSwaps.forEach(s => {
        if (s.requestedSkill) desiredSkillsSet.add(s.requestedSkill.toLowerCase());
    });

    // 3. Compute global skill demand trends
    // Count requested skills in SwapRequests
    const swapRequests = await prisma.swapRequest.findMany({
        select: { requestedSkill: true }
    });
    
    const demandMap = {};
    swapRequests.forEach(sr => {
        if (sr.requestedSkill) {
            const skill = sr.requestedSkill.trim();
            if (skill) {
                demandMap[skill] = (demandMap[skill] || 0) + 1;
            }
        }
    });

    // Let's add some default demand counts for popular skills to bootstrap if no swaps exist yet
    const bootstrapSkills = ["React", "UI Design", "Python", "Node.js", "Figma", "Data Science", "Marketing", "Machine Learning"];
    bootstrapSkills.forEach(s => {
        demandMap[s] = (demandMap[s] || 0) + Math.floor(Math.random() * 5) + 2;
    });

    const demandTrends = Object.entries(demandMap)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // If desiredSkills is empty, populate it with top global demanded skills that the user doesn't already have
    if (desiredSkillsSet.size === 0) {
        demandTrends.forEach(item => {
            const skillLower = item.skill.toLowerCase();
            if (!offeredSkills.includes(skillLower)) {
                desiredSkillsSet.add(skillLower);
            }
        });
    }

    const desiredSkills = Array.from(desiredSkillsSet);

    // 4. Find potential collaborators and compute match compatibility score
    const otherUsers = await prisma.user.findMany({
        where: {
            id: { not: userId },
            status: "ACTIVE"
        },
        select: {
            id: true,
            name: true,
            email: true,
            profile: {
                select: {
                    bio: true,
                    avatarUrl: true,
                    location: true
                }
            },
            skills: {
                select: {
                    skillName: true,
                    expertiseLevel: true
                }
            },
            listings: {
                select: {
                    id: true,
                    title: true,
                    description: true
                }
            }
        }
    });

    // We also want to compute what other users "want" so we can check if current user can teach them
    const otherRegistrations = await prisma.courseRegistration.findMany({
        include: { course: { select: { skills: true } } }
    });

    const otherBookmarks = await prisma.bookmark.findMany({
        include: { skill: { select: { title: true } } }
    });

    const getUserDesiredSkills = (uId) => {
        const skills = new Set();
        otherRegistrations.forEach(r => {
            if (r.userId === uId && r.course?.skills) {
                r.course.skills.split(',').forEach(s => skills.add(s.trim().toLowerCase()));
            }
        });
        otherBookmarks.forEach(b => {
            if (b.userId === uId && b.skill?.title) {
                skills.add(b.skill.title.toLowerCase());
            }
        });
        // fallback
        if (skills.size === 0) {
            const userHas = otherUsers.find(u => u.id === uId)?.skills.map(s => s.skillName.toLowerCase()) || [];
            bootstrapSkills.forEach(s => {
                if (!userHas.includes(s.toLowerCase())) {
                    skills.add(s.toLowerCase());
                }
            });
        }
        return Array.from(skills);
    };

    const collaborationMatches = await Promise.all(otherUsers.map(async (user) => {
        const userWanted = getUserDesiredSkills(user.id);

        // They offer what current user wants
        const theyTeach = user.skills
            .filter(s => desiredSkills.includes(s.skillName.toLowerCase()))
            .map(s => s.skillName);

        // Current user offers what they want
        const youTeach = currentUserSkills
            .filter(s => userWanted.includes(s.skillName.toLowerCase()))
            .map(s => s.skillName);

        // Calculate score
        let score = 0;
        const userOfferedCombined = user.skills.map(s => s.skillName.toLowerCase())
            .concat(user.listings.map(l => l.title.toLowerCase()));
        if (theyTeach.length > 0 && youTeach.length > 0) {
            score = 80 + Math.min(20, (theyTeach.length + youTeach.length) * 5);
        } else if (theyTeach.length > 0) {
            score = 45 + Math.min(25, theyTeach.length * 10);
        } else if (youTeach.length > 0) {
            score = 25 + Math.min(20, youTeach.length * 10);
        } else {
            const commonSkills = userOfferedCombined.filter(s => bootstrapSkills.map(bs => bs.toLowerCase()).includes(s));
            score = 10 + Math.min(15, commonSkills.length * 5);
        }

        // Get or dynamically create a Listing ID for the skill they teach
        let targetListingId = null;
        const teachSkill = theyTeach.length > 0 ? theyTeach[0] : (user.skills.length > 0 ? user.skills[0].skillName : "General Exchange");
        
        if (user.listings.length > 0) {
            const matchingListing = user.listings.find(l => 
                l.title.toLowerCase().includes(teachSkill.toLowerCase())
            );
            targetListingId = matchingListing ? matchingListing.id : user.listings[0].id;
        } else if (user.skills.length > 0) {
            const newListing = await prisma.skillListing.create({
                data: {
                    title: `${teachSkill} Exchange`,
                    description: `Collaborative peer-to-peer exchange for ${teachSkill}.`,
                    userId: user.id
                }
            });
            targetListingId = newListing.id;
        } else {
            const newListing = await prisma.skillListing.create({
                data: {
                    title: `General Collaboration`,
                    description: `Open peer-to-peer swap listing.`,
                    userId: user.id
                }
            });
            targetListingId = newListing.id;
        }

        return {
            id: user.id,
            name: user.name,
            avatarUrl: user.profile?.avatarUrl,
            location: user.profile?.location || "Remote",
            bio: user.profile?.bio,
            skills: user.skills,
            matchScore: score,
            targetListingId,
            targetSkill: teachSkill,
            theyTeach: theyTeach.length > 0 ? theyTeach : user.skills.slice(0, 2).map(s => s.skillName),
            youTeach: youTeach.length > 0 ? youTeach : currentUserSkills.slice(0, 2).map(s => s.skillName)
        };
    }));

    // Sort again as they were processed in parallel
    const sortedCollaborationMatches = collaborationMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

    // 5. Growth Opportunities
    const growthSkills = demandTrends
        .filter(item => !offeredSkills.includes(item.skill.toLowerCase()))
        .map(item => item.skill)
        .slice(0, 4);

    // 6. Recommended Courses
    const allCourses = await prisma.course.findMany();
    const recommendedCourses = [];
    
    growthSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        const matching = allCourses.filter(course => {
            const courseSkillsLower = course.skills.toLowerCase();
            return courseSkillsLower.includes(skillLower) || course.title.toLowerCase().includes(skillLower);
        });
        matching.forEach(course => {
            if (!recommendedCourses.find(c => c.id === course.id)) {
                recommendedCourses.push(course);
            }
        });
    });

    if (recommendedCourses.length === 0) {
        recommendedCourses.push(...allCourses.slice(0, 3));
    }

    return res.status(200).json(new ApiResponse(200, {
        collaborationMatches: sortedCollaborationMatches,
        growthSkills,
        recommendedCourses: recommendedCourses.slice(0, 6),
        demandTrends
    }, "Recommendations generated successfully"));
});

export {
    getCareerProfile,
    generateResume,
    getSkillCertifications,
    getCareerAnalytics,
    getLinkedInExport,
    getEndorsements,
    createEndorsement,
    addExternalCertification,
    getRecommendations
};

