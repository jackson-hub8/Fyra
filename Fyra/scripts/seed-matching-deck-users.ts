/// file: seed-matching-deck-users.ts
/// Removes legacy swipe1–swipe20 test accounts, then creates 20 new users with full
/// private questionnaires, placeholder profile photos, and seeded PossibleMatches with
/// mixed similarity scores and varying counts of possible matches per user.
/// Run: npx tsx scripts/seed-matching-deck-users.ts

import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { canonicalPair, computeSimilarityScore } from '../api/lib/matching.ts';

const prisma = new PrismaClient();

const PASSWORD = 'password123';

const SWIPE_EMAILS = Array.from({ length: 20 }, (_, i) => `swipe${i + 1}@transy.edu`);

const PLACEHOLDER_PHOTO = (n: number) =>
  `https://picsum.photos/seed/fyra-swipe-${n}/400/400`;

const STANDINGS = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const;

type QData = Omit<Prisma.PrivateQuestionnaireUncheckedCreateInput, 'userEmail' | 'id'>;

/** Twenty distinct questionnaires so pairwise scores vary (not all identical). */
const USER_QUESTIONNAIRES: QData[] = [
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Soccer | Track',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Moderate',
    bedroomDescription: 'Organized',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '11pm–12am',
    freeTime: 'reading, hiking, music',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '10am–11am',
    musicPreference: 'Indie',
    politicalViews: 'Moderate',
    religion: 'Somewhat religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Biology | Chemistry',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Soccer | Track',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Moderate',
    bedroomDescription: 'Organized',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '11pm–12am',
    freeTime: 'reading, hiking, music',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '10am–11am',
    musicPreference: 'Pop',
    politicalViews: 'Liberal',
    religion: 'Somewhat religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Biology | Chemistry',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Basketball',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Occasionally',
    roomTemp: 'Cool',
    bedroomDescription: 'Very organized',
    sleepType: 'Early Bird',
    weekdayBedtime: '10pm–11pm',
    freeTime: 'gaming, coding, gym',
    campusActivity: 'Very active',
    visitorFrequency: 'Rarely',
    weekendHomeFrequency: 'Rarely',
    firstClassTime: '8am–9am',
    musicPreference: 'Hip-hop',
    politicalViews: 'Liberal',
    religion: 'Not particularly religious',
    studyEnvironment: 'Dorm desk',
    intendedMajor: 'Computer Science',
    vehicleToCampus: 'Bike',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Football | Lacrosse',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Never drink',
    roomTemp: 'Warm',
    bedroomDescription: 'Messy',
    sleepType: 'Night Owl',
    weekdayBedtime: 'After 1am',
    freeTime: 'parties, streaming, late study',
    campusActivity: 'Very active',
    visitorFrequency: 'Very often',
    weekendHomeFrequency: 'Often',
    firstClassTime: '11am or later',
    musicPreference: 'Hip-hop',
    politicalViews: 'Very liberal',
    religion: 'Prefer not to say',
    studyEnvironment: 'Coffee shop',
    intendedMajor: 'Communications',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: 'Cats | Dogs',
    varsitySport: '',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Never drink',
    roomTemp: 'Warm',
    bedroomDescription: 'Disorganized but not messy',
    sleepType: 'Night Owl',
    weekdayBedtime: '12am–1am',
    freeTime: 'art, film, writing',
    campusActivity: 'Somewhat active',
    visitorFrequency: 'Often',
    weekendHomeFrequency: 'Often',
    firstClassTime: '11am or later',
    musicPreference: 'Classical',
    politicalViews: 'Very liberal',
    religion: 'Prefer not to say',
    studyEnvironment: 'Coffee shop',
    intendedMajor: 'English | Art',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Non-binary',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Swimming',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Prefer not to say',
    roomTemp: 'Cool',
    bedroomDescription: 'Messy',
    sleepType: 'Night Owl',
    weekdayBedtime: 'After 1am',
    freeTime: 'theater, debate, choir',
    campusActivity: 'Very active',
    visitorFrequency: 'Very often',
    weekendHomeFrequency: 'Almost every weekend',
    firstClassTime: '11am or later',
    musicPreference: 'Musical theater',
    politicalViews: 'Moderate',
    religion: 'Somewhat religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Political Science',
    vehicleToCampus: 'Bus',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Baseball',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Warm',
    bedroomDescription: 'Disorganized but not messy',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '10pm–11pm',
    freeTime: 'guitar, volunteering, intramurals',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '10am–11am',
    musicPreference: 'Rock',
    politicalViews: 'Liberal',
    religion: 'Somewhat religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Psychology | Sociology',
    vehicleToCampus: 'Bike',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Volleyball | Softball',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Never drink',
    roomTemp: 'Cool',
    bedroomDescription: 'Very organized',
    sleepType: 'Early Bird',
    weekdayBedtime: '10pm–11pm',
    freeTime: 'yoga, study groups, news',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Rarely',
    firstClassTime: '9am–10am',
    musicPreference: 'Jazz',
    politicalViews: 'Moderate',
    religion: 'Somewhat religious',
    studyEnvironment: 'Group study rooms',
    intendedMajor: 'International Affairs',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: '',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Occasionally',
    roomTemp: 'Moderate',
    bedroomDescription: 'Organized',
    sleepType: 'Night Owl',
    weekdayBedtime: '12am–1am',
    freeTime: 'coding, chess, documentaries',
    campusActivity: 'Not very active',
    visitorFrequency: 'Rarely',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '11am or later',
    musicPreference: 'Electronic',
    politicalViews: 'Liberal',
    religion: 'Not particularly religious',
    studyEnvironment: 'Dorm desk',
    intendedMajor: 'Mathematics',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Tennis',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Moderate',
    bedroomDescription: 'Organized',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '11pm–12am',
    freeTime: 'choir, piano, languages',
    campusActivity: 'Somewhat active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '10am–11am',
    musicPreference: 'Other: Choral',
    politicalViews: 'Moderate',
    religion: 'Prefer not to say',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Music Education',
    vehicleToCampus: 'Car',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Soccer | Track',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Cool',
    bedroomDescription: 'Organized',
    sleepType: 'Early Bird',
    weekdayBedtime: 'Before 10pm',
    freeTime: 'running, lifting, meal prep',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Rarely',
    weekendHomeFrequency: 'Rarely',
    firstClassTime: '8am–9am',
    musicPreference: 'Country',
    politicalViews: 'Conservative',
    religion: 'Very religious',
    studyEnvironment: 'Group study rooms',
    intendedMajor: 'Business | Economics',
    vehicleToCampus: 'Car',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Swimming',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Occasionally',
    roomTemp: 'Warm',
    bedroomDescription: 'Organized',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '11pm–12am',
    freeTime: 'research, tutoring, baking',
    campusActivity: 'Somewhat active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '9am–10am',
    musicPreference: 'Indie',
    politicalViews: 'Moderate',
    religion: 'Somewhat religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Chemistry | Pre-med',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Football | Lacrosse',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Prefer not to say',
    roomTemp: 'Moderate',
    bedroomDescription: 'Very organized',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '10pm–11pm',
    freeTime: 'student gov, debate, podcasts',
    campusActivity: 'Very active',
    visitorFrequency: 'Often',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '10am–11am',
    musicPreference: 'Rock',
    politicalViews: 'Moderate',
    religion: 'Prefer not to say',
    studyEnvironment: 'Group study rooms',
    intendedMajor: 'Political Science',
    vehicleToCampus: 'Bike',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: '',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Never drink',
    roomTemp: 'Cool',
    bedroomDescription: 'Disorganized but not messy',
    sleepType: 'Night Owl',
    weekdayBedtime: '12am–1am',
    freeTime: 'photography, journaling, baking',
    campusActivity: 'Not very active',
    visitorFrequency: 'Rarely',
    weekendHomeFrequency: 'Often',
    firstClassTime: '11am or later',
    musicPreference: 'Jazz',
    politicalViews: 'Liberal',
    religion: 'Not religious',
    studyEnvironment: 'Coffee shop',
    intendedMajor: 'English | Art',
    vehicleToCampus: 'Bus',
  },
  {
    gender: 'Non-binary',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Basketball',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Moderate',
    bedroomDescription: 'Organized',
    sleepType: 'Early Bird',
    weekdayBedtime: '10pm–11pm',
    freeTime: 'hackathons, climbing, cooking',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Rarely',
    firstClassTime: '9am–10am',
    musicPreference: 'Electronic',
    politicalViews: 'Very liberal',
    religion: 'Not particularly religious',
    studyEnvironment: 'Dorm desk',
    intendedMajor: 'Computer Science',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Tennis',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Occasionally',
    roomTemp: 'Warm',
    bedroomDescription: 'Very organized',
    sleepType: 'Early Bird',
    weekdayBedtime: 'Before 10pm',
    freeTime: 'clinical hours, yoga, family calls',
    campusActivity: 'Somewhat active',
    visitorFrequency: 'Rarely',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '8am–9am',
    musicPreference: 'Pop',
    politicalViews: 'Moderate',
    religion: 'Somewhat religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Nursing | Biology',
    vehicleToCampus: 'Car',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: '',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Never drink',
    roomTemp: 'Cool',
    bedroomDescription: 'Messy',
    sleepType: 'Night Owl',
    weekdayBedtime: 'After 1am',
    freeTime: 'band practice, games, drawing',
    campusActivity: 'Somewhat active',
    visitorFrequency: 'Often',
    weekendHomeFrequency: 'Often',
    firstClassTime: '11am or later',
    musicPreference: 'Rock',
    politicalViews: 'Liberal',
    religion: 'Prefer not to say',
    studyEnvironment: 'Group study rooms',
    intendedMajor: 'Music Education',
    vehicleToCampus: 'Bike',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Volleyball | Softball',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Social drinker',
    roomTemp: 'Moderate',
    bedroomDescription: 'Organized',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '11pm–12am',
    freeTime: 'internship, gym, volunteering',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '10am–11am',
    musicPreference: 'Country',
    politicalViews: 'Conservative',
    religion: 'Very religious',
    studyEnvironment: 'Quiet library',
    intendedMajor: 'Business | Economics',
    vehicleToCampus: 'Walk',
  },
  {
    gender: 'Man',
    sexAssignedAtBirth: 'Male',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Baseball',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Occasionally',
    roomTemp: 'Warm',
    bedroomDescription: 'Disorganized but not messy',
    sleepType: 'Somewhere in between',
    weekdayBedtime: '12am–1am',
    freeTime: 'intramurals, podcasts, meal hall',
    campusActivity: 'Moderately active',
    visitorFrequency: 'Sometimes',
    weekendHomeFrequency: 'Sometimes',
    firstClassTime: '9am–10am',
    musicPreference: 'Hip-hop',
    politicalViews: 'Moderate',
    religion: 'Somewhat religious',
    studyEnvironment: 'Coffee shop',
    intendedMajor: 'Psychology | Sociology',
    vehicleToCampus: 'Car',
  },
  {
    gender: 'Woman',
    sexAssignedAtBirth: 'Female',
    adaAccommodations: 'None',
    animalAllergies: '',
    varsitySport: 'Soccer | Track',
    smoking: 'Non-smoker',
    cannabis: 'Non-smoker',
    alcohol: 'Prefer not to say',
    roomTemp: 'Cool',
    bedroomDescription: 'Organized',
    sleepType: 'Early Bird',
    weekdayBedtime: '10pm–11pm',
    freeTime: 'newspaper, cross country, languages',
    campusActivity: 'Very active',
    visitorFrequency: 'Rarely',
    weekendHomeFrequency: 'Rarely',
    firstClassTime: '8am–9am',
    musicPreference: 'Classical',
    politicalViews: 'Liberal',
    religion: 'Not particularly religious',
    studyEnvironment: 'Dorm desk',
    intendedMajor: 'International Affairs',
    vehicleToCampus: 'Walk',
  },
];

