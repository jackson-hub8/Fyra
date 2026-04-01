/** Minimum entries for each public list field (top interests, daily life, roommate pet peeves). */
export const MIN_PUBLIC_PROFILE_LIST_ITEMS = 3;

/** Maximum entries the user may add in each of those sections. */
export const MAX_PUBLIC_PROFILE_LIST_ITEMS = 5;

/** Same splitting as stored profile fields (ProfileCard, API). */
export function parsePublicProfileList(value: string | null | undefined): string[] {
  return (value ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}
