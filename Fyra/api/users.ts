/// file: users.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// API endpoint for user management operations

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      console.log('Received request:', { email, hasPassword: !!password, firstName, lastName });

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if this is a signup request (has firstName and lastName)
      // Use explicit check for signup vs login
      const isSignup = firstName !== undefined && lastName !== undefined && firstName !== '' && lastName !== '';
      
      console.log('Is signup?', isSignup);
      
      if (isSignup) {
        // Signup flow
        const normalizedEmail = email.toLowerCase();

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash the password
        const passwordHash = await argon2.hash(password);

        // Create the user
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

          // Return success response
          return res.status(201).json({
            email: newUser.email,
            name: newUser.name,
            isMatched: newUser.isMatched,
          });
        } catch (dbError: any) {
          console.error('Database error during signup:', dbError);
          // Handle unique constraint violation (duplicate email)
          if (dbError.code === 'P2002') {
            return res.status(400).json({ error: 'User with this email already exists' });
          }
          throw dbError;
        }
      } else {
        // Login flow
        const user = await prisma.users.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isValidPassword = await argon2.verify(user.passwordHash, password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Return user info including isMatched and profileSetupComplete
        return res.status(200).json({
          email: user.email,
          name: user.name,
          isMatched: user.isMatched,
          profileSetupComplete: user.profileSetupComplete,
        });
      }
    } catch (error: any) {
      console.error('User operation error:', error);
      const errorMessage = error?.message || 'Internal server error';
      return res.status(500).json({ error: errorMessage });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
