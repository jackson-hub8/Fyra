/// file: signupVerify.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Verify 6-digit code and create user. After this, redirect to /unmatched.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
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

  try {
    const { email, code } = req.body as { email?: string; code?: string };

    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const emailLower = email.trim().toLowerCase();
    const codeClean = String(code).trim().replace(/\D/g, '');
    if (codeClean.length !== 6) {
      return res.status(400).json({ error: 'Verification code must be 6 digits' });
    }

    const pending = await prisma.pendingSignups.findUnique({
      where: { email: emailLower },
    });

    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired code. Please sign up again.' });
    }

    if (new Date() > pending.codeExpiresAt) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    if (pending.verificationCode !== codeClean) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const name = `${pending.firstName} ${pending.lastName}`.trim() || pending.email;

    await prisma.users.create({
      data: {
        email: emailLower,
        name,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        isMatched: false,
      },
    });

    await prisma.pendingSignups.delete({ where: { email: emailLower } });

    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    console.error('signupVerify error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}
