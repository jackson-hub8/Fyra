import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../lib/adminAuth';
import { setAdminCors } from '../lib/cors';

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
    await prisma.possibleMatches.delete({
      where: { id: possibleMatchId },
    });
    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : '';
    if (code === 'P2025') {
      return res.status(404).json({ error: 'Possible match not found' });
    }
    console.error('admin reject-match:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
