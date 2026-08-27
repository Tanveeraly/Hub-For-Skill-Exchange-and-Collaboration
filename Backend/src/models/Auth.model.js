import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

export const createUser = async (data) => {
  return await prisma.user.create({ data });
};

export const findUserById = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const userProfileUpdate = async (email, data) => {
  const user = await prisma.user.findUnique({ where: { email } });

  return await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { ...data, userId: user.id },
  });
};

