/// file: create-test-users.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Script to create two test users - one matched, one unmatched

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    // Hash password for both users
    const passwordHash = await argon2.hash('password123');

    // Create first user (matched)
    const user1 = await prisma.users.create({
      data: {
        email: 'test1@transy.edu',
        name: 'Test User 1',
        passwordHash: passwordHash,
        isMatched: true,
      },
    });

    // Create second user (unmatched)
    const user2 = await prisma.users.create({
      data: {
        email: 'test2@transy.edu',
        name: 'Test User 2',
        passwordHash: passwordHash,
        isMatched: false,
      },
    });

    console.log('Test users created successfully!');
    console.log('User 1 (matched):', user1.email, '- Password: password123');
    console.log('User 2 (unmatched):', user2.email, '- Password: password123');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error('Error: One or both users already exist');
    } else {
      console.error('Error creating test users:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
