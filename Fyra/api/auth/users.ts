/// File: users.ts
/// Jackson Hurley, Kaitlyn Maes, Cameron Horine
/// API endpoint for user management operations
/// Ref 1: https://vercel.com/kb/guide/how-to-enable-cors

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2'; // For password hashing and salting.
// jwtAdmin is dynamically imported only when user.isAdmin — student logins never load it.

const prisma = new PrismaClient();

/** Vercel may deliver JSON as object or string; undefined body must not throw on destructure. */
function parseJsonBody(req: VercelRequest): Record<string, unknown> {
  const raw = req.body as unknown;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers to allow requests from all origins. (Ref 1). 
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only handles POST (signup or login); other methods get 405 below.
  if (req.method === 'POST') {
    try {
      const body = parseJsonBody(req);
      const email = typeof body.email === 'string' ? body.email : undefined;
      const password = typeof body.password === 'string' ? body.password : undefined;
      const firstName = typeof body.firstName === 'string' ? body.firstName : undefined;
      const lastName = typeof body.lastName === 'string' ? body.lastName : undefined;
      
      console.log('Received request:', { email, hasPassword: !!password, firstName, lastName });

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Signup vs. login: signup includes non-empty firstName and lastName. 
      const isSignup = firstName !== undefined && lastName !== undefined && firstName !== '' && lastName !== '';
      
      console.log('Is signup?', isSignup);
      
      if (isSignup) {
        // Signup flow.  
        const normalizedEmail = email.toLowerCase();

        // Reject if an account already exists with this email. 
        const existingUser = await prisma.users.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' }); // Reject new user.
        }

        // Hash and salt password. 
        const passwordHash = await argon2.hash(password);

        // Create the new user. 
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        
        try {
          const newUser = await prisma.users.create({
            data: {
              email: normalizedEmail,
              name: fullName,
              passwordHash: passwordHash,
              isMatched: false,
              isActive: true,
              emailVerified: false,
            },
          });

          // Return success response. 
          return res.status(201).json({
            email: newUser.email,
            name: newUser.name,
            isMatched: newUser.isMatched,
          });
        } catch (dbError: any) {
          console.error('Database error during signup:', dbError);
          // Handle unique constraint violation (duplicate email). 
          if (dbError.code === 'P2002') {
            return res.status(400).json({ error: 'User with this email already exists' });
          }
          throw dbError;
        }
      } else {
        // Login flow.
        const user = await prisma.users.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify that the password hashes match. 
        const isValidPassword = await argon2.verify(user.passwordHash, password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.isAdmin && !user.isActive) {
          return res.status(403).json({ error: 'Account suspended.' });
        }

        const isAdmin = user.isAdmin;
        if (isAdmin) {
          const { signAdminToken } = await import('./jwtAdmin.js');
          return res.status(200).json({
            email: user.email,
            name: user.name,
            isMatched: user.isMatched,
            profileSetupComplete: user.profileSetupComplete,
            isAdmin: true,
            adminToken: signAdminToken(user.email),
          });
        }
        return res.status(200).json({
          email: user.email,
          name: user.name,
          isMatched: user.isMatched,
          profileSetupComplete: user.profileSetupComplete,
          isAdmin: false,
        });
      }
    } catch (error: any) {
      console.error('User operation error:', error);
      const errorMessage = error?.message || 'Internal server error';
      return res.status(500).json({ error: errorMessage });
    }
  }

  // Only POST is supported; GET, PATCH, etc. are met with 405 error. 
  res.status(405).json({ error: 'Method not allowed' });
}
