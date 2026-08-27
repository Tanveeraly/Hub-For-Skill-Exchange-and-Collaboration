import cron from "node-cron";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// Runs every 1 minute
const setupReminderJob = () => {
    cron.schedule("* * * * *", async () => {
        console.log("Running Swap Reminders Job...");
        
        try {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

            // 1. 24-hour reminders
            const dayReminders = await prisma.swapRequest.findMany({
                where: {
                    status: "ACCEPTED",
                    scheduledAt: {
                        gte: new Date(tomorrow.getTime() - 15 * 60 * 1000), // Within the last 15 mins window
                        lte: tomorrow
                    }
                }
            });

            for (const swap of dayReminders) {
                await sendReminder(swap, "24 hours");
            }

            // 2. 1-hour reminders
            const hourReminders = await prisma.swapRequest.findMany({
                where: {
                    status: "ACCEPTED",
                    scheduledAt: {
                        gte: new Date(inOneHour.getTime() - 15 * 60 * 1000),
                        lte: inOneHour
                    }
                }
            });

            for (const swap of hourReminders) {
                await sendReminder(swap, "1 hour");
            }

            await prisma.jobLog.create({
                data: {
                    jobName: "Swap Reminders",
                    status: "SUCCESS",
                    message: `Sent ${dayReminders.length} 24-hour reminders and ${hourReminders.length} 1-hour reminders.`
                }
            });

        } catch (error) {
            console.error("Error in Reminder Job:", error);
            await prisma.jobLog.create({
                data: {
                    jobName: "Swap Reminders",
                    status: "ERROR",
                    message: error.message || "Failed to run reminder job."
                }
            }).catch(console.error);
        }
    });
};

const sendReminder = async (swap, timeFrame) => {
    // Notify both users
    const userIds = [swap.senderId, swap.receiverId];
    for (const userId of userIds) {
        await prisma.notification.create({
            data: {
                userId,
                type: "SYSTEM",
                title: "Swap Reminder",
                message: `You have a swap session scheduled in ${timeFrame}!`,
            }
        });
    }
    console.log(`Sent ${timeFrame} reminders for swap ${swap.id}`);
};

export { setupReminderJob };
