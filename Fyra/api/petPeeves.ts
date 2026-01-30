/// file: petPeeves.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// API for roommate pet peeves. GET by user, POST add, DELETE by id.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const email = (req.query.email as string)?.trim()?.toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    try {
      const list = await prisma.petPeeves.findMany({
        where: { userEmail: email },
        orderBy: { id: 'asc' },
      });
      return res.status(200).json(list);
    } catch (e) {
      console.error('petPeeves GET error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as { email: string; petPeeve: string; severity?: string };
      const email = body?.email?.trim()?.toLowerCase();
      const petPeeve = body?.petPeeve?.trim();
      if (!email || !petPeeve) {
        return res.status(400).json({ error: 'Email and petPeeve are required' });
      }
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const severity = (body.severity?.trim() || 'medium') as string;
      const created = await prisma.petPeeves.create({
        data: { userEmail: email, petPeeve, severity },
      });
      return res.status(201).json(created);
    } catch (e) {
      console.error('petPeeves POST error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = Number((req.query.id as string) ?? (req.body as { id?: number })?.id);
      const email = (req.query.email as string)?.trim()?.toLowerCase() ?? (req.body as { email?: string })?.email?.trim()?.toLowerCase();
      if (!email || Number.isNaN(id)) {
        return res.status(400).json({ error: 'Email and id are required' });
      }
      const existing = await prisma.petPeeves.findFirst({
        where: { id, userEmail: email },
      });
      if (!existing) return res.status(404).json({ error: 'Pet peeve not found' });
      await prisma.petPeeves.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('petPeeves DELETE error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
