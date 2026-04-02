/// POST: Levenshtein-ranked unmatched peers (up to 5 within distance cutoff), optional standing filter, excludes isPairBlocked.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { isPairBlocked } from '../lib/matching.js';
import { isValidClassStanding } from '../lib/classStanding.js';
import { levenshtein, maxAllowedLevenshteinForNameSearch, normalizeForSearch } from '../lib/levenshtein.js';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

function buildQueryName(firstName: string, lastName: string): string {
  return [firstName, lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as {
    searcherEmail?: string;
    firstName?: string;
    lastName?: string;
    standing?: string;
  };
  const searcherEmail = (body.searcherEmail as string)?.trim()?.toLowerCase();
  const firstName = (body.firstName as string) ?? '';
  const lastName = (body.lastName as string) ?? '';
  const standingRaw = (body.standing as string)?.trim();

  if (!searcherEmail) {
    return res.status(400).json({ error: 'searcherEmail is required' });
  }

  const queryName = buildQueryName(firstName, lastName);
  if (!queryName) {
    return res.status(400).json({ error: 'Enter a first name and/or last name' });
  }
  const queryNormLen = normalizeForSearch(queryName).length;

  let standingFilter: string | undefined;
  if (standingRaw) {
    if (!isValidClassStanding(standingRaw)) {
      return res.status(400).json({ error: 'Invalid standing' });
    }
    standingFilter = standingRaw;
  }

  try {
    const searcher = await prisma.users.findUnique({
      where: { email: searcherEmail },
      select: { isMatched: true, isAdmin: true },
    });
    if (!searcher) return res.status(404).json({ error: 'User not found' });
    if (searcher.isMatched) return res.status(403).json({ error: 'Already matched' });
    if (searcher.isAdmin) return res.status(403).json({ error: 'Not available for admin accounts' });

    const viewerQ = await prisma.privateQuestionnaire.findUnique({
      where: { userEmail: searcherEmail },
    });

    const candidates = await prisma.users.findMany({
      where: {
        email: { not: searcherEmail },
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
        privateQuestionnaire: {
          select: {
            classStanding: true,
            animalAllergies: true,
            smoking: true,
            cannabis: true,
            sexAssignedAtBirth: true,
          },
        },
      },
    });

    const scored: { email: string; name: string; classStanding: string | null; distance: number }[] = [];
    for (const u of candidates) {
      const tq = u.privateQuestionnaire;
      if (standingFilter && (!tq || tq.classStanding !== standingFilter)) continue;
      if (viewerQ && tq && isPairBlocked(viewerQ, tq)) continue;
      const distance = levenshtein(queryName, u.name);
      const targetNormLen = normalizeForSearch(u.name).length;
      const maxDist = maxAllowedLevenshteinForNameSearch(queryNormLen, targetNormLen);
      if (distance > maxDist) continue;
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
    console.error('student-search:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
