/// file: profileSetupComplete.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Mark user's profile setup as complete (after questionnaire + build profile).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

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
    const user = await prisma.users.updateMany({
      where: { email },
      data: { profileSetupComplete: true },
    });
    if (user.count === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('profileSetupComplete error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
