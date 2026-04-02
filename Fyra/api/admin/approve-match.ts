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

  const body = req.body as { possibleMatchId?: number };
  const possibleMatchId = body.possibleMatchId;
  if (possibleMatchId == null || typeof possibleMatchId !== 'number') {
    return res.status(400).json({ error: 'possibleMatchId is required' });
  }

  try {
    const pm = await prisma.possibleMatches.findUnique({
      where: { id: possibleMatchId },
    });
    if (!pm) {
      return res.status(404).json({ error: 'Possible match not found' });
    }

    const a = pm.userEmail1;
    const b = pm.userEmail2;
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
          matchScore: pm.similarityScore,
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
    console.error('admin approve-match:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
