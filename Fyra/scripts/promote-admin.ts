/**
 * Set isAdmin=true for an existing user (run once per admin email).
 * Usage: npx tsx scripts/promote-admin.ts admin@example.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npx tsx scripts/promote-admin.ts <email>');
    process.exit(1);
  }
  const u = await prisma.users.update({
    where: { email },
    data: { isAdmin: true },
    select: { email: true, name: true, isAdmin: true },
  });
  console.log('Updated:', u);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
