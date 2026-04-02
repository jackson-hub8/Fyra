/// GET: Pairs of users who have both sent each other a match request (search flow).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../lib/adminAuth.js';
import { setAdminCors } from '../lib/cors.js';
import { canonicalPair } from '../lib/matching.js';

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
    const rows = await prisma.matchRequest.findMany({
      select: { fromEmail: true, toEmail: true },
    });
    const forward = new Set(rows.map((r) => `${r.fromEmail}\0${r.toEmail}`));
    const pairKeys = new Set<string>();
    const pairs: { email1: string; email2: string }[] = [];
    for (const r of rows) {
      const rev = `${r.toEmail}\0${r.fromEmail}`;
      if (!forward.has(rev)) continue;
      const [e1, e2] = canonicalPair(r.fromEmail, r.toEmail);
      const key = `${e1}\0${e2}`;
      if (pairKeys.has(key)) continue;
      pairKeys.add(key);
      pairs.push({ email1: e1, email2: e2 });
    }

    const emails = [...new Set(pairs.flatMap((p) => [p.email1, p.email2]))];
    const users = await prisma.users.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true },
    });
    const nameByEmail = new Map(users.map((u) => [u.email, u.name]));

    const mutual = pairs.map((p) => ({
      user1: { email: p.email1, name: nameByEmail.get(p.email1) ?? p.email1 },
      user2: { email: p.email2, name: nameByEmail.get(p.email2) ?? p.email2 },
    }));

    return res.status(200).json({ mutual });
  } catch (e) {
    console.error('mutual-match-requests:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
