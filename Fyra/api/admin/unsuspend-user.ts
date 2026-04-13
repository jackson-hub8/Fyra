import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../lib/adminAuth.js';
import { setAdminCors } from '../lib/cors.js';

const prisma = new PrismaClient();

function parseJsonBody(req: VercelRequest): Record<string, unknown> {
  const raw = req.body as unknown;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

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

  const body = parseJsonBody(req);
  const targetEmail =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!targetEmail) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { email: targetEmail },
      select: { email: true, isAdmin: true, isActive: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isAdmin) {
      return res.status(400).json({ error: 'Cannot change suspension for an admin account' });
    }
    if (user.isActive) {
      return res.status(400).json({ error: 'User is not suspended' });
    }

    await prisma.users.update({
      where: { email: targetEmail },
      data: { isActive: true },
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('admin unsuspend-user:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
