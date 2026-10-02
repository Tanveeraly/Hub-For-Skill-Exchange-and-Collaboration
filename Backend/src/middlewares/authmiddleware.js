// middleware/auth.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "../generated/prisma/index.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { apiError } from "../utlis/apiError.js";

const prisma = new PrismaClient();

const verifyjwt = asynHandler(async (req, res, next) => {
  try {
    console.log("Inside auth middleware");
    console.log(`URL: ${req.originalUrl}`);
    console.log("Cookies are:", req.cookies);

    let token = req.cookies?.accessToken || null;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      const parts = req.headers.authorization.split(" ");
      if (parts[1] && parts[1] !== "undefined" && parts[1] !== "null") {
        token = parts[1];
      }
    }

    if (!token) {
      return next(
        new apiError(401, "You are not logged in, please login to get access")
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("Decoded values:", decoded);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      console.log(`User found: ${user ? user.name : "NULL"}`);

      if (!user) {
        return next(
          new apiError(401, "The user belonging to this token no longer exists")
        );
      }

      req.user = user;
      next();

    } catch (error) {
      if (error.name === "TokenExpiredError") {
        console.log("Access token expired, attempting to refresh...");

        const refreshToken =
          req.cookies?.refreshToken || req.cookies?.refreshtoken || req.headers["x-refresh-token"];

        if (!refreshToken) {
          return next(
            new apiError(401, "Session expired, please login again")
          );
        }

        const decodedRefresh = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        const user = await prisma.user.findUnique({
          where: { id: decodedRefresh.userId },
        });

        if (!user || user.refreshToken !== refreshToken) {
          return next(
            new apiError(401, "Invalid refresh token, please login again")
          );
        }

        const newAccessToken = jwt.sign(
          { userId: user.id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        const isSecure = process.env.NODE_ENV === "production" || req.secure || req.headers["x-forwarded-proto"] === "https";
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: isSecure,
          sameSite: isSecure ? "none" : "lax",
          path: "/",
          maxAge: 15 * 60 * 1000,
        });
        res.setHeader("x-access-token", newAccessToken);

        req.user = user;
        next();
      } else {
        return next(
          new apiError(401, "Invalid token or user not logged in")
        );
      }
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return next(new apiError(500, error.message));
  }
});

export { verifyjwt };