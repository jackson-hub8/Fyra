/// File: signupStart.ts
/// Jackson Hurley, Kaitlyn Maes, Cameron Horine
/// Send 6-digit verification email.
/// User is not created in Users until they verify
/// Ref 1: https://vercel.com/kb/guide/how-to-enable-cors

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2'; // For password hashing and salting. 
import nodemailer from 'nodemailer'; // For sending verification email via SMTP.
import { randomInt } from 'crypto'; // For generating a random 6-digit code. 

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
    // Expect JSON body with signup form field info. 
    const { firstName, lastName, email, password } = req.body as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    };

    // All four fields are required and cannot be empty. 
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

    // Reject if an account already exists with this email. 
    const existing = await prisma.users.findUnique({ where: { email: emailLower } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Check email config before creating pending (we never create in Users here; only signupVerify does).
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    if (!emailUser || !emailPass) {
      return res.status(500).json({ error: 'Email is not configured. Set EMAIL_USER and EMAIL_PASS.' });
    }

    // Hash password and generate a 6 digit code that's valid for 10 minutes. 
    const passwordHash = await argon2.hash(password);
    const verificationCode = String(randomInt(100_000, 1_000_000));
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert: create or replace pending signup for this email (1 per email). 
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

    // Send verification email; if it fails, remove the pending so the user can retry. 
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