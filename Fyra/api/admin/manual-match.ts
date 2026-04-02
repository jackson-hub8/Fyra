import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../lib/adminAuth.js';
import { setAdminCors } from '../lib/cors.js';
import { canonicalPair } from '../lib/matching.js';
import { matchRequestsInvolvingEmails } from '../lib/matchRequestCleanup.js';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setAdminCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  const body = req.body as { userEmailA?: string; userEmailB?: string };
  const a = (body.userEmailA as string)?.trim()?.toLowerCase();
  const b = (body.userEmailB as string)?.trim()?.toLowerCase();
  if (!a || !b || a === b) {
    return res.status(400).json({ error: 'userEmailA and userEmailB are required and must differ' });
  }

  try {
    const [users, existingMatch] = await Promise.all([
      prisma.users.findMany({
        where: { email: { in: [a, b] } },
        select: { email: true, isMatched: true },
      }),
      prisma.matches.findFirst({
        where: {
          OR: [
            { userEmail1: a, userEmail2: b },
            { userEmail1: b, userEmail2: a },
          ],
        },
      }),
    ]);
    if (users.length !== 2) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    if (users.some((u) => u.isMatched)) {
      return res.status(400).json({ error: 'One or both users are already matched' });
    }
    if (existingMatch) {
      return res.status(400).json({ error: 'These users are already matched' });
    }

    const [u1, u2] = canonicalPair(a, b);

    await prisma.$transaction(async (tx) => {
      await tx.matchRequest.deleteMany({
        where: matchRequestsInvolvingEmails([a, b]),
      });
      await tx.possibleMatches.deleteMany({
        where: {
          OR: [{ userEmail1: { in: [a, b] } }, { userEmail2: { in: [a, b] } }],
        },
      });
      await tx.matches.create({
        data: {
          userEmail1: u1,
          userEmail2: u2,
          matchScore: null,
          status: 'active',
        },
      });
      await tx.users.updateMany({
        where: { email: { in: [a, b] } },
        data: { isMatched: true },
      });
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('admin manual-match:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
