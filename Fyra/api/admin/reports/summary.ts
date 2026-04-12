import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../../lib/adminAuth.js';
import { setAdminCors } from '../../lib/cors.js';

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
    const grouped = await prisma.profileReport.groupBy({
      by: ['reportedEmail'],
      _count: { id: true },
    });
    grouped.sort((a, b) => b._count.id - a._count.id);

    const emails = grouped.map((g) => g.reportedEmail);
    if (emails.length === 0) {
      return res.status(200).json({ students: [] });
    }

    const users = await prisma.users.findMany({
      where: { email: { in: emails } },
      select: { email: true, name: true },
    });
    const nameByEmail = new Map(users.map((u) => [u.email, u.name]));

    const students = grouped.map((g) => ({
      email: g.reportedEmail,
      name: nameByEmail.get(g.reportedEmail) ?? g.reportedEmail,
      reportCount: g._count.id,
    }));

    return res.status(200).json({ students });
  } catch (e) {
    console.error('admin reports summary:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
