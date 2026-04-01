/// Short free-text fields (bio, list items, calendar, chores, questionnaire typing).
/// Keep in sync with `api/lib/textFieldLimits.ts`.

export const OPEN_TEXT_MAX_LENGTH = 25;
/** Bio uses the same cap as other short profile text. */
export const PROFILE_BIO_MAX_LENGTH = OPEN_TEXT_MAX_LENGTH;
