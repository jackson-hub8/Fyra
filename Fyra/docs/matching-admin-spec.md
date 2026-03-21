# Matching & Admin Oversight — Product Spec

Consolidated from design discussion. For review; implementation details TBD.

---

## 1. Purpose

- Students discover each other and express interest via the **matching** flow.
- A **similarity score** (from selected questionnaire answers) helps **admins** prioritize and review pairs; **admins** make the **final matching** decisions.
- **Hard rules** (e.g. allergies) **block** incompatible pairs regardless of score.

---

## 2. Similarity Score

### 2.1 When it is calculated

- Compute the score **when two users have both liked each other** on the **matching** page (mutual interest).
- That event should surface the pair as a **possible match** for **admin review** (score is an input to triage, not automatic assignment).

### 2.2 What it combines

- Use a **weighted Jaccard**-style (or equivalent) aggregation over **only the questions explicitly included** in the algorithm.
- **Weights:** **Equal weight** for each included question (no per-question multipliers for v1).

### 2.3 Distance / similarity by question type

| Type | Idea | Example |
|------|------|--------|
| **Circular** | Shortest distance on a circle (wraparound). | **Bedtime:** 12:00 AM is closer to **11:00 PM** than to **10:00 PM**. |
| **Ordinal** | Distance along an ordered scale. | **Room temperature:** “Cool” is closer to **moderate** than to **warm**. |
| **Other** | Use distance **where ordering or wraparound is meaningful**; use a different treatment when answers are nominal categories or sets. | (Per-question mapping in code.) |

### 2.4 Text and multi-value handling

- **Free-text / tags:** For v1, assume users enter **correct spelling**; **semantic similarity is out of scope** (defer fuzzy matching, embeddings, etc.).
- **Normalization:** **Normalize** strings before comparison (e.g. trim, case-folding; document exact rules in code). Multi-token fields (e.g. tag lists) should split on a consistent delimiter, normalize each token, then apply set similarity (Jaccard on tokens) where appropriate.
- **Required completeness:** Questionnaire flow does **not** allow skipping required questions. For **`freeTime`** only (tags-style question), require **at least three** tags before the response is valid. **No** other field uses the “≥ 3 strings” rule (e.g. `intendedMajor` is governed by its own checklist **max** rules, not this rule).

---

## 3. Hard Compatibility Rules

- **Smoke allergy (implementation must mirror the questionnaire):**
  - **Allergy side:** `animalAllergies` is stored as a **delimited string** of selected options (see `ProfileSetup` / `ALLERGIES_DELIMITER`). The smoke option is the exact option **`Smoke (cigarette or cannabis)`** from `profileQuestions.ts` (allergies checklist). Blocking logic must detect that token (after the same delimiter / normalization rules used when saving and loading the form), not a hard-coded informal phrase.
  - **Smoker side:** The private questionnaire uses **Nicotine** and **Cannabis** questions with values **`Non-smoker`** and **`Smoker`** (`smoking` and `cannabis` on `PrivateQuestionnaire`). If **either** field is **`Smoker`**, the user is treated as a smoker for the purpose of this rule.
  - **Rule:** If user A has **smoke allergy** selected as above, **A must not** be paired with user B when **`B.smoking === 'Smoker'` OR `B.cannabis === 'Smoker'`**.
- **Discovery (deck):** If a pair is **blocked** by this rule, the blocked user **must not appear** in the other user’s **swipe deck** at all (server-side filter). No admin row is required for blocked users who never became a mutual-like pair.

---

## 4. Questionnaire Scope for the Algorithm

### 4.1 Which fields feed the similarity score

- **Excluded from scoring:** All **page 1** questions **except** `varsitySport` — i.e. exclude `gender`, `sexAssignedAtBirth`, `adaAccommodations`, `animalAllergies` from the Jaccard aggregate (see `PROFILE_QUESTIONS` in `src/config/profileQuestions.ts`, first page group).
- **Included in scoring:** `varsitySport` **plus** every `PrivateQuestionnaire` field from **page 2 onward** in that config through `vehicleToCampus` (e.g. `smoking`, `cannabis`, `alcohol`, `roomTemp`, `bedroomDescription`, `sleepType`, `weekdayBedtime`, `freeTime`, `campusActivity`, `visitorFrequency`, `weekendHomeFrequency`, `firstClassTime`, `musicPreference`, `politicalViews`, `religion`, `studyEnvironment`, `intendedMajor`, `vehicleToCampus`).
- **`animalAllergies`:** Used for **blocking / deck filtering**, not for the similarity score.

### 4.2 Questionnaire UX (consistency)

