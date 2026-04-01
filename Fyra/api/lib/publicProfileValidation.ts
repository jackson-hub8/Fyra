import { OPEN_TEXT_MAX_LENGTH } from './textFieldLimits.js';

/** Keep in sync with `src/lib/publicProfileLists.ts`. */
export const MIN_PUBLIC_PROFILE_LIST_ITEMS = 3;
export const MAX_PUBLIC_PROFILE_LIST_ITEMS = 5;

export function parsePublicProfileList(value: string | null | undefined): string[] {
  return (value ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}

/** Returns an error message if the parsed list violates min/max count or per-item length. */
export function publicProfileListFieldError(items: string[], displayName: string): string | null {
  if (items.length < MIN_PUBLIC_PROFILE_LIST_ITEMS) {
    return `${displayName} must have at least ${MIN_PUBLIC_PROFILE_LIST_ITEMS} items.`;
  }
  if (items.length > MAX_PUBLIC_PROFILE_LIST_ITEMS) {
    return `${displayName} must have at most ${MAX_PUBLIC_PROFILE_LIST_ITEMS} items.`;
  }
  for (const item of items) {
    if (item.length > OPEN_TEXT_MAX_LENGTH) {
      return `Each ${displayName} item must be at most ${OPEN_TEXT_MAX_LENGTH} characters.`;
    }
  }
  return null;
}
