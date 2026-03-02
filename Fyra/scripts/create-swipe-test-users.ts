/// file: create-swipe-test-users.ts
/// Creates 10 unmatched test users with profiles for the matching/swipe deck.
/// Login as test2@transy.edu (password123) to see them in the deck.

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const PASSWORD = 'password123';

const USERS = [
  { email: 'swipe1@transy.edu', name: 'Alex Morgan', bio: 'Biology major from Lexington. Love hiking and coffee.', interests: 'Hiking, Coffee, Music, Movies', dailyLife: 'Early bird, Clean, Study at library', peeves: ['Loud music', 'Dirty dishes', 'Late nights'] },
  { email: 'swipe2@transy.edu', name: 'Jordan Lee', bio: 'Pre-med from Louisville. Play guitar and run cross country.', interests: 'Guitar, Running, Reading, Cooking', dailyLife: 'Night owl, Tidy, Study in room', peeves: ['Clutter', 'Strong smells', 'Interruptions'] },
  { email: 'swipe3@transy.edu', name: 'Sam Taylor', bio: 'History major from Cincinnati. Into board games and podcasts.', interests: 'Board games, Podcasts, Writing, History', dailyLife: 'Flexible, Minimalist, Group study', peeves: ['Messy bathroom', 'Noise when sleeping', 'Borrowing without asking'] },
  { email: 'swipe4@transy.edu', name: 'Casey Riley', bio: 'Art and psych double major from Nashville. Love painting and yoga.', interests: 'Painting, Yoga, Meditation, Plants', dailyLife: 'Early bird, Creative mess, Quiet space', peeves: ['Negative energy', 'Touching my art', 'Last-minute plans'] },
  { email: 'swipe5@transy.edu', name: 'Morgan Blake', bio: 'Computer science from Bowling Green. Gamer and casual cook.', interests: 'Gaming, Cooking, Anime, Coding', dailyLife: 'Night owl, Organized, Headphones on', peeves: ['Spoilers', 'Unplugged chargers', 'Food in room'] },
  { email: 'swipe6@transy.edu', name: 'Riley Quinn', bio: 'English major from Owensboro. Writer and tea enthusiast.', interests: 'Writing, Tea, Books, Film', dailyLife: 'Early bird, Cozy, Library regular', peeves: ['Loud chewers', 'Borrowed books not returned', 'Bright lights late'] },
  { email: 'swipe7@transy.edu', name: 'Drew Parker', bio: 'Business and Spanish from Covington. Soccer and travel.', interests: 'Soccer, Travel, Languages, Coffee', dailyLife: 'Early bird, Neat, Social', peeves: ['Passive aggression', 'Unwashed dishes', 'Blasting music'] },
  { email: 'swipe8@transy.edu', name: 'Jamie Avery', bio: 'Chemistry major from Frankfort. Lab work and running.', interests: 'Running, Chemistry, Cooking, Podcasts', dailyLife: 'Early bird, Very tidy, Study groups', peeves: ['Strong perfumes', 'Eating my food', 'Last-minute cancellations'] },
  { email: 'swipe9@transy.edu', name: 'Quinn Ellis', bio: 'Political science from Georgetown. Debate and news junkie.', interests: 'Debate, News, Running, Cooking', dailyLife: 'Early bird, Organized, Discussion groups', peeves: ['Disrespect', 'Messy common areas', 'Loud calls'] },
  { email: 'swipe10@transy.edu', name: 'Taylor Reese', bio: 'Music and education from Richmond. Piano and choir.', interests: 'Piano, Choir, Reading, Baking', dailyLife: 'Flexible, Tidy, Practice in room', peeves: ['Touching my instruments', 'Interrupting practice', 'Unannounced guests'] },
];

async function main() {
  const passwordHash = await argon2.hash(PASSWORD);

  // Ensure test2@transy.edu exists as an unmatched user (for logging in to swipe)
  await prisma.users.upsert({
    where: { email: 'test2@transy.edu' },
    create: {
      email: 'test2@transy.edu',
      name: 'Test User 2',
      passwordHash,
      isMatched: false,
      profileSetupComplete: true,
      emailVerified: true,
    },
    update: { isMatched: false, profileSetupComplete: true },
  });
  console.log('Ensured test2@transy.edu (unmatched) exists');

  for (const u of USERS) {
    const email = u.email.toLowerCase();
    await prisma.users.upsert({
      where: { email },
      create: {
        email,
        name: u.name,
        passwordHash,
        isMatched: false,
        profileSetupComplete: true,
        emailVerified: true,
      },
      update: {
        name: u.name,
        isMatched: false,
        profileSetupComplete: true,
      },
    });

    await prisma.userProfiles.upsert({
      where: { userEmail: email },
      create: {
        userEmail: email,
        bio: u.bio,
        topInterests: u.interests,
        dailyLife: u.dailyLife,
      },
      update: {
        bio: u.bio,
        topInterests: u.interests,
        dailyLife: u.dailyLife,
      },
    });

    const existing = await prisma.petPeeves.findMany({ where: { userEmail: email }, select: { id: true } });
    if (existing.length > 0) {
      await prisma.petPeeves.deleteMany({ where: { userEmail: email } });
    }
    for (const p of u.peeves) {
      await prisma.petPeeves.create({
        data: { userEmail: email, petPeeve: p, severity: 'medium', isPublic: true },
      });
    }

    console.log('Created/updated:', email);
  }

  console.log('\nDone! 10 swipe test users are ready.');
  console.log('Login as test2@transy.edu / password123 (unmatched) to see them on the Matching page.');
  console.log('Or login as any swipe user, e.g. swipe1@transy.edu / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