- **Music — “Other”:** Selecting **Other** must show a **text field** for the user to enter a **genre**, consistent with **other** parts of the questionnaire where **Other** collects free text.
- **Music — persistence:** Store the answer in **`musicPreference`** only (no new column required unless the product later needs structured search). Use the **same convention as elsewhere** in profile setup: e.g. **`Other: <genre>`** in the single string field, matching the pattern used for allergy **Other** lines (`Other: …`) in `ProfileSetup`. Parsing/display logic for the matching card and questionnaire edit flow should follow that same pattern.

---

## 5. Student Matching Flow (swipes, mutual likes, deck)

### 5.1 Record of likes

- Keep a **durable record** of each swipe: **who** swiped, **on whom**, **like vs pass**, and timestamps per **§5.5**.

### 5.2 Pass vs like

- **Pass:** Target must **not** appear again in that swiper’s deck (already enforced by persisting a swipe row per pair).
- **Mutual like:** When the **second** user likes and the pair is **mutual**, treat as a **possible match**: **compute similarity**, **notify admin queue**, and **remove** both users from each other’s **deck** going forward (they should not see that card again).

### 5.3 No extra gating

- Nothing beyond completing the normal flow is required before mutual like creates a possible match (e.g. no extra “both completed profile” flag beyond what the app already enforces).

### 5.4 Terminology (recommended)

| Term | Meaning |
|------|--------|
| **One-way like** | User A liked User B; B has not yet swiped on A. |
| **Mutual like** | A liked B and B liked A (possible match candidate). |
| **Possible match** | Mutual like + similarity computed + row in **`PossibleMatches`** (or equivalent name), **pending** admin decision. |
| **Matched / in a room** | Admin approved; pair is finalized in **`Matches`** only; users marked matched / room assignment per product rules. |

### 5.5 Timestamps (locked)

**What admins care about for ordering (“newest first”)** is **when the mutual like completed**, not the first one-way swipe. Use:

- **`PossibleMatches.createdAt`** — set when the **second** like creates the row. **Sort admin queues by this** (descending = newest possible matches first).

**`SwipeActions` (per swiper → target):**

- **`createdAt`** — **first time** any swipe was stored for this ordered pair (like or pass). Stays **unchanged** on later upserts (Prisma default: not part of `update`).
- **`updatedAt`** — **add** this field (`@updatedAt`) so **like ↔ pass** changes update **last modification time** (useful for support/debug; optional for UI).

**Not required for v1:** A separate “first liked at” column on `SwipeActions`. Mutual-like time is authoritative on **`PossibleMatches`**.

---

## 6. Admin Matching Oversight

### 6.1 Data access

- Admins may **view all private questionnaire responses** for oversight and decision-making.

### 6.2 Authority

- Admins **manually create and review** matches and have the **final say** on who is matched (algorithm and scores **inform**; humans **decide**).

### 6.3 Admin UI — structure

Two tabs:

1. **Unmatched**
   - List **all students (users)** who are **unmatched**.
   - **Select a user** → show everyone in **`PossibleMatches`** involving that user (mutual-like pipeline), sorted **highest → lowest** by **similarity score**.

2. **Matched**
   - List **all users** who are **matched** (and effectively “in a room” with their roommate), including **who they are matched with**.

### 6.4 Admin approval outcome

- As soon as an admin **approves** a **possible match**, **insert** a row into **`Matches`** (only at this point), **delete or close** the corresponding **`PossibleMatches`** row, and set both users **matched** / **in a room** per existing app behavior (`Users.isMatched`, roommate UI, etc.).

### 6.5 Admin rejection (locked)

**What it is:** **Reject** means the admin **declines** this **possible match** — the pair is **not** approved as roommates. Remove the row from **`PossibleMatches`** (pending queue only). **Do not** create a **`Matches`** row.

**What it is not:** Rejection is **not** a block or report against a user; it only means “these two are **not** being assigned together via this pipeline.”

**Effect on students:** **Leave `SwipeActions` unchanged** (both users still have **like** on each other). The deck already excludes anyone you’ve swiped on, so **they do not see each other again** in matching unless you later add a dedicated **admin “reset swipes for this pair”** tool. They continue to see **other** unmatched students.

**Rationale:** Avoids awkward **re-collision** in the stack after housing staff already said no to that pairing; keeps behavior consistent with “mutual like removed you from each other’s decks.” If staff change their mind, they can use **manual match** flows (per §6.2) rather than expecting students to swipe again.

### 6.6 Admin experience (auth & chrome)

