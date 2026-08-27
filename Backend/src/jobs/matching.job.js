import cron from "node-cron";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// Skill Matching Job - Runs every 1 minute
const setupMatchingJob = () => {
    cron.schedule("* * * * *", async () => {
        console.log("Running Daily Skill Matching Job...");
        
        try {
            // 1. Get all active users with their skills
            const users = await prisma.user.findMany({
                where: { status: "ACTIVE" },
                include: {
                    skills: true,
                    receivedConnections: true,
                    sentConnections: true
                }
            });

            // 2. Process each user for potential matches
            for (const user of users) {
                if (!user.skills || user.skills.length === 0) continue;

                const userSkillNames = user.skills.map(s => s.skillName.toLowerCase());
                const existingConnectionIds = [
                    ...user.sentConnections.map(c => c.receiverId),
                    ...user.receivedConnections.map(c => c.senderId)
                ];

                // 3. Find candidates who share at least one skill and aren't connected
                const candidates = await prisma.user.findMany({
                    where: {
                        status: "ACTIVE",
                        id: {
                            not: user.id,
                            notIn: existingConnectionIds
                        },
                        skills: {
                            some: {
                                skillName: {
                                    in: userSkillNames,
                                    mode: 'insensitive'
                                }
                            }
                        }
                    },
                    include: { skills: true },
                    take: 3 // Suggest up to 3 matches
                });

                // 4. Generate Match Notifications + Feed Posts
                if (candidates.length > 0) {
                    const topMatch = candidates[0];
                    const sharedSkills = topMatch.skills
                        .filter(s => userSkillNames.includes(s.skillName.toLowerCase()))
                        .map(s => s.skillName);

                    // Check if we already notified this pair today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            userId: user.id,
                            title: "New Skill Match Found! 🎯",
                            message: { contains: topMatch.name },
                            createdAt: { gte: today }
                        }
                    });

                    if (!existingNotification) {
                        // Create notification
                        await prisma.notification.create({
                            data: {
                                userId: user.id,
                                type: "SYSTEM",
                                title: "New Skill Match Found! 🎯",
                                message: `We found a great peer! ${topMatch.name} also specializes in ${sharedSkills[0]}. Connect with them to exchange knowledge.`,
                            }
                        });

                        // Also notify the matched user
                        await prisma.notification.create({
                            data: {
                                userId: topMatch.id,
                                type: "SYSTEM",
                                title: "New Skill Match Found! 🎯",
                                message: `You and ${user.name} share skills in ${sharedSkills[0]}. Connect to start a skill exchange!`,
                            }
                        });
                    }
                }
            }

            await prisma.jobLog.create({
                data: {
                    jobName: "Skill Matching",
                    status: "SUCCESS",
                    message: "Skill matching completed successfully. Processed active users."
                }
            });

            console.log("Skill Matching Job completed successfully.");

        } catch (error) {
            console.error("Error in Skill Matching Job:", error);
            await prisma.jobLog.create({
                data: {
                    jobName: "Skill Matching",
                    status: "ERROR",
                    message: error.message || "Failed to run skill matching job."
                }
            }).catch(console.error);
        }
    });
};

export { setupMatchingJob };
