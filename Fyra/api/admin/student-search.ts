/// POST: Admin Levenshtein search over unmatched users (top 5), no isPairBlocked.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../lib/adminAuth.js';
import { setAdminCors } from '../lib/cors.js';
import { isValidClassStanding } from '../lib/classStanding.js';
import { levenshtein } from '../lib/levenshtein.js';

const prisma = new PrismaClient();

function buildQueryName(firstName: string, lastName: string): string {
  return [firstName, lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
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

  const body = req.body as { firstName?: string; lastName?: string; standing?: string };
  const firstName = (body.firstName as string) ?? '';
  const lastName = (body.lastName as string) ?? '';
  const standingRaw = (body.standing as string)?.trim();

  const queryName = buildQueryName(firstName, lastName);
  if (!queryName) {
    return res.status(400).json({ error: 'Enter a first name and/or last name' });
  }
  let standingFilter: string | undefined;
  if (standingRaw) {
    if (!isValidClassStanding(standingRaw)) {
      return res.status(400).json({ error: 'Invalid standing' });
    }
    standingFilter = standingRaw;
  }

  try {
    const candidates = await prisma.users.findMany({
      where: {
        isMatched: false,
        isActive: true,
        isAdmin: false,
        profileSetupComplete: true,
        ...(standingFilter
          ? {
              privateQuestionnaire: {
                is: { classStanding: standingFilter },
              },
            }
          : {}),
      },
      select: {
        email: true,
        name: true,
        privateQuestionnaire: { select: { classStanding: true } },
      },
    });

    const scored: { email: string; name: string; classStanding: string | null; distance: number }[] = [];
    for (const u of candidates) {
      const tq = u.privateQuestionnaire;
      if (standingFilter && (!tq || tq.classStanding !== standingFilter)) continue;
      const distance = levenshtein(queryName, u.name);
      scored.push({
        email: u.email,
        name: u.name,
        classStanding: tq?.classStanding ?? null,
        distance,
      });
    }

    scored.sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name));
    const top = scored.slice(0, 5).map(({ distance: _d, ...rest }) => rest);

    return res.status(200).json({ results: top });
  } catch (e) {
    console.error('admin student-search:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
