/// file: profiles.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// API for user profile (display): bio, photo, topInterests, dailyLife. GET by user, PATCH update.

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
      if (body.bio !== undefined) data.bio = body.bio;
      if (body.profilePicture !== undefined) data.profilePicture = body.profilePicture;
      if (body.topInterests !== undefined) data.topInterests = body.topInterests;
      if (body.dailyLife !== undefined) data.dailyLife = body.dailyLife;
      if (body.major !== undefined) data.major = body.major;

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
