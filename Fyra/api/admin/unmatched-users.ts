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
    const users = await prisma.users.findMany({
      where: {
        isMatched: false,
        profileSetupComplete: true,
        isActive: true,
        isAdmin: false,
      },
      select: { email: true, name: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ users });
  } catch (e) {
    console.error('admin unmatched-users:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
