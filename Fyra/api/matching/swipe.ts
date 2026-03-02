/// File: swipe.ts
/// POST: record a swipe (like or pass). Adds like to possible matches for admin later.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as { swiperEmail?: string; targetEmail?: string; action?: string };
  const swiperEmail = (body.swiperEmail as string)?.trim()?.toLowerCase();
  const targetEmail = (body.targetEmail as string)?.trim()?.toLowerCase();
  const action = (body.action as string)?.trim()?.toLowerCase();

  if (!swiperEmail || !targetEmail || !action) {
    return res.status(400).json({ error: 'swiperEmail, targetEmail, and action are required' });
  }
  if (action !== 'like' && action !== 'pass') {
    return res.status(400).json({ error: 'action must be "like" or "pass"' });
  }
  if (swiperEmail === targetEmail) {
    return res.status(400).json({ error: 'Cannot swipe on yourself' });
  }

  try {
    const [swiper, target] = await Promise.all([
      prisma.users.findUnique({ where: { email: swiperEmail }, select: { isMatched: true } }),
      prisma.users.findUnique({ where: { email: targetEmail }, select: { isMatched: true } }),
    ]);
    if (!swiper) return res.status(404).json({ error: 'Swiper user not found' });
    if (!target) return res.status(404).json({ error: 'Target user not found' });
    if (swiper.isMatched) return res.status(403).json({ error: 'You are already matched' });
    if (target.isMatched) return res.status(400).json({ error: 'That user is already matched' });

    await prisma.swipeActions.upsert({
      where: {
        swiperEmail_targetEmail: { swiperEmail, targetEmail },
      },
      create: { swiperEmail, targetEmail, action },
      update: { action },
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('swipe POST error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
