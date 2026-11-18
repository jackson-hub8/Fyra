# Fyra

A web application that improves roommate matching at Transylvania University. Students create profiles, complete a private questionnaire, and swipe on potential roommates. Fyra calculates a similarity score between students so administrators have better data to make final room assignments.

**Senior Project (CS-4444)** – Cameron Horine, Jackson Hurley, Kaitlyn Maes

## Why Fyra?

The current roommate matching process often produces poor pairings, leading to discomfort, conflict, and negative student experiences. Fyra gives students a voice in the process while keeping final decisions with university administrators.

## Features

- **Authentication** – Sign up with a `@transy.edu` email, verified via a temporary emailed code
- **Profiles** – Bio, year, interests, daily life, pet peeves, and profile picture
- **Private Questionnaire** – Used for detailed compatibility matching
- **Swipe Discovery** – Tinder-style deck (restricted to students of the same sex at birth)
- **Similarity Scoring** – Compatibility score to help administrators pair students
- **User Search** – Look up specific students
- **Matched vs. Unmatched Views**
  - Matched: Home, Profile, Calendar
  - Unmatched: Search, Profile, Matching
- **Shared Calendar** – Add, edit, and view events (only the creator can edit or delete an event)
- **Chores** – Shared chore list that all roommates can create, edit, and delete
- **Admin Dashboard** – View matched/unmatched students, see swipe matches ranked by similarity, review questionnaire responses, and manually create matches

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19.2.0, TypeScript 5.9.3, Vite 7.2.4 |
| Hosting / API | Vercel (serverless API routes), Vercel Blob 0.25.0 (profile photos) |
| Database | MySQL with Prisma 6.19.2 |
| Security | argon2 0.44.0 (password hashing) |
| Email | nodemailer 7.0.13 |
| Tooling | ESLint 9.39.1, Node.js, npm |

## Roadmap

- [ ] SBERT (open-text), Jaccard, and distance-based matching algorithms
- [ ] Levenshtein-based user search
- [ ] Admin page for matching users
- [ ] Custom dropdown for event times (macOS compatibility)
- [ ] Transylvania academic calendar integration
- [ ] User testing and UI/UX refinements
- [ ] Report feature for inappropriate profiles or handbook/terms violations

## Security & Compliance

- Passwords are hashed and salted with Argon2 and never stored in plaintext
- Prisma helps protect against SQL injection
- Hosted on Vercel, which provides DDoS protection
- Users must accept terms and conditions; the university handbook governs expected behavior

## Compatibility

Runs in any modern browser on Windows, macOS, Linux, iOS, and Android, with a responsive UI.

## Authors

- Cameron Horine
- Jackson Hurley
- Kaitlyn Maes

Advisor: Professor Kenneth Moorman, Transylvania University
