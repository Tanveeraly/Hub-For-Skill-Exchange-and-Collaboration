import { PrismaClient } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import { apiError } from "../utlis/apiError.js";

const prisma = new PrismaClient();

export const generateRefreshAndAccessToken = async (userId) => {
  try {
    //  Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new apiError(404, "User not found");
    }

  // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10m" } // adjust as needed
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    //console.log("Generated Access Token:", accessToken);
    //console.log("Generated Refresh Token:", refreshToken);

    // 3Save refresh token in DB
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 4. Return both tokens
    return { accessToken, refreshToken };
  } catch (error) {
    if (error instanceof apiError) {
      throw error;
    }
    //console.error("Token Generation Error:", error);
    throw new apiError(500, "Error while generating Refresh and Access Token");
  }
};
