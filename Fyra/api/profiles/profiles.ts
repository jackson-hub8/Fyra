/// File: profiles.ts
/// Jackson Hurley, Kaitlyn Maes, Cameron Horine
/// API for user profile (display): bio, photo, topInterests, dailyLife (daily activities). GET by user, PATCH update.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { OPEN_TEXT_MAX_LENGTH, PROFILE_BIO_MAX_LENGTH } from '../lib/textFieldLimits.js';
import {
  MAX_PUBLIC_PROFILE_LIST_ITEMS,
  MIN_PUBLIC_PROFILE_LIST_ITEMS,
  parsePublicProfileList,
  publicProfileListFieldError,
} from '../lib/publicProfileValidation.js';

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

  const email = (req.query.email as string)?.trim()?.toLowerCase() ?? (req.body as { email?: string })?.email?.trim()?.toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.users.findUnique({
        where: { email },
        select: { name: true },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      let profile = await prisma.userProfiles.findUnique({
        where: { userEmail: email },
      });
      if (!profile) {
        profile = await prisma.userProfiles.create({
          data: { userEmail: email },
        });
      }
      return res.status(200).json({ ...profile, name: user.name });
    } catch (e) {
      console.error('profiles GET error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const body = req.body as { bio?: string; profilePicture?: string; topInterests?: string; dailyLife?: string; major?: string };
      const data: { bio?: string; profilePicture?: string; topInterests?: string; dailyLife?: string; major?: string } = {};
      if (body.bio !== undefined) {
        if (body.bio.length > PROFILE_BIO_MAX_LENGTH) {
          return res.status(400).json({
            error: `Bio must be at most ${PROFILE_BIO_MAX_LENGTH} characters.`,
          });
        }
        data.bio = body.bio;
      }
      if (body.profilePicture !== undefined) data.profilePicture = body.profilePicture;
      if (body.topInterests !== undefined) data.topInterests = body.topInterests;
      if (body.dailyLife !== undefined) data.dailyLife = body.dailyLife;
      if (body.major !== undefined) data.major = body.major;

      const existing = await prisma.userProfiles.findUnique({ where: { userEmail: email } });
      const mergedTop = body.topInterests !== undefined ? body.topInterests : existing?.topInterests ?? null;
      const mergedDaily = body.dailyLife !== undefined ? body.dailyLife : existing?.dailyLife ?? null;

      const topItems = parsePublicProfileList(mergedTop);
      const dailyItems = parsePublicProfileList(mergedDaily);
      const topErr = publicProfileListFieldError(topItems, 'Top interests');
      if (topErr) return res.status(400).json({ error: topErr });
      const dailyErr = publicProfileListFieldError(dailyItems, 'Daily activities');
      if (dailyErr) return res.status(400).json({ error: dailyErr });

      if (user.profileSetupComplete) {
        const petCount = await prisma.petPeeves.count({ where: { userEmail: email } });
        if (petCount < MIN_PUBLIC_PROFILE_LIST_ITEMS) {
          return res.status(400).json({
            error: `Roommate pet peeves must have at least ${MIN_PUBLIC_PROFILE_LIST_ITEMS} items.`,
          });
        }
        if (petCount > MAX_PUBLIC_PROFILE_LIST_ITEMS) {
          return res.status(400).json({
            error: `Roommate pet peeves must have at most ${MAX_PUBLIC_PROFILE_LIST_ITEMS} items.`,
          });
        }
        const peeves = await prisma.petPeeves.findMany({
          where: { userEmail: email },
          select: { petPeeve: true },
        });
        for (const row of peeves) {
          if (row.petPeeve.length > OPEN_TEXT_MAX_LENGTH) {
            return res.status(400).json({
              error: `Each roommate pet peeve must be at most ${OPEN_TEXT_MAX_LENGTH} characters.`,
            });
          }
        }
      }

      const profile = await prisma.userProfiles.upsert({
        where: { userEmail: email },
        create: { userEmail: email, ...data },
        update: data,
      });
      return res.status(200).json(profile);
    } catch (e) {
      console.error('profiles PATCH error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
