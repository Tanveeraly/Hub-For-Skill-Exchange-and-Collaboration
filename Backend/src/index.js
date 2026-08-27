import dotenv from "dotenv";
import  app  from "./app.js";
import { PrismaClient } from "./generated/prisma/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { initSocket } from "./utlis/chat.socket.js";
import http from "http";
import { setupReminderJob } from "./jobs/reminder.job.js";
import { setupMatchingJob } from "./jobs/matching.job.js";
import { setupMonitoringJob } from "./jobs/monitoring.job.js";

const Server = http.createServer(app);
initSocket(Server);

// 🔧 Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hub For Skill Exchange And Collaboration  API Documentation",
      version: "1.0.0",
      description: "API documentation ",
    },
    servers: [
      {
        url: "http://localhost:5000", // your server URL
      },
    ],
  },
  apis: ["./src/routes/*.js"], // where Swagger will look for docs
};


const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));




dotenv.config({
  path: "./.env", 
});

const prisma = new PrismaClient();

async function startServer() {
  try {
    // Test Prisma DB connection
    await prisma.$connect();
    console.log("Database connected successfully!");

    const PORT = process.env.PORT || 5000;
    setupReminderJob();
    setupMatchingJob();
    setupMonitoringJob();
    Server.listen(PORT, () => {

      console.log(` Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

startServer();
