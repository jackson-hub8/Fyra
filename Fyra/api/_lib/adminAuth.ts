import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-in-production';
const JWT_EXPIRES = '7d';

export interface AdminJwtPayload {
  email: string;
  isAdmin: true;
}

export function signAdminToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  return jwt.sign({ email: normalized, isAdmin: true }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    if (!decoded?.email || decoded.isAdmin !== true) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Bearer token from Authorization header. */
export function getBearerToken(req: VercelRequest): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7).trim() || null;
}

/**
 * Returns admin user email if JWT valid and user exists with isAdmin.
 */
export async function requireAdmin(req: VercelRequest): Promise<{ email: string } | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload) return null;
  const user = await prisma.users.findUnique({
    where: { email: payload.email },
    select: { email: true, isAdmin: true },
  });
  if (!user?.isAdmin) return null;
  return { email: user.email };
}
