import { PrismaClient } from './src/generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst();
    if (!user) return console.log('No user');
    
    // Create a fake match post
    const post = await prisma.skillListing.create({
        data: {
            title: '[SKILL MATCH] React <-> Node.js',
            description: '🎯 Skill Match Alert! ' + user.name + ' and Riaz Alam Khan both specialize in React, Node.js. A perfect peer-learning opportunity has been found by our automated matching engine!',
            userId: user.id,
            isFeatured: true
        }
    });
    console.log('Created fake match:', post);
}
main().catch(console.error).finally(() => prisma.$disconnect());
