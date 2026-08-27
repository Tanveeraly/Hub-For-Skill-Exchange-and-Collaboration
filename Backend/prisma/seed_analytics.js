import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding analytics data...');

  // 1. Get the first user (usually the logged-in dev user)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to seed data for.');
    return;
  }
  const userId = user.id;
  console.log(`Seeding data for user: ${user.email} (ID: ${userId})`);

  // 2. Create a partner user if not exists
  let partner = await prisma.user.findFirst({ where: { email: 'partner@example.com' } });
  if (!partner) {
    partner = await prisma.user.create({
      data: {
        email: 'partner@example.com',
        name: 'Collaborator Jane',
        password: 'hashedpassword123', // Dummy
        isVerified: true
      }
    });
  }

  // 3. Create Skills
  await prisma.userSkill.createMany({
    data: [
      { userId, skillName: 'React', expertiseLevel: 'EXPERT' },
      { userId, skillName: 'Node.js', expertiseLevel: 'INTERMEDIATE' },
      { userId, skillName: 'UI Design', expertiseLevel: 'ADVANCED' }
    ],
    skipDuplicates: true
  });

  // 4. Create Swap Requests (Completed & Active)
  const swap1 = await prisma.swapRequest.create({
    data: {
      senderId: userId,
      receiverId: partner.id,
      status: 'COMPLETED',
      skillId: 1, // Assumes skill with ID 1 exists, ideally should lookup but this is quick seed
      message: 'Great swap!',
    }
  });

  const swap2 = await prisma.swapRequest.create({
    data: {
      senderId: partner.id,
      receiverId: userId,
      status: 'ACCEPTED',
      skillId: 1, 
      message: 'Ongoing project',
    }
  });

  // 5. Create Work Sessions (Historical data for graph)
  const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  await prisma.workSession.createMany({
    data: [
      { swapRequestId: swap1.id, startTime: daysAgo(1), hoursWorked: 2.5, description: 'Initial setup' },
      { swapRequestId: swap1.id, startTime: daysAgo(2), hoursWorked: 1.5, description: 'Bug fixing' },
      { swapRequestId: swap1.id, startTime: daysAgo(3), hoursWorked: 4.0, description: 'Deep work' },
      { swapRequestId: swap2.id, startTime: daysAgo(0), hoursWorked: 3.0, description: 'Current session' },
      { swapRequestId: swap2.id, startTime: daysAgo(4), hoursWorked: 0.5, description: 'Quick sync' },
    ]
  });

  // 6. Create Ratings
  await prisma.swapRating.create({
    data: {
      swapRequestId: swap1.id,
      fromUserId: partner.id,
      toUserId: userId,
      rating: 5,
      feedback: 'Excellent collaboration!'
    }
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
