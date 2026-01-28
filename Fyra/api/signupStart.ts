/// file: signupStart.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// send 6-digit verification email.
/// User is not created in Users until they verify

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
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
    const { firstName, lastName, email, password } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'First name, last name, email, and password are required' });
    }

    const emailLower = email.trim().toLowerCase();

    // Basic email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Reject if user already exists
    const existing = await prisma.users.findUnique({ where: { email: emailLower } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Check email config before creating pending (we never create in Users here; only signupVerify does)
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email is not configured. Set EMAIL_USER and EMAIL_PASS.' });
    }

    const passwordHash = await argon2.hash(password);
    const verificationCode = String(randomInt(100_000, 1_000_000));
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert: replace any existing pending signup for this email
    await prisma.pendingSignups.upsert({
      where: { email: emailLower },
      create: {
        email: emailLower,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        verificationCode,
        codeExpiresAt,
      },
      update: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        verificationCode,
        codeExpiresAt,
      },
    });

    // Send email; if it fails, remove the pending we just created so the user can retry cleanly
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    try {
      await transporter.sendMail({
        from: emailUser,
        to: emailLower,
        subject: 'Your FYRA verification code',
        html: `<p>Your verification code is: </p> 
               <p><strong>${verificationCode}</strong></p>
               <p>It expires in 10 minutes.</p>`,
      });
    } catch (mailErr) {
      await prisma.pendingSignups.delete({ where: { email: emailLower } }).catch(() => {});
      throw mailErr;
    }

    return res.status(200).json({ success: true });
  } catch (e: unknown) {
    console.error('signupStart error:', e);
    const msg = e instanceof Error ? e.message : 'Internal server error';
    return res.status(500).json({ error: msg });
  }
}
