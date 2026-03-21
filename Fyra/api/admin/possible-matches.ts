import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../_lib/adminAuth';
import { setAdminCors } from '../_lib/cors';

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
    return res.status(400).json({ error: 'email query is required' });
  }

  try {
    const rows = await prisma.possibleMatches.findMany({
      where: {
        OR: [{ userEmail1: email }, { userEmail2: email }],
      },
      orderBy: [{ similarityScore: 'desc' }, { createdAt: 'desc' }],
    });

    const partnerEmails = rows.map((r) => (r.userEmail1 === email ? r.userEmail2 : r.userEmail1));
    const names = await prisma.users.findMany({
      where: { email: { in: partnerEmails } },
      select: { email: true, name: true },
    });
    const nameByEmail = new Map(names.map((u) => [u.email, u.name]));

    const list = rows.map((r) => {
      const partner = r.userEmail1 === email ? r.userEmail2 : r.userEmail1;
      return {
        id: r.id,
        partnerEmail: partner,
        partnerName: nameByEmail.get(partner) ?? partner,
        similarityScore: r.similarityScore,
        createdAt: r.createdAt,
      };
    });

    return res.status(200).json({ possibleMatches: list });
  } catch (e) {
    console.error('admin possible-matches:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
