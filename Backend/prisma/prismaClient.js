// prisma/prismaClient.js
import { PrismaClient } from '../src/generated/prisma/index.js'; // <-- correct relative path

export const prisma = new PrismaClient();
