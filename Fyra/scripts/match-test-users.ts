/// file: match-test-users.ts
/// Creates test3@transy.edu and matches with test1@transy.edu for calendar testing

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function matchTestUsers() {
  try {
    const passwordHash = await argon2.hash('password123');

    // Ensure test1 exists (create if not)
    let user1 = await prisma.users.findUnique({
      where: { email: 'test1@transy.edu' },
    });
    if (!user1) {
      user1 = await prisma.users.create({
        data: {
          email: 'test1@transy.edu',
          name: 'Test User 1',
          passwordHash,
          isMatched: false,
          profileSetupComplete: true,
        },
      });
      console.log('Created test1@transy.edu');
    }

    // Create test3 if not exists
    let user3 = await prisma.users.findUnique({
      where: { email: 'test3@transy.edu' },
    });
    if (!user3) {
      user3 = await prisma.users.create({
        data: {
          email: 'test3@transy.edu',
          name: 'Test User 3',
          passwordHash,
          isMatched: false,
          profileSetupComplete: true,
        },
      });
      console.log('Created test3@transy.edu');
    }

    // Check if match already exists
    const existingMatch = await prisma.matches.findFirst({
      where: {
        OR: [
          { userEmail1: 'test1@transy.edu', userEmail2: 'test3@transy.edu' },
          { userEmail1: 'test3@transy.edu', userEmail2: 'test1@transy.edu' },
        ],
      },
    });

    if (existingMatch) {
      console.log('Match already exists between test1 and test3');
    } else {
      await prisma.matches.create({
        data: {
          userEmail1: 'test1@transy.edu',
          userEmail2: 'test3@transy.edu',
          status: 'active',
        },
      });
      console.log('Created match between test1@transy.edu and test3@transy.edu');
    }

    // Ensure both users have isMatched = true
    await prisma.users.updateMany({
      where: {
        email: { in: ['test1@transy.edu', 'test3@transy.edu'] },
      },
      data: { isMatched: true },
    });
    console.log('Updated both users to isMatched: true');

    console.log('\nDone! You can now login as either account and create events:');
    console.log('  test1@transy.edu / password123');
    console.log('  test3@transy.edu / password123');
  } catch (error: unknown) {
    console.error('Error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.error('User or match may already exist');
    }
  } finally {
    await prisma.$disconnect();
  }
}

matchTestUsers();
