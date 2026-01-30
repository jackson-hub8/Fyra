/// file: signupComplete.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Finalize signup after terms & conditions decision.
/// - If accept: create user from PendingSignups, then delete PendingSignups row.
/// - If decline: delete PendingSignups row only.

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, accept } = req.body as { email?: string; accept?: boolean };

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'Accept flag is required' });
    }

    const emailLower = email.trim().toLowerCase();

    const pending = await prisma.pendingSignups.findUnique({
      where: { email: emailLower },
    });

    if (!pending) {
      return res.status(400).json({ error: 'Signup session has expired. Please sign up again.' });
    }

    if (new Date() > pending.codeExpiresAt) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    if (!accept) {
      // User declined terms: do not create a user, just clean up pending signup.
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(200).json({ success: true, declined: true });
    }

    // If they already have an account, treat this as already completed.
    const existingUser = await prisma.users.findUnique({
      where: { email: emailLower },
    });
    if (existingUser) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(200).json({ success: true, alreadyExists: true, name: existingUser.name, email: existingUser.email });
    }

    const name = `${pending.firstName} ${pending.lastName}`.trim() || pending.email;

    const user = await prisma.users.create({
      data: {
        email: emailLower,
        name,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        isMatched: false,
      },
    });

    await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});

    return res.status(200).json({ success: true, name: user.name, email: user.email });
  } catch (e: unknown) {
    console.error('signupComplete error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}

