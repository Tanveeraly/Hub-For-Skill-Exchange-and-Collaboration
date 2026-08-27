import cron from "node-cron";
import os from "os";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// Performance Monitoring Job - Runs every 1 minute
const setupMonitoringJob = () => {
    cron.schedule("* * * * *", async () => {
        console.log("Running System Performance Monitoring Job...");
        
        try {
            // 1. Gather System Metrics
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            const cpuLoad = os.loadavg()[0]; // 1 minute load average

            console.log(`[Monitoring] Memory Usage: ${memoryUsagePercent.toFixed(2)}% | CPU Load: ${cpuLoad.toFixed(2)}`);

            // 2. Alert conditions (e.g., > 90% memory usage)
            if (memoryUsagePercent > 90 || cpuLoad > os.cpus().length) {
                console.warn("⚠️ System resources are critically high!");

                // Notify Admins
                const admins = await prisma.user.findMany({
                    where: { role: "ADMIN", status: "ACTIVE" }
                });

                for (const admin of admins) {
                    await prisma.notification.create({
                        data: {
                            userId: admin.id,
                            type: "SYSTEM",
                            title: "⚠️ High Resource Alert",
                            message: `Server is experiencing high load. Memory: ${memoryUsagePercent.toFixed(1)}%, CPU Load: ${cpuLoad.toFixed(2)}. Consider scaling up your infrastructure.`,
                        }
                    });
                }
            }

            // 3. Database Health Check (Simple query to ensure DB is responsive)
            const startTime = Date.now();
            await prisma.$queryRaw`SELECT 1`;
            const dbLatency = Date.now() - startTime;
            
            if (dbLatency > 1000) {
                console.warn(`⚠️ Database latency is unusually high: ${dbLatency}ms`);
                const admins = await prisma.user.findMany({
                    where: { role: "ADMIN", status: "ACTIVE" }
                });

                for (const admin of admins) {
                    await prisma.notification.create({
                        data: {
                            userId: admin.id,
                            type: "SYSTEM",
                            title: "🐌 Database Degraded Performance",
                            message: `The database took ${dbLatency}ms to respond. Please check for query bottlenecks or unindexed tables.`,
                        }
                    });
                }
            }

            // 4. Log the job status
            let status = "SUCCESS";
            let message = `Memory: ${memoryUsagePercent.toFixed(1)}%, CPU: ${cpuLoad.toFixed(2)}, DB Latency: ${dbLatency}ms`;
            
            if (memoryUsagePercent > 90 || cpuLoad > os.cpus().length || dbLatency > 1000) {
                status = "WARNING";
                message = "Degraded performance detected: " + message;
            }

            await prisma.jobLog.create({
                data: {
                    jobName: "System Performance Monitoring",
                    status,
                    message
                }
            });

            console.log("Performance Monitoring Job completed.");

        } catch (error) {
            console.error("Error in Performance Monitoring Job:", error);
            await prisma.jobLog.create({
                data: {
                    jobName: "System Performance Monitoring",
                    status: "ERROR",
                    message: error.message || "Failed to run monitoring job."
                }
            }).catch(console.error);
        }
    });
};

export { setupMonitoringJob };
