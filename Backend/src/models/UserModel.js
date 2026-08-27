import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Create a new user
 * @param {Object} userData - { name, email, password, isVerified, provider, providerId }
 */
const createUser = async ({ name, email, password, isVerified = false, provider = null, providerId = null }) => {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      isVerified,
      provider,
      providerId,
    },
  });
  return user;
};

/**
 * Find a user by email (includes all fields)
 * @param {string} email
 */
const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      skills: true,
      portfolios: true,
      listings: true,
    },
  });
  return user;
};

/**
 * Update or create a user's profile
 * @param {string} email
 * @param {Object} profileData - { bio, avatarUrl, coverimageUrl, socialLinks, website, location, profileVisibility }
 */
const userProfileUpdate = async (email, { bio, avatarUrl, coverimageUrl, socialLinks, website, location, profileVisibility }) => {
  // Find user first
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) throw new Error("User not found");

  // Upsert profile (create if not exists, update if exists)
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      bio,
      avatarUrl,
      coverimageUrl,
      socialLinks,
      website,
      location,
      profileVisibility: profileVisibility || 'PUBLIC',
    },
    create: {
      userId: user.id,
      bio,
      avatarUrl,
      coverimageUrl,
      socialLinks,
      website,
      location,
      profileVisibility: profileVisibility || 'PUBLIC',
    },
  });

  // Return updated user (without sensitive fields)
  const updatedUser = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  return updatedUser;
};


/**
 * Add a portfolio item for a user
 * @param {number} userId
 * @param {Object} portfolioData - { title, description, mediaUrl, mediaType }
 */
const addPortfolio = async (userId, { title, description, mediaUrl, mediaType }) => {
  const portfolio = await prisma.portfolio.create({
    data: {
      title,
      description: description || null,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      userId,
    },
  });
  return portfolio;
};

export { createUser, findUserByEmail, userProfileUpdate, addPortfolio };