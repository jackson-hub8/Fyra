/** Profile photo upload rules (keep in sync with `api/profiles/photo.ts`). */

export const ALLOWED_PROFILE_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const MAX_PROFILE_PHOTO_BYTES = 4 * 1024 * 1024;

const allowedSet = new Set<string>(ALLOWED_PROFILE_PHOTO_TYPES);

/**
 * HEIC/HEIF from Apple devices sometimes arrive with empty MIME or `application/octet-stream`.
 */
export function isAllowedProfilePhotoFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t && allowedSet.has(t)) return true;
  const name = file.name.toLowerCase();
  if ((!t || t === 'application/octet-stream') && (name.endsWith('.heic') || name.endsWith('.heif'))) {
    return true;
  }
  return false;
}

/** Content-Type to send to `/api/profiles/photo` (required for server validation). */
export function profilePhotoContentTypeForUpload(file: File): string {
  const t = file.type.toLowerCase();
  if (t && t !== 'application/octet-stream' && allowedSet.has(t)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.heic')) return 'image/heic';
  if (name.endsWith('.heif')) return 'image/heif';
  return file.type || 'application/octet-stream';
}
