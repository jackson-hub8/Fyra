/** Levenshtein edit distance on Unicode code points (sufficient for names). */

/** Fraction of the longer normalized string length used as a soft cap (typo tolerance). */
const NAME_SEARCH_DISTANCE_RATIO = 0.42;
/** Never require more than this many edits to count as a match (avoids filling slots with unrelated names). */
const NAME_SEARCH_DISTANCE_ABS_CAP = 12;
/** Minimum allowed distance so short names still allow a couple of typos. */
const NAME_SEARCH_DISTANCE_MIN = 2;

/**
 * Max edit distance for a name to appear in student search results. Scales with the
 * longer of query vs full name so short queries stay strict and longer names allow more typos.
 * Results are still capped at 5 after filtering; there may be 0–5 rows.
 */
export function maxAllowedLevenshteinForNameSearch(queryLen: number, targetLen: number): number {
  const longer = Math.max(1, queryLen, targetLen);
  const scaled = Math.ceil(longer * NAME_SEARCH_DISTANCE_RATIO);
  return Math.min(NAME_SEARCH_DISTANCE_ABS_CAP, Math.max(NAME_SEARCH_DISTANCE_MIN, scaled));
}

export function normalizeForSearch(s: string): string {
  return s.trim().toLowerCase();
}

export function levenshtein(a: string, b: string): number {
  const s = normalizeForSearch(a);
  const t = normalizeForSearch(b);
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const m = s.length;
  const n = t.length;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = row[j];
      const cost = s.charCodeAt(i - 1) === t.charCodeAt(j - 1) ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[n];
}
