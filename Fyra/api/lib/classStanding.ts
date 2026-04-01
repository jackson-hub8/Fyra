/** Allowed class standing values (must match questionnaire + search). */

export const CLASS_STANDING_VALUES = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const;

export type ClassStandingValue = (typeof CLASS_STANDING_VALUES)[number];

export function isValidClassStanding(s: string | undefined): s is ClassStandingValue {
  if (!s?.trim()) return false;
  return (CLASS_STANDING_VALUES as readonly string[]).includes(s.trim());
}