const NAMES = [
  'Alex Morgan',
  'Jordan Lee',
  'Sam Taylor',
  'Casey Riley',
  'Morgan Blake',
  'Riley Quinn',
  'Drew Parker',
  'Jamie Avery',
  'Quinn Ellis',
  'Taylor Reese',
  'Avery Kim',
  'Blake Chen',
  'Cameron Wells',
  'Dana Ortiz',
  'Emery Park',
  'Finley Reed',
  'Gray Santos',
  'Harper Ng',
  'Indigo Moore',
  'Jules Patel',
];

const BIOS = [
  'Biology major from Lexington. Love hiking and coffee.',
  'Pre-med from Louisville. Guitar and cross country.',
  'History from Cincinnati. Board games and podcasts.',
  'Art and psych from Nashville. Painting and yoga.',
  'CS from Bowling Green. Gaming and cooking.',
  'English from Owensboro. Writer and tea.',
  'Business and Spanish from Covington. Soccer and travel.',
  'Chemistry from Frankfort. Lab and running.',
  'Political science from Georgetown. Debate and news.',
  'Music and education from Richmond. Piano and choir.',
  'Neuroscience from Ashland. Climbing and jazz.',
  'Engineering from Paducah. Robotics club.',
  'Sociology from Berea. Community org and film.',
  'Nursing from Somerset. Clinical shifts and baking.',
  'Philosophy from Murray. Debate team.',
  'Environmental sci from Morehead. Hiking club.',
  'Economics from Hopkinsville. Student investing club.',
  'Anthropology from Danville. Museum volunteer.',
  'Theater from Bardstown. Stage crew and vocals.',
  'Journalism from Elizabethtown. Campus radio.',
];

