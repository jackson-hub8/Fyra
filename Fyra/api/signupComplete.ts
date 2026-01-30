/// File: signupComplete.ts
/// Jackson Hurley, Kaitlyn Maes, Cameron Horine
/// Finalize signup after terms and conditions decision.
/// - If accept: create user from PendingSignups, then delete PendingSignups row.
/// - If decline: delete PendingSignups row only.
/// Ref 1: https://vercel.com/kb/guide/how-to-enable-cors

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set CORS headers to allow requests from all origins. (Ref 1). 
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

// Handle signup completion requests. 
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  // Handle CORS preflight requests. 
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // Only accept POST requests; otherwise return "405 Method Not Allowed". 
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Expect JSON body with email and accept terms. 
    const { email, accept } = req.body as { email?: string; accept?: boolean };

    // Require a non-empty email. 
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    // Accept must be a boolean value (if they accepted or declined terms). 
    if (typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'Accept flag is required' });
    }

    // Normalize email to lowercase (for case-insensitive comparison). 
    const emailLower = email.trim().toLowerCase();

    // Load the pending signup record for this email. 
    const pending = await prisma.pendingSignups.findUnique({
      where: { email: emailLower },
    });

    // If no pending signup record is found, then return 400 error with message. 
    if (!pending) {
      return res.status(400).json({ error: 'Signup session has expired. Please sign up again.' });
    }

    // Code expiration check; if code has expired, then delete the pending signup record and return 400 error with message. 
    if (new Date() > pending.codeExpiresAt) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    // If user declines terms, delete pending signup record and return 200 success response. 
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
      return res.status(200).json({ success: true, alreadyExists: true });
    }

    // Display name from signup form, or fall back to email. 
    const name = `${pending.firstName} ${pending.lastName}`.trim() || pending.email;

    // Create the verified user record in the database. 
    await prisma.users.create({
      data: {
        email: emailLower,
        name,
        passwordHash: pending.passwordHash,
        emailVerified: true,
        isMatched: false,
      },
    });

    // Delete the pending signup record (no reuse possible). 
    await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});

    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    console.error('signupComplete error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}

