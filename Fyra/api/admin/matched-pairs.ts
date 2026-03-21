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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const admin = await requireAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const matches = await prisma.matches.findMany({
      orderBy: { matchedAt: 'desc' },
      include: {
        user1: { select: { email: true, name: true } },
        user2: { select: { email: true, name: true } },
      },
    });
    const pairs = matches.map((m) => ({
      id: m.id,
      matchScore: m.matchScore,
      matchedAt: m.matchedAt,
      user1: m.user1,
      user2: m.user2,
    }));
    return res.status(200).json({ matches: pairs });
  } catch (e) {
    console.error('admin matched-pairs:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
