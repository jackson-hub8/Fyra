/**
 * Roommate similarity + smoke blocking. Used by swipe, deck, and admin APIs.
 * Field list aligns with docs/matching-admin-spec.md §4.1.
 */

import type { PrivateQuestionnaire } from '@prisma/client';

export const ALLERGIES_DELIMITER = ' | ';
export const SPORTS_DELIMITER = ' | ';
export const CHECKLIST_DELIMITER = ' | ';
export const SMOKE_ALLERGY_VALUE = 'Smoke (cigarette or cannabis)';

/** Keys included in equal-weight similarity (page 1 only varsitySport + pages 2–end). */
export const ALGORITHM_FIELD_KEYS = [
  'varsitySport',
  'smoking',
  'cannabis',
  'alcohol',
  'roomTemp',
  'bedroomDescription',
  'sleepType',
  'weekdayBedtime',
  'freeTime',
  'campusActivity',
  'visitorFrequency',
  'weekendHomeFrequency',
  'firstClassTime',
  'musicPreference',
  'politicalViews',
  'religion',
  'studyEnvironment',
  'intendedMajor',
  'vehicleToCampus',
] as const;

export type AlgorithmFieldKey = (typeof ALGORITHM_FIELD_KEYS)[number];

export function canonicalPair(emailA: string, emailB: string): [string, string] {
  const a = emailA.trim().toLowerCase();
  const b = emailB.trim().toLowerCase();
  return a < b ? [a, b] : [b, a];
}

export function normalizeToken(s: string): string {
  return s.trim().toLowerCase();
}

export function parseAllergyTokens(animalAllergies: string | null | undefined): Set<string> {
  const out = new Set<string>();
  if (!animalAllergies?.trim()) return out;
  for (const p of animalAllergies.split(ALLERGIES_DELIMITER)) {
    const t = p.trim();
    if (t) out.add(t);
  }
  return out;
}

export function hasSmokeAllergy(animalAllergies: string | null | undefined): boolean {
  return parseAllergyTokens(animalAllergies).has(SMOKE_ALLERGY_VALUE);
}

export function isNicotineOrCannabisSmoker(q: Pick<PrivateQuestionnaire, 'smoking' | 'cannabis'>): boolean {
  return q.smoking === 'Smoker' || q.cannabis === 'Smoker';
}

/** True when sex assigned at birth is Male vs Female (housing policy: no mixed-sex pairing). */
export function isOppositeBinarySexPair(
  sexA: string | null | undefined,
  sexB: string | null | undefined,
): boolean {
  const a = sexA?.trim() ?? '';
  const b = sexB?.trim() ?? '';
  if (!a || !b) return false;
  return (a === 'Male' && b === 'Female') || (a === 'Female' && b === 'Male');
}

/** True if these two must not be paired (deck, search, swipe sync); symmetric. */
export function isPairBlocked(
  qA: Pick<
    PrivateQuestionnaire,
    'animalAllergies' | 'smoking' | 'cannabis' | 'sexAssignedAtBirth'
  >,
  qB: Pick<
    PrivateQuestionnaire,
    'animalAllergies' | 'smoking' | 'cannabis' | 'sexAssignedAtBirth'
  >,
): boolean {
  if (isOppositeBinarySexPair(qA.sexAssignedAtBirth, qB.sexAssignedAtBirth)) return true;
  return (
    (hasSmokeAllergy(qA.animalAllergies) && isNicotineOrCannabisSmoker(qB)) ||
    (hasSmokeAllergy(qB.animalAllergies) && isNicotineOrCannabisSmoker(qA))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function parseSportsSet(raw: string | null | undefined): Set<string> {
  const s = new Set<string>();
  if (!raw?.trim()) return s;
  for (const p of raw.split(SPORTS_DELIMITER)) {
    const t = p.trim();
    if (t) s.add(t);
  }
  return s;
}

function parseTagsSet(raw: string | null | undefined): Set<string> {
  const s = new Set<string>();
  if (!raw?.trim()) return s;
  for (const p of raw.split(',')) {
    const t = normalizeToken(p);
    if (t) s.add(t);
  }
  return s;
}

function parseChecklistSet(raw: string | null | undefined): Set<string> {
  const s = new Set<string>();
  if (!raw?.trim()) return s;
  for (const p of raw.split(CHECKLIST_DELIMITER)) {
    const t = p.trim();
    if (t) s.add(t);
  }
  return s;
}

function ordinalSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
  order: readonly string[],
): number {
  if (!a?.trim() || !b?.trim()) return 0;
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia < 0 || ib < 0) return a === b ? 1 : 0;
  const maxD = order.length - 1;
  if (maxD <= 0) return ia === ib ? 1 : 0;
  return 1 - Math.abs(ia - ib) / maxD;
}

