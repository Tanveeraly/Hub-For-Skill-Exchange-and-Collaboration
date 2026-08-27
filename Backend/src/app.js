import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import cookieParser from "cookie-parser";
import { authRouter } from "./routes/AuthRoutes.js";
import { MessageRoutes } from "./routes/Message.Routes.js";
import { CallRoutes } from "./routes/call.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";
import bookmarkRouter from "./routes/bookmark.routes.js";
import swapRouter from "./routes/swap.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import termsRouter from "./routes/terms.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import collaborationRouter from "./routes/collaboration.routes.js";
import fileRouter from "./routes/file.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import careerRouter from "./routes/career.routes.js";
import adminRouter from "./routes/admin.routes.js";
import courseRouter from "./routes/course.routes.js";
import disputeRouter from "./routes/dispute.routes.js";
import securityRouter from "./routes/security.routes.js";
const app = express();

// Normalize CORS origin by removing trailing slash
const corsOrigin = process.env.CORS_ORIGIN?.replace(/\/$/, '') || "http://localhost:5173";

app.use(cors(
    { origin: corsOrigin, credentials: true }  
));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
});
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/message",MessageRoutes);
app.use("/api/v1/calls", CallRoutes);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/bookmarks", bookmarkRouter);
app.use("/api/v1/swaps", swapRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/terms", termsRouter);
app.use("/api/v1/ratings", ratingRouter);
app.use("/api/v1/collaboration", collaborationRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/career", careerRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/disputes", disputeRouter);
app.use("/api/v1/admin/security", securityRouter);


// 🧩 Global Error Handler — must be last!
app.use((err, req, res, next) => {
  console.error("🔥 Error caught by middleware:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode || 500,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
    data: err.data || null,
  });
});


export default app;