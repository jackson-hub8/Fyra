/// file: clear-test2-swipe-history.ts
/// Clears all swipe actions (likes and passes) for test2@transy.edu so the matching deck resets.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST2_EMAIL = 'test2@transy.edu';

async function main() {
  const result = await prisma.swipeActions.deleteMany({
    where: { swiperEmail: TEST2_EMAIL },
  });
  console.log(`Deleted ${result.count} swipe action(s) for ${TEST2_EMAIL}.`);
  console.log('test2\'s matching deck will show all swipe users again.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
