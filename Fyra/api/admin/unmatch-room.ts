/// Admin: remove a roommate pair — deletes the match (and shared calendar/chores), sets both users unmatched.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../lib/adminAuth.js';
import { setAdminCors } from '../lib/cors.js';

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

  const body = req.body as { matchId?: number };
  const matchId = body.matchId;
  if (matchId == null || typeof matchId !== 'number' || !Number.isInteger(matchId) || matchId < 1) {
    return res.status(400).json({ error: 'matchId is required' });
  }

  try {
    const existing = await prisma.matches.findUnique({ where: { id: matchId } });
    if (!existing) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const a = existing.userEmail1;
    const b = existing.userEmail2;

    await prisma.$transaction(async (tx) => {
      await tx.swipeActions.deleteMany({
        where: {
          OR: [
            { swiperEmail: a, targetEmail: b },
            { swiperEmail: b, targetEmail: a },
          ],
        },
      });
      await tx.matches.delete({ where: { id: matchId } });
      await tx.users.updateMany({
        where: { email: { in: [a, b] } },
        data: { isMatched: false },
      });
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('admin unmatch-room:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
