/// POST: Admin removes both directed match-request rows for a pair (mutual search requests).

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

  const body = req.body as { userEmailA?: string; userEmailB?: string };
  const a = (body.userEmailA as string)?.trim()?.toLowerCase();
  const b = (body.userEmailB as string)?.trim()?.toLowerCase();
  if (!a || !b || a === b) {
    return res.status(400).json({ error: 'userEmailA and userEmailB are required and must differ' });
  }

  try {
    const result = await prisma.matchRequest.deleteMany({
      where: {
        OR: [
          { fromEmail: a, toEmail: b },
          { fromEmail: b, toEmail: a },
        ],
      },
    });
    return res.status(200).json({ success: true, deleted: result.count });
  } catch (e) {
    console.error('admin reject-match-requests:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
