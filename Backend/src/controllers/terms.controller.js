import { PrismaClient } from "../generated/prisma/index.js";
import { apiError } from "../utlis/apiError.js";
import { asynHandler } from "../utlis/asyncHandler.js";
import { ApiResponse } from "../utlis/apiRespone.js";

const prisma = new PrismaClient();

const checkTermsAcceptance = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasAcceptedTerms: true }
  });

  if (!user) {
    return next(new apiError(404, "User not found"));
  }

  return res.status(200).json(new ApiResponse(200, { hasAcceptedTerms: user.hasAcceptedTerms }, "Terms status checked successfully"));
});

const acceptTerms = asynHandler(async (req, res, next) => {
  const userId = req.user.id;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { hasAcceptedTerms: true },
    select: { hasAcceptedTerms: true }
  });

  return res.status(200).json(new ApiResponse(200, { hasAcceptedTerms: user.hasAcceptedTerms }, "Terms accepted successfully"));
});

export { checkTermsAcceptance, acceptTerms };
