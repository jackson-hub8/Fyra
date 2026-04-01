/// POST: Create or refresh a directed match request (search flow).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { isPairBlocked } from '../lib/matching.js';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

  const body = req.body as { fromEmail?: string; toEmail?: string };
  const fromEmail = (body.fromEmail as string)?.trim()?.toLowerCase();
  const toEmail = (body.toEmail as string)?.trim()?.toLowerCase();

  if (!fromEmail || !toEmail) {
    return res.status(400).json({ error: 'fromEmail and toEmail are required' });
  }
  if (fromEmail === toEmail) {
    return res.status(400).json({ error: 'Cannot request a match with yourself' });
  }

  try {
    const [fromUser, toUser] = await Promise.all([
      prisma.users.findUnique({ where: { email: fromEmail }, select: { isMatched: true } }),
      prisma.users.findUnique({ where: { email: toEmail }, select: { isMatched: true } }),
    ]);
    if (!fromUser || !toUser) {
      return res.status(404).json({ error: 'One or both users not found' });
    }
    if (fromUser.isMatched || toUser.isMatched) {
      return res.status(400).json({ error: 'Both users must be unmatched' });
    }

    const [qFrom, qTo] = await Promise.all([
      prisma.privateQuestionnaire.findUnique({ where: { userEmail: fromEmail } }),
      prisma.privateQuestionnaire.findUnique({ where: { userEmail: toEmail } }),
    ]);
    if (qFrom && qTo && isPairBlocked(qFrom, qTo)) {
      return res.status(400).json({ error: 'This pairing is not allowed' });
    }

    await prisma.matchRequest.upsert({
      where: {
        fromEmail_toEmail: { fromEmail, toEmail },
      },
      create: { fromEmail, toEmail },
      update: {},
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('match-request:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
