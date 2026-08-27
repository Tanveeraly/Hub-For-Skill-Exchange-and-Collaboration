import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
    await prisma.skillListing.deleteMany({
        where: { title: { startsWith: '[SKILL MATCH]' } }
    });
    console.log('Deleted all skill match posts from feed');
}
main().catch(console.error).finally(() => prisma.$disconnect());