/**
 * Possible-match graph: path 1–2–…–20 (swipe20 has 1 edge; others mostly 2–3) plus chords
 * so several users have 3 possible matches. Similarity scores are computeSimilarityScore
 * on the 20 distinct questionnaires (mixed values in 0–1).
 */
function buildPossibleMatchEdges(): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 1; i < 20; i++) {
    edges.push([i, i + 1]);
  }
  edges.push([1, 11], [2, 12], [3, 13], [6, 16], [7, 17]);
  return edges;
}

const POSSIBLE_MATCH_EDGES = buildPossibleMatchEdges();

function degreeByUser(edges: [number, number][], n: number): number[] {
  const d = Array.from({ length: n + 1 }, () => 0);
  for (const [a, b] of edges) {
    d[a]++;
    d[b]++;
  }
  return d;
}

async function removeSwipeTestData() {
  await prisma.swipeActions.deleteMany({
    where: {
      OR: [{ swiperEmail: { in: SWIPE_EMAILS } }, { targetEmail: { in: SWIPE_EMAILS } }],
    },
  });
  await prisma.possibleMatches.deleteMany({
    where: {
      OR: [{ userEmail1: { in: SWIPE_EMAILS } }, { userEmail2: { in: SWIPE_EMAILS } }],
    },
  });
  const del = await prisma.users.deleteMany({
    where: { email: { in: SWIPE_EMAILS } },
  });
  console.log(`Removed ${del.count} prior swipe test user row(s) and related swipe/possible-match data.`);
}

