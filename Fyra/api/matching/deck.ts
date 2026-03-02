/// File: deck.ts
/// GET: list unmatched users the current user has not yet swiped on (deck for matching page).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = (req.query.email as string)?.trim()?.toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const swipedTargets = await prisma.swipeActions.findMany({
      where: { swiperEmail: email },
      select: { targetEmail: true },
    });
    const swipedSet = new Set(swipedTargets.map((s) => s.targetEmail));

    const alreadyMatched = await prisma.matches.findMany({
      where: {
        OR: [{ userEmail1: email }, { userEmail2: email }],
      },
      select: { userEmail1: true, userEmail2: true },
    });
    const matchedSet = new Set<string>();
    for (const m of alreadyMatched) {
      matchedSet.add(m.userEmail1);
      matchedSet.add(m.userEmail2);
    }

    const users = await prisma.users.findMany({
      where: {
        email: { not: email },
        isMatched: false,
        profileSetupComplete: true,
        isActive: true,
      },
      select: { email: true },
    });

    const deck = users
      .map((u) => u.email)
      .filter((e) => !swipedSet.has(e) && !matchedSet.has(e));

    return res.status(200).json({ deck });
  } catch (e) {
    console.error('deck GET error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
