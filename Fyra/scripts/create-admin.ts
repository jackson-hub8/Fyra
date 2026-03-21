/**
 * Create or reset the default admin user (dev / initial setup).
 * Email: admin@transy.edu — password: password123
 *
 * Usage: npm run create-admin
 * Requires DATABASE_URL in .env (same as Prisma).
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@transy.edu';
const ADMIN_PASSWORD = 'password123';
const ADMIN_NAME = 'Admin';

async function main() {
  const passwordHash = await argon2.hash(ADMIN_PASSWORD);

  const user = await prisma.users.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      isAdmin: true,
      isMatched: false,
      isActive: true,
      emailVerified: false,
      profileSetupComplete: false,
    },
    update: {
      name: ADMIN_NAME,
      passwordHash,
      isAdmin: true,
    },
    select: { email: true, name: true, isAdmin: true },
  });

  console.log('Admin user ready:', user);
  console.log(`Login at the app login page with ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
