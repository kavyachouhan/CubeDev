# CubeDev — Architecture

> How the system is wired, so you know where code goes.
> Last verified against commit `ed01603`.

Related: [PRD.md](./PRD.md) · [Rules.md](./Rules.md) · [Design.md](./Design.md) · [Production-Readiness-Changes.md](./Production-Readiness-Changes.md)

---

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** App Router, Turbopack for dev **and** build | No `pages/` directory |
| UI | React 19 | |
| Language | TypeScript 5, `strict: true` | Path alias `@/* → ./*` |
| Styling | **Tailwind CSS v4** via PostCSS | **No `tailwind.config` file exists.** Tokens are CSS custom properties in [app/globals.css](../app/globals.css) — see [Design.md](./Design.md) |
| Database & backend | **Convex 1.27** | Queries, mutations, actions, crons. The only persistence layer |
| Auth | **WCA OAuth 2.0** + httpOnly session JWT; Convex `customJwt` ES256 via `setAuth` | No Clerk / NextAuth. See [Production-Readiness-Changes.md](./Production-Readiness-Changes.md) |
| Cubing | `cubing` (cubing.js) 0.58 | Scramble generation and twisty player |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` | |
| Animation | `framer-motion` | |
| Icons | `lucide-react` | The only icon system |
| Charts | `recharts` **and** `chart.js` + `react-chartjs-2` | Two libraries — see debt note in [Rules.md](./Rules.md) |
| File storage | `appwrite` | Avatars and uploads, [lib/appwrite-storage.ts](../lib/appwrite-storage.ts) |
| Push | `web-push` + `public/sw.js` | VAPID |
| JWT | `jose` | Only for authenticating to the Cubie backend |
| Email | `nodemailer` | Contact form replies |
| Analytics | `@vercel/analytics` | |

`package.json` scripts are **`dev`, `build`, `start` only** — there is no `lint`, `test`, or `typecheck` script and no test framework installed.

> The `Technology Stack` section in [README.md](../README.md) says "Next.js 14". That is stale; this document is the source of truth.

## 2. Folder map

| Path | Contents |
|---|---|
| [app/](../app/) | Routes, layouts, and API route handlers |
| [components/](../components/) | All React components, grouped by domain |
| [convex/](../convex/) | Schema, queries, mutations, actions, crons, seeds |
| [lib/](../lib/) | Framework-agnostic utilities + theme context |
| [public/](../public/) | `sw.js`, logos (one per color scheme), cube icons, sounds |
| [scripts/](../scripts/) | `fix-tailwind-classes.mjs` — a one-off codemod |
| `cubie_backend/` | Separate Python FastAPI service. **Out of scope for this repo's frontend work** — see §7 |
| `certificates/` | Local HTTPS certs for WCA OAuth in development |

**There is no top-level `hooks/` or `types/` directory.** Hooks live in [components/timer/hooks/](../components/timer/hooks/) and [lib/hooks/](../lib/hooks/); types are colocated with the code that owns them.

### `components/` domains

`timer/`, `stats/`, `algorithm/`, `coach/` (+ `coach/progress/`), `competition/`, `challenges/`, `cubie/`, `profile/`, `settings/`, `faq/`, `feedback/`, `admin/` (+ `admin/algorithms/modals/`), `home/`, `ui/`.

`components/ui/` holds only two primitives (`ActionBottomSheet`, `ShareBottomSheet`) — **this is not shadcn/ui**. Most shared visual primitives are CSS classes in `globals.css`, not components. See [Design.md](./Design.md).

Most domain folders expose an `index.ts` barrel. Import through the barrel.

## 3. Routing

- **No route groups.** Grouping is by plain path segment.
- Every authenticated product surface lives under **`/cube-lab/*`**. [next.config.ts](../next.config.ts) contains 10 permanent redirects from legacy flat routes (`/timer`, `/stats`, `/coach`, `/challenges`, …) into `/cube-lab/*`. **New authed routes must go under `/cube-lab`.**
- Convention per route:
  - `layout.tsx` — a **server** component that exports `metadata` and returns `children`. Nothing else.
  - `page.tsx` — `"use client"`, composes feature components. Thin.

Example ([app/cube-lab/timer/page.tsx](../app/cube-lab/timer/page.tsx)):

```tsx
<ProtectedRoute>
  <CubeLabLayout activeSection="timer" isTimerFocusMode={isTimerFocusMode}>
    <CubeLabTimer onTimerFocusChange={setIsTimerFocusMode} />
  </CubeLabLayout>
</ProtectedRoute>
```

`next.config.ts` also configures WCA image remote patterns and custom webpack `splitChunks` isolating `cubing/twisty` and `cubing/scramble` into their own chunks — cubing.js is large, so keep its imports out of shared modules.

## 4. Render & data flow

Provider nesting in [app/layout.tsx](../app/layout.tsx):

```
ConvexClientProvider → UserProvider → ThemeProviderWrapper → FeedbackProvider → {children}
```

A typical request:

1. `page.tsx` (client) renders `ProtectedRoute`, which reads the session from `UserProvider`.
2. Unauthenticated → a WCA sign-in prompt. Authenticated → `CubeLabLayout` (sidebar shell) wraps the feature component.
3. The feature component calls `useQuery` / `useMutation` from `convex/react` with `api` from `@/convex/_generated/api`.
4. Convex live queries push updates; no manual refetching or cache invalidation.

**Data fetching is client-side.** Server components are effectively only the metadata `layout.tsx` files and static marketing pages. There are no server-side Convex reads outside API route handlers.

The conditional-args idiom is used throughout — pass `"skip"` instead of args to defer a query:

```ts
const data = useQuery(
  api.users.getUserById,
  user?.convexId ? { id: user.convexId } : "skip"
);
```

`undefined` means *loading*; `null` or `[]` means *loaded and empty*. Treat them differently.

## 5. Authentication

**There is no `middleware.ts`.** All gating is client-side.

1. **Redirect out.** [lib/wca-config.ts](../lib/wca-config.ts) builds the WCA authorize URL (`scope: "public email"`). The caller stashes the current path in `sessionStorage.redirectAfterAuth` and does a full navigation.
2. **Callback.** [app/auth/wca/callback/page.tsx](../app/auth/wca/callback/page.tsx) — a client page. Strips `code` from the URL via `history.replaceState`, dedupes replays with a `sessionStorage` key, POSTs the code onward.
3. **Server exchange.** [app/api/auth/wca/token/route.ts](../app/api/auth/wca/token/route.ts) exchanges the code using `WCA_CLIENT_ID` / `WCA_CLIENT_SECRET`, fetches the WCA profile, and upserts into Convex via `ConvexHttpClient` (`api.users.upsertUser`), returning the user plus its `convexId`.
4. **Session storage.** The callback writes the whole user object to `localStorage["wca_user"]` and redirects to `/cube-lab/timer`.
5. **Session source of truth.** [components/UserProvider.tsx](../components/UserProvider.tsx) reads that key on mount, listens for the cross-tab `storage` event and a custom `userUpdated` event, and merges live Convex data over it. `useUser()` is the app-wide hook. `signOut()` clears localStorage.
6. **Gating.** [components/ProtectedRoute.tsx](../components/ProtectedRoute.tsx) for user pages; [components/admin/AdminProtectedRoute.tsx](../components/admin/AdminProtectedRoute.tsx) + `POST /api/admin/verify` (email checked against the comma-separated `ADMIN_EMAIL` env allowlist) for admin.

> **Known weakness, documented deliberately.** Convex functions are not called with an authenticated identity — the plain `ConvexProvider` is used and `userId` is passed as a *function argument from the client*. Authorization is therefore trust-on-client. The WCA access token also lives in `localStorage`. Do not build new sensitive surfaces that lean on this; see [Rules.md](./Rules.md) §11.

## 6. Convex backend

### Modules

| File | Responsibility |
|---|---|
| [convex/schema.ts](../convex/schema.ts) | All 28 table definitions and their indexes |
| [convex/users.ts](../convex/users.ts) | Login upsert, user lookup, settings, account deletion — **plus all timer data**: sessions, solves, batch import, stats, heatmap |
| [convex/algorithms.ts](../convex/algorithms.ts) | Sets/cases/algs, spaced-repetition progress, practice sessions, recognition metrics, custom sets |
| [convex/coach.ts](../convex/coach.ts) | Coach profiles, goals + history, weekly plan generation, journal, progress snapshots |
| [convex/challengeRooms.ts](../convex/challengeRooms.ts) | Room lifecycle, join, solve submission, ranking, expiry processing |
| [convex/challengeStats.ts](../convex/challengeStats.ts) | Per-user challenge aggregates |
| [convex/competitionSimulations.ts](../convex/competitionSimulations.ts) | Simulation lifecycle and per-round results |
| [convex/pushNotifications.ts](../convex/pushNotifications.ts) | Subscription CRUD, logging, timezone-aware eligibility queries |
| [convex/pushNodeActions.ts](../convex/pushNodeActions.ts) | Node-runtime actions that actually call `web-push` |
| [convex/faq.ts](../convex/faq.ts) | Help-center reads + admin CRUD |
| [convex/featureLabels.ts](../convex/featureLabels.ts) | Server-driven "New" / "Beta" ribbons |
| [convex/contactMessages.ts](../convex/contactMessages.ts), [convex/feedbackResponses.ts](../convex/feedbackResponses.ts) | Contact inbox, in-app feedback surveys |
| [convex/identifierResolver.ts](../convex/identifierResolver.ts) | Shared helper (not a Convex function): WCA vs CubeDev ID resolution incl. aliases |
| `convex/admin*.ts` | Admin-only reads and mutations, one module per console |
| `convex/seed*.ts`, `convex/updateZBLL.ts` | **One-shot seed mutations with large embedded datasets.** Do not edit casually |

### Tables by domain

| Domain | Tables |
|---|---|
| Identity | `users`, `userIdentifierAliases` |
| Timer | `sessions`, `solves`, `userEventStats` |
| Challenges | `challengeRooms`, `roomParticipants`, `roomSolves` |
| Algorithm trainer | `algorithmSets`, `algorithmCases`, `algorithms`, `userAlgorithmProgress`, `customAlgorithmSets`, `algorithmPracticeSessions` |
| Coach | `coachProfiles`, `coachTrainingPlans`, `coachJournalEntries`, `coachProgressSnapshots`, `coachGoalHistory` |
| Competitions | `competitionSimulations`, `competitionSimulationResults` |
| Notifications | `pushSubscriptions`, `pushNotificationLog`, `reminderRunMetrics` |
| Content & ops | `faqCategories`, `faqArticles`, `contactMessages`, `feedbackResponses`, `featureLabels` |

Nearly every table carries a `by_user` index plus composite indexes matching its exact access patterns. Follow that: add an index rather than filtering in JS.

### Crons — [convex/crons.ts](../convex/crons.ts)

| Job | Interval |
|---|---|
| Process expired challenge rooms | 60 min |
| Recompute challenge stats | 6 h |
| Due-algorithm push | 4 h |
| Daily practice reminders | 5 min |
| Streak alerts | 15 min |
| Goal progress notifications | 1 h |
| Weekly coach summary | 1 h |

The frequent jobs are timezone-aware sweeps that decide per user whether *their* local send time has arrived.

## 7. External services

| Service | Boundary |
|---|---|
| **WCA** | OAuth 2.0 for identity; REST API for profiles, records, and competitions. Avatars proxied through `next/image` remote patterns |
| **Cubie backend** | A separate Python FastAPI + LangChain agentic RAG service in `cubie_backend/`. The frontend mints a `jose` JWT via [app/api/auth/token/route.ts](../app/api/auth/token/route.ts) (audience `cubie-backend`, 24 h) and proxies chat through `app/api/cubie/chat/*` to `NEXT_PUBLIC_CUBIE_BACKEND_URL`. **Documented here as a boundary only — its internals are out of scope for this doc set and have their own Markdown docs in that directory** |
| **Appwrite** | File/avatar storage, [lib/appwrite-storage.ts](../lib/appwrite-storage.ts) |
| **Web Push / VAPID** | Browser push via `public/sw.js`, sent from Convex Node actions |
| **SMTP (nodemailer)** | Contact-form replies from `/api/contact/reply` |
| **Vercel** | Hosting and analytics |

### API route handlers — [app/api/](../app/api/)

`auth/wca/token` (OAuth exchange) · `auth/token` (Cubie JWT) · `admin/verify` (allowlist check) · `cubie/chat` + `cubie/chat/session[/[sessionId]]` (proxy) · `competition/upcoming` (WCA competitions) · `contact` + `contact/reply` · `room/validate`.

All follow the same shape: validate inputs, early `400`, work in a `try`, `console.error` + `NextResponse.json({ error }, { status: 500 })` on failure.

## 8. Client state & caching

- **No Redux, Zustand, or Jotai.** State is React Context plus Convex live queries.
- Contexts: [components/UserProvider.tsx](../components/UserProvider.tsx) (session), [lib/theme-context.tsx](../lib/theme-context.tsx) (theme), `components/admin/AdminContext.tsx`, `components/feedback/FeedbackProvider.tsx`.
- Bespoke `localStorage` TTL caches sit in front of expensive or external reads: [lib/stats-cache.ts](../lib/stats-cache.ts) (5 min), [lib/wca-cache.ts](../lib/wca-cache.ts), [lib/admin-cache.ts](../lib/admin-cache.ts) (+ `lib/hooks/useAdminCache.ts`), [lib/coach-cache.ts](../lib/coach-cache.ts).
- **No optimistic updates.** Convex reactivity is relied on instead.
- Theme preferences are persisted twice: `localStorage["cubedev-theme-preferences"]` and Convex. The DB wins on load.

## 9. Environment variables

From [.env.example](../.env.example):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL |
| `NEXT_PUBLIC_CUBIE_BACKEND_URL` | Cubie FastAPI base URL |
| `WCA_CLIENT_ID`, `WCA_CLIENT_SECRET`, `WCA_REDIRECT_URI` | WCA OAuth app credentials (server-only) |
| `JWT_SECRET_KEY` | Signs the Cubie JWT — minimum 64 chars |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL_TO` | Contact-form email |
| `ADMIN_EMAIL` | Comma-separated admin allowlist (used by `/api/admin/verify`; not in `.env.example`) |

VAPID keys for web push are configured on the Convex deployment, not in the Next.js env.

Anything not prefixed `NEXT_PUBLIC_` is server-only and must never be referenced from a client component.
