/// File: signupResend.ts
/// Jackson Hurley, Kaitlyn Maes, Cameron Horine
/// Resend 6-digit verification code to the email for a pending signup.
/// Ref 1: https://vercel.com/kb/guide/how-to-enable-cors

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer'; // To send the verification code email. 
import { randomInt } from 'crypto'; // To generate a random 6-digit code.

const prisma = new PrismaClient();

// Set CORS headers to allow requests from all origins. (Ref 1). 
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
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
    // Expect JSON body with email (the address that requested signup). 
    const { email } = req.body as { email?: string };

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.trim().toLowerCase();
    // Load pending signup so that we can resend a code iff one exists and is still valid. 
    const pending = await prisma.pendingSignups.findUnique({
      where: { email: emailLower },
    });

    // No pending row; user needs to restart signup, not resend a code. 
    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired. Please sign up again.' });
    }

    // If prev. code is expired, remove pending and tell the user to restart signup. 
    if (new Date() > pending.codeExpiresAt) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    // Gen. a new 6-digit code and set expiration 10 minutes from now. 
    const verificationCode = String(randomInt(100_000, 1_000_000));
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store new code and expiration so signupVerify can validate it. 
    await prisma.pendingSignups.update({
      where: { email: emailLower },
      data: { verificationCode, codeExpiresAt },
    });

    // SMTP credentials MUST be set in the env for sending mail. 
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email is not configured. Set EMAIL_USER and EMAIL_PASS.' });
    }

    // Use Gmail and env credentials to send the verification email. 
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    // Send email w/ the new code and info on when it expires. 
    await transporter.sendMail({
      from: emailUser,
      to: emailLower,
      subject: 'Your FYRA verification code',
      html: `<p>Your verification code is: </p> 
               <p><strong>${verificationCode}</strong></p>
               <p>It expires in 10 minutes.</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    console.error('signupResend error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}