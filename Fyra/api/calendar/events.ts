/// File: events.ts
/// Calendar events for a matched pair. Stored in DB; one color per user (user1 vs user2 in match).

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

/** Get the match for this user (where they are user1 or user2). Returns null if not matched. */
async function getMatchForUser(email: string) {
  const match = await prisma.matches.findFirst({
    where: {
      OR: [{ userEmail1: email }, { userEmail2: email }],
    },
  });
  return match;
}

/** Check that the current user is part of the match that owns this event. */
async function getEventAndMatch(
  eventId: number,
  userEmail: string
): Promise<{ event: { id: number; matchId: number }; match: { id: number; userEmail1: string; userEmail2: string } } | null> {
  const event = await prisma.calendarEvents.findUnique({
    where: { id: eventId },
    select: { id: true, matchId: true },
  });
  if (!event) return null;
  const match = await prisma.matches.findUnique({
    where: { id: event.matchId },
  });
  if (!match) return null;
  const isInMatch =
    match.userEmail1 === userEmail || match.userEmail2 === userEmail;
  if (!isInMatch) return null;
  return { event, match };
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
        return res.status(200).json({
          events: [],
          matchUserEmails: null,
        });
      }
      const events = await prisma.calendarEvents.findMany({
        where: { matchId: match.id },
        orderBy: [{ startDate: 'asc' }, { startTime: 'asc' }],
      });
      const list = events.map((e) => ({
        id: String(e.id),
        title: e.title,
        description: e.description ?? undefined,
        startDate: e.startDate,
        endDate: e.endDate,
        startTime: e.startTime ?? null,
        endTime: e.endTime ?? null,
        isAllDay: e.isAllDay,
        creatorId: e.creatorEmail,
      }));
      return res.status(200).json({
        events: list,
        matchUserEmails: [match.userEmail1, match.userEmail2],
      });
    } catch (e) {
      console.error('events GET error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const match = await getMatchForUser(email);
      if (!match) {
        return res.status(403).json({ error: 'User is not matched; cannot add events' });
      }
      const body = req.body as {
        title: string;
        description?: string;
        startDate: string;
        endDate: string;
        startTime?: string | null;
        endTime?: string | null;
        isAllDay: boolean;
      };
      const title = body?.title?.trim();
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const isAllDay = Boolean(body?.isAllDay);
      const startDate = String(body?.startDate ?? '').slice(0, 10);
      const endDate = String(body?.endDate ?? '').slice(0, 10);
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }
      const created = await prisma.calendarEvents.create({
        data: {
          matchId: match.id,
          creatorEmail: email,
          title,
          description: body?.description?.trim() || null,
          startDate,
          endDate,
          startTime: isAllDay ? null : (body?.startTime ?? null),
          endTime: isAllDay ? null : (body?.endTime ?? null),
          isAllDay,
        },
      });
      return res.status(201).json({
        id: String(created.id),
        title: created.title,
        description: created.description ?? undefined,
        startDate: created.startDate,
        endDate: created.endDate,
        startTime: created.startTime ?? null,
        endTime: created.endTime ?? null,
        isAllDay: created.isAllDay,
        creatorId: created.creatorEmail,
      });
    } catch (e) {
      console.error('events POST error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const id = Number(
        (req.query.id as string) ?? (req.body as { id?: number | string })?.id
      );
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Valid event id is required' });
      }
      const pair = await getEventAndMatch(id, email);
      if (!pair) {
        return res.status(404).json({ error: 'Event not found' });
      }
      const body = req.body as Partial<{
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        startTime: string | null;
        endTime: string | null;
        isAllDay: boolean;
      }>;
      const data: {
        title?: string;
        description?: string | null;
        startDate?: string;
        endDate?: string;
        startTime?: string | null;
        endTime?: string | null;
        isAllDay?: boolean;
      } = {};
      if (body?.title !== undefined) data.title = body.title.trim();
      if (body?.description !== undefined)
        data.description = body.description?.trim() || null;
      if (body?.startDate !== undefined) data.startDate = String(body.startDate).slice(0, 10);
      if (body?.endDate !== undefined) data.endDate = String(body.endDate).slice(0, 10);
      if (body?.startTime !== undefined) data.startTime = body.startTime;
      if (body?.endTime !== undefined) data.endTime = body.endTime;
      if (body?.isAllDay !== undefined) data.isAllDay = body.isAllDay;

      const updated = await prisma.calendarEvents.update({
        where: { id },
        data,
      });
      return res.status(200).json({
        id: String(updated.id),
        title: updated.title,
        description: updated.description ?? undefined,
        startDate: updated.startDate,
        endDate: updated.endDate,
        startTime: updated.startTime ?? null,
        endTime: updated.endTime ?? null,
        isAllDay: updated.isAllDay,
        creatorId: updated.creatorEmail,
      });
    } catch (e) {
      console.error('events PATCH error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = Number(
        (req.query.id as string) ?? (req.body as { id?: number | string })?.id
      );
      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Valid event id is required' });
      }
      const pair = await getEventAndMatch(id, email);
      if (!pair) {
        return res.status(404).json({ error: 'Event not found' });
      }
      await prisma.calendarEvents.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('events DELETE error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
