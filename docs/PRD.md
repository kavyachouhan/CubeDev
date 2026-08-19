# CubeDev — Product Requirements

> What CubeDev is, who it serves, what it does today, and where it is going.
> Last verified against commit `ed01603`.

Related: [Architecture.md](./Architecture.md) · [Rules.md](./Rules.md) · [Design.md](./Design.md)

---

## 1. Product

CubeDev is a comprehensive speedcubing platform for cubers of all levels, live at [cubedev.xyz](https://cubedev.xyz). It combines a competition-grade timer, deep solve analytics, an algorithm trainer with spaced repetition, a personal coach, WCA competition simulation, multiplayer challenge rooms, and an AI assistant (Cubie) into one account tied to a cuber's WCA identity.

The project is **proprietary and closed to public contributions**. Bugs and feature suggestions go through issues; other contact via [cubedev.xyz/contact](https://www.cubedev.xyz/contact).

## 2. Target users

| Tier | Needs |
|---|---|
| Beginner cubers | Learn a method, drill first algorithm sets, understand what their times mean |
| Intermediate speedcubers | Sub-20 / sub-15 goals, structured practice, weakness identification, progress tracking |
| Advanced competitors | Competition simulation under pressure, fine-grained phase analytics, large algorithm sets (ZBLL, COLL, EG) |
| Broader cubing community | Public profiles, cuber directory, WCA stats exploration, head-to-head challenges |

Sign-in is **WCA OAuth only**. Every authenticated user therefore has (or creates) a WCA account, which shapes the audience toward people who compete or intend to. Users without a WCA ID are still first-class — see §5.

## 3. Feature inventory

### Public (no auth)

| Surface | Route | What it does |
|---|---|---|
| Landing | `/` | Marketing page: hero timer, feature showcase, testimonials, value props, CTA |
| Cuber directory | `/cuber` | Browse and search platform users |
| Public profile | `/cuber/[wcaId]` | A cuber's WCA stats, CubeDev stats, and training activity. Resolves **either** a WCA ID or a CubeDev ID |
| WCA stats explorer | `/wca-stats` | Records and rankings browser backed by WCA data |
| Help center | `/help`, `/help/[categorySlug]/[articleSlug]` | Convex-backed FAQ/articles, admin-editable |
| Legal & info | `/about`, `/contact`, `/credits`, `/privacy`, `/terms` | Static pages; `/contact` writes to Convex and triggers an email |

### Cube Lab (authenticated)

All wrapped in `ProtectedRoute` + `CubeLabLayout`. Sidebar order is defined in [components/CubeLabLayout.tsx](../components/CubeLabLayout.tsx).

| Surface | Route | What it does |
|---|---|---|
| Timer | `/cube-lab/timer` | The core solving experience |
| Statistics | `/cube-lab/statistics` | Analytics over the user's solve history |
| Algorithm Trainer | `/cube-lab/algorithm-trainer` | Learn and drill algorithm sets with spaced repetition |
| Coach | `/cube-lab/coach` | Goals, training plans, journal, streaks, progress |
| Competitions | `/cube-lab/competitions` | Browse WCA competitions and simulate rounds |
| Challenges | `/cube-lab/challenges` | Multiplayer rooms on shared scrambles |
| Cubie AI | `/cube-lab/cubie` | Agentic RAG chat assistant |
| Chat | `/cube-lab/chat` | Placeholder — `CubieComingSoon`, not built |

### Account & admin

| Surface | Route | Notes |
|---|---|---|
| Settings | `/me` | **Not `/settings`.** Profile, privacy, notifications, keyboard shortcuts, theme, data management, account deletion |
| Auth callback | `/auth/wca/callback` | The only auth page; sign-in itself is a redirect to WCA |
| Admin | `/admin/*` | 12 consoles (users, algorithms, challenges, competitions, coach, contact, FAQ, feedback, labels, notifications, timer-analytics) behind an `ADMIN_EMAIL` allowlist |

## 4. Core feature requirements

Orientation-level, not a full spec. Each links to its primary implementation.

### Timer — [components/CubeLabTimer.tsx](../components/CubeLabTimer.tsx), [components/timer/](../components/timer/)

- Three input modes: keyboard (spacebar hold-to-ready), manual entry, and Stackmat hardware via audio input.
- WCA-style inspection with 8s/12s warnings and automatic +2/DNF.
- Penalties: +2 and DNF, applied and undone after the fact.
- Phase splits (cross / F2L / OLL / PLL) with per-phase timing.
- Per-event sessions; a user may keep many sessions per event.
- Scramble generation via cubing.js ([components/timer/ScrambleGenerator.ts](../components/timer/ScrambleGenerator.ts)), with a 3D/2D scramble preview.
- Import/export: csTimer, Twisty Timer, CubeDesk formats.
- Personal-best detection with celebration; focus mode blurs non-timer panels while solving.

### Statistics — [components/CubeLabStats.tsx](../components/CubeLabStats.tsx), [components/stats/](../components/stats/)

- Personal bests: single, Ao5, Ao12, per event.
- Time progression chart, time distribution, solve heatmap by date.
- Phase averages and phase trend charts where splits exist.
- Filters by event, session, and date range.
- Precomputed aggregates live in the `userEventStats` table — read those rather than recomputing over all solves.

### Algorithm Trainer — [components/algorithm/](../components/algorithm/), [convex/algorithms.ts](../convex/algorithms.ts)

- Built-in sets: OLL, PLL, F2L, COLL, ZBLL, CLL (2x2), EG1, EG2.
- Per-case pages with multiple algorithms, alternatives, and 3D/2D visualization.
- Spaced repetition: learning stages and scheduled review dates per user per case.
- Practice modes: recognition, execution, infinite drill, blind recognition.
- User-created custom sets with import/export.
- Mastery dashboard, recognition-speed metrics, and a progress heatmap.

### Coach — [components/coach/](../components/coach/), [convex/coach.ts](../convex/coach.ts)

- Goal setting (e.g. sub-X for an event) with goal history.
- Weekly training plans generated from the user's actual solve data, with activity completion tracking.
- Practice journal entries.
- Streaks and periodic progress snapshots.
- Shareable progress cards.

### Competitions — [components/competition/](../components/competition/), [convex/competitionSimulations.ts](../convex/competitionSimulations.ts)

- Browse upcoming WCA competitions.
- Configure and run a simulated round: official format, cutoffs, time limits.
- Pressure realism: judge behaviour, judge errors, venue atmosphere audio, anxiety training.
- WCA-style scorecards and shareable result cards.
- Round results persisted for later review.

### Challenges — [components/challenges/](../components/challenges/), [convex/challengeRooms.ts](../convex/challengeRooms.ts)

- Create public or private rooms with a 6-character join code.
- All participants solve the **same** scrambles.
- Formats: single, Ao5, Ao12.
- Live leaderboard updating as solves land.
- Rooms expire; a closure report summarizes the result. Expiry is processed by a cron.
- Per-user aggregate challenge stats.

## 5. Identity model

Two identifiers, both resolvable on the same public profile route.

| | WCA ID | CubeDev ID |
|---|---|---|
| Format | `2019SMIT01` — `^\d{4}[A-Z]{4}\d{2}$` | `CD25ABC01` — `^CD\d{2}[A-Z]{3}\d{2}$` |
| Source | Assigned by the WCA on first competition | Generated by CubeDev at signup |
| Purpose | Canonical identity for competitors | Identity for users who have not competed yet |

A user who signs up without a WCA ID gets a CubeDev ID. When they later earn a WCA ID, the old CubeDev ID is recorded in the `userIdentifierAliases` table so existing profile links keep resolving to the same person.

Implementation: [lib/identifier-utils.ts](../lib/identifier-utils.ts) (client-side format checks) and [convex/identifierResolver.ts](../convex/identifierResolver.ts) (`resolveUserByIdentifierOrAlias`). Always resolve through those helpers — never pattern-match identifiers inline.

## 6. Product vision

CubeDev is aiming to be the **all-in-one platform for everything a cuber does** — one account, one dataset, every tool.

The differentiator from every other timer on the market is not a single feature but an **AI-powered Cubing Trainer**: a full coaching system that grows out of today's Coach surface and out of Cubie AI, of which ML/CV solve analysis is one capability among several.

Where Coach today tracks goals and hands out training plans built from summary statistics, the Trainer is intended to watch actual solves, understand what happened inside them, and coach off that — solve reconstruction, per-phase critique, lookahead and pause detection, weakness identification, and personalized drill generation that feeds back into the Algorithm Trainer. This is the strategic direction; architecture decisions should not foreclose it.

## 7. Roadmap

**Everything in this section is not yet built.** Do not treat any of it as existing behaviour.

### Now — in flight

| Item | Touches |
|---|---|
| CubeDev ID rollout | [convex/identifierResolver.ts](../convex/identifierResolver.ts), `userIdentifierAliases`, [lib/identifier-utils.ts](../lib/identifier-utils.ts), profile routes |
| 2D / 3D cube view setting | [components/settings/CubeViewSelector.tsx](../components/settings/CubeViewSelector.tsx), [components/algorithm/CubeVisualizer3D.tsx](../components/algorithm/CubeVisualizer3D.tsx), [components/timer/ScramblePreview.tsx](../components/timer/ScramblePreview.tsx) |
| Cubie AI chat | `/cube-lab/cubie` is live; `/cube-lab/chat` is still a `CubieComingSoon` placeholder |

### Next

| Item | Notes |
|---|---|
| Solve reconstruction | Turn a recorded solve into a readable move-by-move reconstruction. Prerequisite for most Trainer work |
| Cross / X-Cross trainer | A new mode inside the Algorithm Trainer |
| Growth prediction | Projected improvement curve; extends Coach and Statistics |
| 1v1 head-to-head | Builds on the existing Challenges room infrastructure |

### Later

| Item | Notes |
|---|---|
| Cube Solver | Given a state, produce a solution |
| 3x3 BLD solver | Blindfolded solving aid |
| PWA / mobile app | `public/sw.js` and web-push already exist as a partial foundation |
| Smart cube integration | Bluetooth cubes as a fourth timer input source alongside keyboard / manual / Stackmat |
| **AI Cubing Trainer** | The flagship differentiator described in §6 — absorbs solve analysis (ML/CV), reconstruction, weakness detection, and drill generation into Coach. Likely lands in `cubie_backend` or a new service rather than in Convex |

> **Schema note for anyone designing adjacent tables:** smart cubes, reconstruction, and the AI Trainer all depend on a **per-solve move stream** — timestamped turns — which the `solves` table does not currently store. Today a solve holds time, penalty, scramble, and phase splits only. Leave room for that.

## 8. Non-goals

- Not an open-source project and not accepting public contributions.
- Not a general puzzle wiki or tutorial site — the help center covers CubeDev, not cubing pedagogy at large.
- Not a replacement for the WCA — CubeDev consumes WCA data and identity, it does not issue official results.
- No social feed, DMs, or follower graph. Community surface is the directory, public profiles, and challenge rooms.
- No paid tiers, payments, or billing at present.
