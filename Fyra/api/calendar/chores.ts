/// File: chores.ts
/// Chores for a matched pair. Stored in DB; title and due date per chore, with completed flag.

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

function getEmail(req: VercelRequest): string | null {
  const email =
    (req.query.email as string)?.trim()?.toLowerCase() ??
    (req.body as { email?: string })?.email?.trim()?.toLowerCase();
  return email || null;
}

async function getMatchForUser(email: string) {
  const match = await prisma.matches.findFirst({
    where: {
      OR: [{ userEmail1: email }, { userEmail2: email }],
    },
  });
  return match;
}

async function getChoreAndMatch(
  choreId: number,
  userEmail: string
): Promise<{ chore: { id: number; matchId: number }; match: { id: number } } | null> {
  const chore = await prisma.chores.findUnique({
    where: { id: choreId },
    select: { id: true, matchId: true },
  });
  if (!chore) return null;
  const match = await prisma.matches.findFirst({
    where: {
      id: chore.matchId,
      OR: [{ userEmail1: userEmail }, { userEmail2: userEmail }],
    },
  });
  if (!match) return null;
  return { chore, match };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const email = getEmail(req);
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (req.method === 'GET') {
    try {
      const match = await getMatchForUser(email);
      if (!match) {
        return res.status(200).json({ chores: [] });
      }
      const chores = await prisma.chores.findMany({
        where: { matchId: match.id },
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      });
      const list = chores.map((c) => ({
        id: String(c.id),
        title: c.title,
        dueDate: c.dueDate,
        completed: c.completed,
      }));
      return res.status(200).json({ chores: list });
    } catch (e) {
      console.error('chores GET error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const match = await getMatchForUser(email);
      if (!match) {
        return res.status(403).json({ error: 'User is not matched; cannot add chores' });
      }
      const body = req.body as { title?: string; dueDate?: string };
      const title = body?.title?.trim();
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const dueDate = String(body?.dueDate ?? '').slice(0, 10);
      if (!dueDate) {
        return res.status(400).json({ error: 'dueDate is required (YYYY-MM-DD)' });
      }
      const created = await prisma.chores.create({
        data: {
          matchId: match.id,
          title,
          dueDate,
          completed: false,
        },
      });
      return res.status(201).json({
        id: String(created.id),
        title: created.title,
        dueDate: created.dueDate,
        completed: created.completed,
      });
    } catch (e) {
      console.error('chores POST error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const id = Number(
        (req.query.id as string) ?? (req.body as { id?: number | string })?.id
      );
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Valid chore id is required' });
      }
      const pair = await getChoreAndMatch(id, email);
      if (!pair) {
        return res.status(404).json({ error: 'Chore not found' });
      }
      const body = req.body as Partial<{ title: string; dueDate: string; completed: boolean }>;
      const data: { title?: string; dueDate?: string; completed?: boolean } = {};
      if (body?.title !== undefined) data.title = body.title.trim();
      if (body?.dueDate !== undefined) data.dueDate = String(body.dueDate).slice(0, 10);
      if (body?.completed !== undefined) data.completed = body.completed;

      const updated = await prisma.chores.update({
        where: { id },
        data,
      });
      return res.status(200).json({
        id: String(updated.id),
        title: updated.title,
        dueDate: updated.dueDate,
        completed: updated.completed,
      });
    } catch (e) {
      console.error('chores PATCH error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = Number(
        (req.query.id as string) ?? (req.body as { id?: number | string })?.id
      );
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Valid chore id is required' });
      }
      const pair = await getChoreAndMatch(id, email);
      if (!pair) {
        return res.status(404).json({ error: 'Chore not found' });
      }
      await prisma.chores.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('chores DELETE error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
