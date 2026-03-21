/**
 * Admin JWT sign/verify only (no Prisma). Used by login + adminAuth.
 */
import jwt from 'jsonwebtoken';

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
