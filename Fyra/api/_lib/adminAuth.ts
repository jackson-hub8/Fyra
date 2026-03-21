import type { VercelRequest } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from './jwtAdmin';

const prisma = new PrismaClient();

export type { AdminJwtPayload } from './jwtAdmin';
export { verifyAdminToken } from './jwtAdmin';

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