const ALCOHOL_ORDER = ['Never drink', 'Occasionally', 'Social drinker', 'Prefer not to say'] as const;
const ROOM_TEMP_ORDER = ['Cool', 'Moderate', 'Warm'] as const;
const BEDROOM_ORDER = ['Messy', 'Disorganized but not messy', 'Organized', 'Very organized'] as const;
/** Semantic order: early → middle → late. */
const SLEEP_TYPE_ORDER = ['Early Bird', 'Somewhere in between', 'Night Owl'] as const;
const CAMPUS_ACTIVITY_ORDER = ['Not very active', 'Somewhat active', 'Moderately active', 'Very active'] as const;
const VISITOR_ORDER = ['Rarely', 'Sometimes', 'Often', 'Very often'] as const;
const WEEKEND_HOME_ORDER = ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost every weekend'] as const;
const FIRST_CLASS_ORDER = ['8am–9am', '9am–10am', '10am–11am', '11am or later'] as const;
const POLITICAL_ORDER = [
  'Very liberal',
  'Liberal',
  'Moderate',
  'Conservative',
  'Very conservative',
  'Prefer not to say',
] as const;
const RELIGION_ORDER = [
  'Very religious',
  'Somewhat religious',
  'Not particularly religious',
  'Not religious',
  'Prefer not to say',
] as const;

/** Weekday bedtime: circular order (late evening → after midnight → early). */
const BEDTIME_CIRCLE = [
  'Before 10pm',
  '10pm–11pm',
  '11pm–12am',
  '12am–1am',
  'After 1am',
] as const;

function circularSimilarity(
  a: string | null | undefined,
  b: string | null | undefined,
  circle: readonly string[],
): number {
  if (!a?.trim() || !b?.trim()) return 0;
  const ia = circle.indexOf(a);
  const ib = circle.indexOf(b);
  if (ia < 0 || ib < 0) return a === b ? 1 : 0;
  const n = circle.length;
  const d = Math.abs(ia - ib);
  const wrap = Math.min(d, n - d);
  const maxWrap = Math.floor(n / 2);
  return maxWrap === 0 ? (ia === ib ? 1 : 0) : 1 - wrap / maxWrap;
}

function musicSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  if (!a?.trim() || !b?.trim()) return 0;
  const na = normalizeToken(a.startsWith('Other:') ? a.slice(6).trim() : a);
  const nb = normalizeToken(b.startsWith('Other:') ? b.slice(6).trim() : b);
  if (a.startsWith('Other:') && b.startsWith('Other:')) return na === nb ? 1 : 0;
  return normalizeToken(a) === normalizeToken(b) ? 1 : 0;
}

function studyEnvSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  return a && b && a === b ? 1 : 0;
}

/**
 * Mean of per-field similarities in [0,1]. Missing both sides for a field → skip field.
 */
export function computeSimilarityScore(a: PrivateQuestionnaire, b: PrivateQuestionnaire): number {
  const scores: number[] = [];

  const add = (v: number) => scores.push(v);

  add(jaccardSimilarity(parseSportsSet(a.varsitySport), parseSportsSet(b.varsitySport)));
  add(a.smoking === b.smoking ? 1 : 0);
  add(a.cannabis === b.cannabis ? 1 : 0);
  add(ordinalSimilarity(a.alcohol, b.alcohol, ALCOHOL_ORDER));
  add(ordinalSimilarity(a.roomTemp, b.roomTemp, ROOM_TEMP_ORDER));
  add(ordinalSimilarity(a.bedroomDescription, b.bedroomDescription, BEDROOM_ORDER));
  add(ordinalSimilarity(a.sleepType, b.sleepType, SLEEP_TYPE_ORDER));
  add(circularSimilarity(a.weekdayBedtime, b.weekdayBedtime, BEDTIME_CIRCLE));
  add(jaccardSimilarity(parseTagsSet(a.freeTime), parseTagsSet(b.freeTime)));
  add(ordinalSimilarity(a.campusActivity, b.campusActivity, CAMPUS_ACTIVITY_ORDER));
  add(ordinalSimilarity(a.visitorFrequency, b.visitorFrequency, VISITOR_ORDER));
  add(ordinalSimilarity(a.weekendHomeFrequency, b.weekendHomeFrequency, WEEKEND_HOME_ORDER));
  add(ordinalSimilarity(a.firstClassTime, b.firstClassTime, FIRST_CLASS_ORDER));
  add(musicSimilarity(a.musicPreference, b.musicPreference));
  add(ordinalSimilarity(a.politicalViews, b.politicalViews, POLITICAL_ORDER));
  add(ordinalSimilarity(a.religion, b.religion, RELIGION_ORDER));
  add(studyEnvSimilarity(a.studyEnvironment, b.studyEnvironment));
  add(jaccardSimilarity(parseChecklistSet(a.intendedMajor), parseChecklistSet(b.intendedMajor)));
  add(a.vehicleToCampus === b.vehicleToCampus ? 1 : 0);

  if (scores.length === 0) return 0;
  return scores.reduce((s, x) => s + x, 0) / scores.length;
}
