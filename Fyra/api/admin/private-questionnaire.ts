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
    const q = await prisma.privateQuestionnaire.findUnique({
      where: { userEmail: email },
    });
    if (!q) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }
    return res.status(200).json({ questionnaire: q });
  } catch (e) {
    console.error('admin private-questionnaire:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
