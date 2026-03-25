/** Keep in sync with `src/lib/publicProfileLists.ts`. */
export const MIN_PUBLIC_PROFILE_LIST_ITEMS = 3;

export function parsePublicProfileList(value: string | null | undefined): string[] {
  return (value ?? '').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}