async function upsertPossiblePair(a: string, b: string) {
  const [e1, e2] = canonicalPair(a, b);
  const [q1, q2] = await Promise.all([
    prisma.privateQuestionnaire.findUnique({ where: { userEmail: e1 } }),
    prisma.privateQuestionnaire.findUnique({ where: { userEmail: e2 } }),
  ]);
  if (!q1 || !q2) {
    console.warn(`Skip possible match ${e1} / ${e2}: missing questionnaire`);
    return;
  }
  const score = computeSimilarityScore(q1, q2);
  await prisma.possibleMatches.upsert({
    where: { userEmail1_userEmail2: { userEmail1: e1, userEmail2: e2 } },
    create: { userEmail1: e1, userEmail2: e2, similarityScore: score },
    update: { similarityScore: score },
  });
  console.log(`Possible match ${e1} ↔ ${e2} (score ${score.toFixed(3)})`);
}

async function main() {
  if (USER_QUESTIONNAIRES.length !== 20) {
    throw new Error('USER_QUESTIONNAIRES must have length 20');
  }

  const passwordHash = await argon2.hash(PASSWORD);

  await removeSwipeTestData();

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

  const test2Q: QData = {
    ...USER_QUESTIONNAIRES[0],
    animalAllergies: '',
    classStanding: 'Senior',
  };
  await prisma.privateQuestionnaire.upsert({
    where: { userEmail: 'test2@transy.edu' },
    create: { userEmail: 'test2@transy.edu', ...test2Q },
    update: { ...test2Q },
  });
  console.log('Ensured test2@transy.edu + private questionnaire');

  for (let i = 0; i < 20; i++) {
    const n = i + 1;
    const email = `swipe${n}@transy.edu`;
    const qData = USER_QUESTIONNAIRES[i];

    await prisma.users.create({
      data: {
        email,
        name: NAMES[i],
        passwordHash,
        isMatched: false,
        profileSetupComplete: true,
        emailVerified: true,
      },
    });

    await prisma.userProfiles.create({
      data: {
        userEmail: email,
        bio: BIOS[i],
        topInterests: 'Study groups, Campus events, Fitness',
        dailyLife: 'Flexible, Tidy, Social',
        profilePicture: PLACEHOLDER_PHOTO(n),
      },
    });

    await prisma.privateQuestionnaire.create({
      data: {
        userEmail: email,
        ...qData,
        classStanding: STANDINGS[i % 4],
      },
    });

    const peeves = ['Loud late nights', 'Unwashed dishes', 'Borrowing without asking'];
    for (const p of peeves) {
      await prisma.petPeeves.create({
        data: { userEmail: email, petPeeve: p, severity: 'medium', isPublic: true },
      });
    }

    console.log('Created', email);
  }

  const deg = degreeByUser(POSSIBLE_MATCH_EDGES, 20);
  console.log('\nPossible-match degree plan (count of PossibleMatches per swipe user):');
  for (let u = 1; u <= 20; u++) {
    console.log(`  swipe${u}: ${deg[u]} possible match(es)`);
  }

  console.log('\nSeeding PossibleMatches (scores from algorithm on distinct questionnaires)…');
  for (const [a, b] of POSSIBLE_MATCH_EDGES) {
    await upsertPossiblePair(`swipe${a}@transy.edu`, `swipe${b}@transy.edu`);
  }

  console.log('\nDone. Login as test2@transy.edu / password123 to browse the deck.');
  console.log('Swipe users: swipe1@transy.edu … swipe20@transy.edu / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
