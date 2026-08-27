// Run this script to set a user as ADMIN by email
// Usage: node prisma/set_admin.js <email>
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
    console.log("Usage: node prisma/set_admin.js <email>");
    process.exit(1);
}

async function main() {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log(`User not found: ${email}`);
        process.exit(1);
    }
    await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
    });
    console.log(`✅ User "${user.name}" (${email}) is now ADMIN`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