- **Look and feel:** Admin screens should **resemble the rest of the app** (shared visual language and patterns).
- **No admin profile:** Admins do **not** need a student-style profile or questionnaire.
- **Entry:** **Login only** → on success, land on the **admin landing page** (main admin hub, e.g. matching oversight).

---

## 7. Implementation plan (aligned with current codebase)

**Current state (snapshot):**

- `SwipeActions` stores `swiperEmail`, `targetEmail`, `action` (`like` \| `pass`), `createdAt` (`prisma/schema.prisma`).
- `POST /api/matching/swipe` upserts a swipe; **does not** yet detect mutual likes, compute score, or create admin-facing possible matches.
- `GET /api/matching/deck` returns unmatched users excluding anyone already swiped and excluding users involved in existing `Matches`; **does not** yet filter **rule-blocked** pairs or exclude **mutual-like / possible-match** pairs beyond raw swipes.

**Planned work (high level):**

1. **Schema: `PossibleMatches` (new) vs `Matches` (existing)**
   - Add a **`PossibleMatches`** table (name TBD) for **mutual likes pending admin review**: e.g. both user emails, `similarityScore`, `createdAt`, optional status. **`Matches`** remains **only** for **finalized** roommate pairs (approved, in a room). **Do not** overload `Matches` with a `pending` status for this purpose.
   - On **admin approve**: create **`Matches`** row, update user flags, **remove** the **`PossibleMatches`** row.

2. **Blocking + deck**
   - Implement `isPairBlocked(a, b)` using **questionnaire-accurate** parsing (§3): `animalAllergies` delimiter + **`Smoke (cigarette or cannabis)`** token; **`smoking` / `cannabis`** === **`Smoker`**.
   - In **deck** query, exclude any candidate `targetEmail` where `isPairBlocked(viewer, target)`.
   - Exclude targets already in **`PossibleMatches`** with viewer so mutual pending pairs don’t reappear in decks.

3. **Mutual like → possible match**
   - On successful `like` upsert, detect reciprocal like (`target` has `like` on `swiper`).
   - If mutual: compute similarity (equal-weight Jaccard-style over included fields), **normalize strings** per §2.4, **insert `PossibleMatches`** with score.
   - Ensure both users no longer see each other in deck (coordinate with swipe rows + **`PossibleMatches`** exclusion).

4. **Questionnaire validation**
   - Enforce **≥ 3** tags on **`freeTime`** only.
   - **Music Other:** UI + store **`Other: <genre>`** in **`musicPreference`** per §4.2.

5. **Similarity engine**
   - Central module: per-field similarity (ordinal / circular / set / exact string), then aggregate with **equal weights** across included keys only.
   - Map each `PrivateQuestionnaire` included field to a similarity type.

6. **Admin**
   - Auth route + **admin landing**; **unmatched** / **matched** tabs; drill-down with **possible matches** sorted by score (and optionally by **`PossibleMatches.createdAt`**); read-only **private questionnaire**; **approve** (→ `Matches` + room) or **reject** (§6.5).

7. **Swipe timestamps**
   - Add **`updatedAt`** to **`SwipeActions`** per **§5.5**. Use **`PossibleMatches.createdAt`** for admin ordering of possible matches.

---

## 8. Resolved product decisions (formerly open items)

| Topic | Decision |
|-------|----------|
| Question list + weights | Full scoring set = **page 1 only `varsitySport`** plus **all later pages** in `PROFILE_QUESTIONS`; **equal weights**. |
| Free text | Correct spelling assumed; **semantics later**; **normalize** strings for comparison. |
| **`freeTime` tags** | **≥ 3** tags required; **only** this question uses that rule. |
| Music **Other** | Store in **`musicPreference`** using the **`Other: …`** pattern (§4.2). |
| Smoke rule | Parse **`animalAllergies`** for **`Smoke (cigarette or cannabis)`**; block if other user has **`Smoker`** on **`smoking`** or **`cannabis`**. |
| Possible vs final match | **`PossibleMatches`** table for pending mutual likes; **`Matches`** **only** after admin approval (in a room). |
| Mutual like vs admin | **Possible matches** from mutual likes; **approve** → **`Matches`** + room. |
| Blocked pairs | **Do not show** blocked users in the other’s **deck**. |
| Timestamps | **`PossibleMatches.createdAt`** = mutual-like moment (admin sort); **`SwipeActions`**: **`createdAt`** = first swipe on pair, **`updatedAt`** = last like/pass change (§5.5). |
| Admin rejection | Remove **`PossibleMatches`** only; keep **`SwipeActions`**; pair **does not** reappear in decks (§6.5). |

---

*End of spec.*
