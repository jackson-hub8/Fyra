/// File: deck.ts
/// GET: list unmatched users the current user has not yet swiped on (deck for matching page).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { isPairBlocked } from '../lib/matching.js';

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

    const possibleRows = await prisma.possibleMatches.findMany({
      where: {
        OR: [{ userEmail1: email }, { userEmail2: email }],
      },
      select: { userEmail1: true, userEmail2: true },
    });
    const possiblePartnerSet = new Set<string>();
    for (const p of possibleRows) {
      possiblePartnerSet.add(p.userEmail1 === email ? p.userEmail2 : p.userEmail1);
    }

    const users = await prisma.users.findMany({
      where: {
        email: { not: email },
        isMatched: false,
        isAdmin: false,
        profileSetupComplete: true,
        isActive: true,
      },
      select: { email: true },
    });

    const viewerQ = await prisma.privateQuestionnaire.findUnique({
      where: { userEmail: email },
    });

    const candidateEmails = users.map((u) => u.email);
    const targetQs = await prisma.privateQuestionnaire.findMany({
      where: { userEmail: { in: candidateEmails } },
    });
    const qByEmail = new Map(targetQs.map((q) => [q.userEmail, q]));

    const deck = candidateEmails.filter((e) => {
      if (swipedSet.has(e) || matchedSet.has(e)) return false;
      if (possiblePartnerSet.has(e)) return false;
      const tq = qByEmail.get(e);
      if (viewerQ && tq && isPairBlocked(viewerQ, tq)) return false;
      return true;
    });

    return res.status(200).json({ deck });
  } catch (e) {
    console.error('deck GET error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
