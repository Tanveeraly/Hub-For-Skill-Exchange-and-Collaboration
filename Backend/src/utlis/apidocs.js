import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import express from "express";

const app = express();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth API Docs",
      version: "1.0.0",
      description: "Backend API for authentication system",
    },
    servers: [
      { url: "http://localhost:5000" }
    ],
  },
  apis: ["./routes/*.js"], // Path to your route files
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
