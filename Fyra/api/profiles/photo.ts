/// File: photo.ts
/// Profile photo: upload (POST) and delete (DELETE). Uses Vercel Blob + user_profile_photos + user_profiles.profilePicture.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { put, del } from '@vercel/blob';

const prisma = new PrismaClient();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 4 * 1024 * 1024; // 4MB (Vercel body limit 4.5MB; leave room for JSON)

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

function getEmail(req: VercelRequest): string | null {
  const q = (req.query.email as string)?.trim()?.toLowerCase();
  const body = req.body as { email?: string } | undefined;
  const b = body?.email?.trim()?.toLowerCase();
  return q || b || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const email = getEmail(req);
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Ownership: ensure user exists (auth is client-provided email; no server session)
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'POST') {
    const body = req.body as { email?: string; photo?: string; contentType?: string };
    const base64 = body?.photo;
    const contentType = (body?.contentType ?? '').trim();

    if (typeof base64 !== 'string' || !base64) {
      return res.status(400).json({ error: 'Invalid file: photo (base64) required' });
    }
    if (!ALLOWED_TYPES.includes(contentType as (typeof ALLOWED_TYPES)[number])) {
      return res.status(400).json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' });
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      return res.status(400).json({ error: 'Invalid photo data' });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'File too large. Max 4MB.' });
    }
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty file' });
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const pathname = `profile-photos/${encodeURIComponent(email)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType,
      });

      const existing = await prisma.userProfilePhotos.findUnique({
        where: { userEmail: email },
      });
      if (existing?.blobPathname) {
        try {
          await del(existing.blobPathname);
        } catch (e) {
          console.error('Blob delete (replace) failed:', e);
        }
      }

      await prisma.$transaction([
        prisma.userProfilePhotos.upsert({
          where: { userEmail: email },
          create: {
            userEmail: email,
            blobUrl: blob.url,
            blobPathname: blob.pathname,
            contentType,
            sizeBytes: buffer.length,
          },
          update: {
            blobUrl: blob.url,
            blobPathname: blob.pathname,
            contentType,
            sizeBytes: buffer.length,
          },
        }),
        prisma.userProfiles.upsert({
          where: { userEmail: email },
          create: { userEmail: email, profilePicture: blob.url },
          update: { profilePicture: blob.url },
        }),
      ]);

      return res.status(200).json({ photoUrl: blob.url });
    } catch (e) {
      console.error('Profile photo upload error:', e);
      return res.status(500).json({ error: 'Upload failed' });
    }
  }

  if (req.method === 'DELETE') {
    const existing = await prisma.userProfilePhotos.findUnique({
      where: { userEmail: email },
    });
    if (existing?.blobPathname) {
      try {
        await del(existing.blobPathname);
      } catch (e) {
        console.error('Blob delete failed:', e);
      }
    }
    try {
      await prisma.userProfilePhotos.deleteMany({ where: { userEmail: email } });
      await prisma.userProfiles.update({
        where: { userEmail: email },
        data: { profilePicture: null },
      });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Profile photo delete error:', e);
      return res.status(500).json({ error: 'Delete failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
