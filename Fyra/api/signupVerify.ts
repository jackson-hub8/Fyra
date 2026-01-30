/// File: signupVerify.ts
/// Jackson Hurley, Kaitlyn Maes, Cameron Horine
/// Verify 6-digit code and create user
/// Ref 1: https://vercel.com/kb/guide/how-to-enable-cors

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set CORS headers to allow requests from all origins. (Ref 1). 
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
}

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
    const body = req.body as Record<string, unknown>;
    // Reject signups that were misrouted here (we only accept email and the code). 
    if (body && ('password' in body || 'firstName' in body)) {
      return res.status(400).json({ error: 'Invalid request. Use the verification step.' });
    }

    const { email, code } = req.body as { email?: string; code?: string };

    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const emailLower = email.trim().toLowerCase();
    // Strip non-digits; "123 456" or "123-456" work, for example. 
    const codeClean = String(code).trim().replace(/\D/g, '');
    if (codeClean.length !== 6) {
      return res.status(400).json({ error: 'Verification code must be 6 digits' });
    }

    // Load the pending signup created in signupStart (or updated by signupResent). 
    const pending = await prisma.pendingSignups.findUnique({
      where: { email: emailLower },
    });

    // No pending row: session expired or already completed, make the user start over. 
    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired code. Please sign up again.' });
    }

    // If code is past its lifetime do not accept it. 
    if (new Date() > pending.codeExpiresAt) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    // Compare submitted verification code to the one that was stored. 
    if (pending.verificationCode !== codeClean) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Code was valid; user can proceed to signupComplete. 
    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    console.error('signupVerify error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}
