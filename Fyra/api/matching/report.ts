/// POST: submit a profile report from the matching deck.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REPORT_REASON_MAX_LENGTH = 50;

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

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
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseJsonBody(req);
  const reporterEmail = typeof body.reporterEmail === 'string' ? body.reporterEmail.trim().toLowerCase() : '';
  const reportedEmail = typeof body.reportedEmail === 'string' ? body.reportedEmail.trim().toLowerCase() : '';
  const reasonRaw = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!reporterEmail || !reportedEmail) {
    return res.status(400).json({ error: 'reporterEmail and reportedEmail are required' });
  }
  if (reporterEmail === reportedEmail) {
    return res.status(400).json({ error: 'Cannot report yourself' });
  }
  if (reasonRaw.length === 0 || reasonRaw.length > REPORT_REASON_MAX_LENGTH) {
    return res.status(400).json({
      error: `Reason must be between 1 and ${REPORT_REASON_MAX_LENGTH} characters`,
    });
  }

  try {
    const [reporter, reported] = await Promise.all([
      prisma.users.findUnique({
        where: { email: reporterEmail },
        select: { isMatched: true, isActive: true, isAdmin: true },
      }),
      prisma.users.findUnique({
        where: { email: reportedEmail },
        select: { isMatched: true, isActive: true, isAdmin: true },
      }),
    ]);

    if (!reporter) return res.status(404).json({ error: 'Reporter not found' });
    if (!reported) return res.status(404).json({ error: 'Reported user not found' });
    if (reporter.isAdmin || reported.isAdmin) {
      return res.status(403).json({ error: 'Cannot report admin accounts' });
    }
    if (!reporter.isActive || !reported.isActive) {
      return res.status(400).json({ error: 'Reporting is not available for inactive users' });
    }
    if (reporter.isMatched || reported.isMatched) {
      return res.status(400).json({ error: 'Reporting is only available for unmatched users' });
    }

    await prisma.profileReport.create({
      data: {
        reporterEmail,
        reportedEmail,
        reason: reasonRaw,
      },
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('matching report POST error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
