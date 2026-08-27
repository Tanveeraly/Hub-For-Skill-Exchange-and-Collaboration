
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Web Development', description: 'Web development and related technologies' },
    { name: 'Mobile Development', description: 'Mobile app development for iOS and Android' },
    { name: 'Design', description: 'UI/UX and Graphic Design' },
    { name: 'Marketing', description: 'Digital Marketing and SEO' },
    { name: 'Writing', description: 'Content writing and editing' },
    { name: 'Data Science', description: 'Data analysis and machine learning' },
    { name: 'Other', description: 'Other specialized skills' }
  ];

  console.log('Seeding categories...');

  for (const category of categories) {
    await prisma.skillCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });