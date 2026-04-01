/// file: profileSetupComplete.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Mark user's profile setup as complete (after questionnaire + build profile).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { PROFILE_BIO_MAX_LENGTH } from '../lib/textFieldLimits.js';
import { parsePublicProfileList, publicProfileListFieldError } from '../lib/publicProfileValidation.js';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = (req.body as { email?: string })?.email?.trim()?.toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await prisma.userProfiles.findUnique({ where: { userEmail: email } });
    if (!profile?.bio?.trim()) {
      return res.status(400).json({ error: 'Bio is required before completing setup.' });
    }
    if (profile.bio.length > PROFILE_BIO_MAX_LENGTH) {
      return res.status(400).json({
        error: `Bio must be at most ${PROFILE_BIO_MAX_LENGTH} characters.`,
      });
    }
    const topErr = publicProfileListFieldError(
      parsePublicProfileList(profile.topInterests),
      'Top interests',
    );
    if (topErr) return res.status(400).json({ error: topErr });
    const dailyErr = publicProfileListFieldError(
      parsePublicProfileList(profile.dailyLife),
      'Daily life',
    );
    if (dailyErr) return res.status(400).json({ error: dailyErr });
    const petRows = await prisma.petPeeves.findMany({
      where: { userEmail: email },
      select: { petPeeve: true },
      orderBy: { id: 'asc' },
    });
    const petErr = publicProfileListFieldError(
      petRows.map((r) => r.petPeeve),
      'Roommate pet peeves',
    );
    if (petErr) return res.status(400).json({ error: petErr });

    await prisma.users.update({
      where: { email },
      data: { profileSetupComplete: true },
    });
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('profileSetupComplete error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
