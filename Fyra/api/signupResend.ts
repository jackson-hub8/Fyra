/// file: signupResend.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// Resend 6-digit verification code to the email for a pending signup.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { randomInt } from 'crypto';

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
    const { email } = req.body as { email?: string };

    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailLower = email.trim().toLowerCase();
    const pending = await prisma.pendingSignups.findUnique({
      where: { email: emailLower },
    });

    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired. Please sign up again.' });
    }

    if (new Date() > pending.codeExpiresAt) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    const verificationCode = String(randomInt(100_000, 1_000_000));
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.pendingSignups.update({
      where: { email: emailLower },
      data: { verificationCode, codeExpiresAt },
    });

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email is not configured. Set EMAIL_USER and EMAIL_PASS.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    await transporter.sendMail({
      from: emailUser,
      to: emailLower,
      subject: 'Your FYRA verification code',
      text: `Your verification code is: ${verificationCode}. It expires in 15 minutes.`,
    });

    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    console.error('signupResend error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}
