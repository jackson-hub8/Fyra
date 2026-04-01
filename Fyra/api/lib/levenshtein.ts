/** Levenshtein edit distance on Unicode code points (sufficient for names). */

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
