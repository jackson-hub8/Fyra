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

  const email = (req.query.email as string)?.trim()?.toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'email query parameter is required' });
  }

  try {
    const rows = await prisma.profileReport.findMany({
      where: { reportedEmail: email },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { email: true, name: true } },
      },
    });

    const reports = rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      reporterEmail: r.reporter.email,
      reporterName: r.reporter.name,
    }));

    return res.status(200).json({ reports });
  } catch (e) {
    console.error('admin reports detail:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
