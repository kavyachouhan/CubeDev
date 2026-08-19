# CubeDev — Engineering Rules

> The bar for any change to this codebase, human or AI.
> Last verified against commit `ed01603`.

Related: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Design.md](./Design.md)

---

## 1. Prime directive: production grade

**The code must be production grade, and the solution must be production grade.** Not a prototype, not a demo, not "works on my machine". This is a live product with real users.

That is not a slogan — it means all of the following, every time:

- **Fully typed.** No `any`. No unexplained `!`.
- **Every failure is visible.** A `catch` that only calls `console.error` is not error handling. The user must be told something went wrong.
- **Diagnostics go through the logger, not `console.*`.** Levelled, structured, and silent at `debug`/`info` in production — §10.
- **Every async surface has three states.** Loading, error, and empty — not just the happy path.
- **Every mutation validates its arguments** and checks that the caller is allowed to do the thing.
- **No dead code.** No commented-out blocks, no unused imports, no orphaned files, no `TODO` left behind.
- **No half-finished features.** Don't merge a stub behind a flag and call it done.
- **Solve the actual problem.** Don't special-case a symptom, don't hardcode around a bug, don't swallow an error to make a warning go away.

A change is **done** only when it works in **light and dark mode, across all five color schemes, on mobile and desktop**. See [Design.md](./Design.md) §10.

## 2. Language & typing

- Props are typed with `interface XProps { … }`. This is the codebase convention (192 interfaces vs 2 types) — follow it.
- No `any`. Use `unknown` plus narrowing, or write the real type. Convex `Doc<"table">` and `Id<"table">` from `@/convex/_generated/dataModel` exist — use them.
- No non-null assertion `!` unless the invariant is genuinely provable, and then comment why.
- Every Convex function argument gets a `v.*` validator. That is the runtime validation layer.
- **Do not add zod.** It is not a dependency and the project does not use it.
- `tsconfig.json` is `strict: true`. Do not weaken it.

## 3. Components

- `"use client"` only where hooks, state, or browser APIs are actually needed.
- `layout.tsx` stays a **server** component exporting `metadata` and returning `children` — nothing more.
- `page.tsx` stays thin: compose feature components, don't implement features in it.
- One component per file, `PascalCase.tsx`, in the domain folder that owns it.
- Export through the folder's `index.ts` barrel and import through the barrel.
- Hooks are `useXxx.ts` in [components/timer/hooks/](../components/timer/hooks/) or [lib/hooks/](../lib/hooks/), not in a new top-level folder.
- Utilities are `kebab-case.ts` in [lib/](../lib/).

## 4. Comments

**Sensible, production-grade comments only.** A comment is a maintenance liability — it can go stale in a way code cannot — so it has to earn its place.

**Write a comment when it explains something the code cannot:**

- *Why*, not what — a non-obvious decision, a trade-off, a constraint imposed from outside.
- A workaround, with the reason it exists and what would let it be removed (e.g. a cubing.js quirk, a WCA API inconsistency, a Safari bug).
- A non-obvious invariant a future reader could unknowingly break.
- Domain rules that aren't self-evident from the identifiers — WCA regulation details, inspection penalty thresholds, Ao5 trimming rules.
- A short JSDoc block on an exported utility or hook whose contract isn't obvious from its signature.

**Do not write:**

- Comments that restate the code — `// set loading to true` above `setLoading(true)`.
- Section-divider banners and ASCII art inside components.
- Commented-out code. Delete it; git remembers.
- `TODO` / `FIXME` left behind. Either do it, or track it outside the codebase.
- Changelog or attribution comments — `// added by`, `// updated 2026-01-04`, `// new feature`. That's what git blame is for.
- Narration of an edit — `// changed this to fix the bug`. The comment must make sense to someone reading the file cold, with no knowledge that a change happened.

**Style:** full sentences, present tense, no emoji. Keep them next to what they describe, and update them in the same edit as the code — a comment that contradicts the code is worse than no comment.

The best comment is usually a better name. Reach for a well-named variable or an extracted function before reaching for a comment.

## 5. Styling, Tailwind & lint compliance

### Use current Tailwind v4 class names

This project is on Tailwind v4. Deprecated v3 spellings still work in places but are not the convention here, and [scripts/fix-tailwind-classes.mjs](../scripts/fix-tailwind-classes.mjs) exists precisely to normalize them. Write the v4 form:

| Don't | Do | Notes |
|---|---|---|
| `text-[var(--primary)]` | `text-(--primary)` | The CSS-variable shorthand. Already fully migrated — keep it that way |
| `flex-shrink-0` | `shrink-0` | 4 stragglers remain |
| `flex-grow` | `grow` | 1 straggler remains |
| `break-words` | `wrap-break-word` | Renamed in v4 |
| `bg-opacity-50`, `text-opacity-*` | `bg-black/50`, `text-(--text-primary)/50` | Opacity modifiers replaced the `*-opacity-*` utilities. 9 stragglers remain |
| `focus:outline-none` | `focus:outline-hidden` | v4 repurposed `outline-none`; `outline-hidden` is the utility that keeps the accessible transparent outline. **~172 v3-era uses remain** — see §16 |

Before hand-fixing a batch of these, note the codemod runs as a dry-run by default:

```
node scripts/fix-tailwind-classes.mjs          # dry run
node scripts/fix-tailwind-classes.mjs --write  # apply
```

Also settled, and covered in detail by [Design.md](./Design.md): no `dark:` variants (§1 there), no gradients, no raw hex or Tailwind palette colors — tokens only.

### Keep code lint-clean

`eslint-config-next` is installed but **no ESLint config file is wired up**, so nothing enforces this automatically. Write code that would pass anyway — the rules that bite most here:

- `@typescript-eslint/no-explicit-any` — see §2.
- `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` — no conditional hooks, no silently incomplete dependency arrays. If you must omit a dependency, comment why (§4).
- `no-unused-vars` — no unused imports, variables, or parameters.
- `@next/next/no-img-element` — use `next/image`. Remote hosts must be registered in [next.config.ts](../next.config.ts).
- `jsx-a11y` basics — `aria-label` on icon-only buttons, real `<button>` elements for click handlers, labels tied to inputs.

Never silence a rule with `eslint-disable` to make something pass. Fix the cause; if the rule is genuinely wrong for the case, disable the single line and explain why in the comment.

Wiring up a flat `eslint.config.mjs` is the correct fix for the missing config, but it is tooling — propose it, don't add it silently (§13).

## 6. Reuse before you create

Before writing anything new, look for it. In order:

1. The domain folder — `components/<domain>/` and its `index.ts`.
2. `globals.css` utility classes — `.timer-card`, `.btn-primary`, `.btn-secondary`, `.container-responsive`, `.stats-grid`, `.skeleton-box`, `.font-statement`. Most "primitives" here are classes, not components.
3. [lib/](../lib/) — `stats-utils.ts`, `date-utils.ts`, `identifier-utils.ts`, `notation-utils.ts`, `phase-splits.ts`, `wca-stats-utils.ts`, the `*-cache.ts` modules.
4. [components/timer/hooks/](../components/timer/hooks/) — `useTimerState`, `useSessionState`, `useSolveOperations`, `useDatabaseSync`, `useKeyboardShortcuts`, `usePersonalBestDetector` and friends. Anything timer-adjacent probably already has a hook.
5. Convex — the query you want likely already exists in `users.ts`, `algorithms.ts`, or `coach.ts`.

Duplicating an existing implementation is a defect, not a shortcut. Extract a shared component the second time you would copy-paste markup.

## 7. Convex

- **Never scan a whole table.** `ctx.db.query("t").collect()` without an index is a production incident waiting to happen. (Anti-pattern in the current code: `generateCubeDevIdentifier` in [convex/users.ts](../convex/users.ts) collects every user to generate one ID. Do not imitate it.)
- Add an index in [convex/schema.ts](../convex/schema.ts) rather than filtering in JavaScript. Name it `by_<fields>` like the existing ones.
- Queries are pure reads. Side effects belong in mutations; Node-runtime work (`web-push`, `fetch` to external APIs, `nodemailer`) belongs in actions.
- Mutations validate their args **and** authorize the caller before writing.
- Throw `new Error("<message safe to show a user>")`. Never leak internal detail or IDs into the message.
- Precomputed aggregates (`userEventStats`) exist so reads stay cheap — update them rather than recomputing over `solves`.
- Never edit `convex/_generated/`. Never casually edit `convex/seed*.ts` — those are one-shot data migrations.

## 8. Data fetching

- `useQuery` / `useMutation` from `convex/react`, with the `"skip"` idiom for conditional queries.
- Distinguish `undefined` (still loading) from `null` / `[]` (loaded, empty). Rendering an empty state during load is a bug.
- No `useEffect` fetch waterfalls. If you need derived data, derive it in the query or with `useMemo`.
- Reads that hit external APIs (WCA) go through the existing cache modules in [lib/](../lib/), not raw `fetch` from a component.

## 9. Error handling

- Every `catch` must surface something to the user. Log *and* set a visible state.
- **Never `alert()`.** There are four in the codebase; they are debt, not precedent.
- Never silently swallow. `catch {}` is banned.
- Loading states use the existing skeleton components ([components/SkeletonLoaders.tsx](../components/SkeletonLoaders.tsx), [components/timer/TimerSkeletons.tsx](../components/timer/TimerSkeletons.tsx), `components/stats/StatsSkeletons.tsx`, `components/admin/AdminSkeletons.tsx`), which must match the real layout so nothing jumps on load.
- API route handlers: validate, early `400`, and a `try`/`catch` returning `NextResponse.json({ error }, { status: 500 })`.

## 10. Logging

**Production code logs. It does not `console.log`.**

Raw `console.*` is a development tool: it is unstructured, unfiltered, unsearchable, has no severity, ships noise to every user's browser console, and — worst of all — is where secrets accidentally leak. The codebase currently has ~188 `console.error` calls and no logger at all. That is the single largest gap between this codebase and production grade.

**The rule:**

- All diagnostic output goes through a **logging utility**, never `console.*` directly (and never `print` on the Python side).
- Every log call carries a **level** — `debug` / `info` / `warn` / `error` — and structured context as an object, not string concatenation.
- **`debug` and `info` must be silent in production.** Only `warn` and `error` survive a production build.
- **Never log** tokens, passwords, WCA access tokens, email addresses, full user objects, or request bodies that may contain them. Log identifiers (`userId`, `roomId`, `solveId`), not payloads.
- Logging is **not** error handling. A logged error still needs a user-visible state — see §9.
- Server-side (API route handlers, Convex actions) logging carries the request or job context so a failure can be traced.

**Until a logger exists**, the first change that needs one should introduce `lib/logger.ts` — a thin, dependency-free wrapper that is level-aware and environment-aware, e.g.:

```ts
// lib/logger.ts — shape to aim for
type Level = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function log(level: Level, message: string, context?: Record<string, unknown>) {
  if (isProd && (level === "debug" || level === "info")) return;
  // single structured record, easy to swap for a real sink later
  console[level === "debug" ? "log" : level](
    JSON.stringify({ level, message, ...context, ts: new Date().toISOString() })
  );
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => log("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => log("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => log("error", m, c),
};
```

Usage:

```ts
// no
console.error("Failed to update room:", error);

// yes
logger.error("challenge_room.update_failed", { roomId: room.roomId, error: String(error) });
setError("Couldn't save your changes. Please try again.");
```

Keeping it behind one module means a real sink (Sentry, Axiom, Convex log stream) can be dropped in later without touching call sites. Do not add a logging **dependency** without agreement — see §12.

## 11. Security

- **Never trust client-passed identity for anything destructive or private.** Convex functions currently receive `userId` as an argument (see [Architecture.md](./Architecture.md) §5) — that is a known weakness. New code must at minimum verify inside the function that the passed user actually owns the record being read or written.
- Never log tokens, secrets, or full user objects.
- Server-only secrets stay server-only. Nothing sensitive gets a `NEXT_PUBLIC_` prefix.
- Never commit `.env.local` or real credentials.
- Any `dangerouslySetInnerHTML` must be sanitized. Prefer `react-markdown`, which is already a dependency.
- Admin functionality must be gated on both the client (`AdminProtectedRoute`) and in the Convex function itself.

## 12. Dependencies

Adding a library is a decision, not a convenience. These are settled:

| Need | Use | Do not add |
|---|---|---|
| Icons | `lucide-react` | heroicons, react-icons, SVG sprites |
| Animation | `framer-motion` + `globals.css` keyframes | GSAP, react-spring |
| Scrambles / cube logic | `cubing` (cubing.js) | Hand-rolled scramble generators |
| Persistence | Convex | Prisma, Supabase, direct SQL |
| Styling | Tailwind v4 + CSS custom properties | shadcn/ui, MUI, Chakra, styled-components, emotion |
| State | React Context + Convex live queries | Redux, Zustand, Jotai, Recoil |
| Charts | `recharts` (preferred for new work) | A **third** chart library |
| Validation | Convex `v.*` validators | zod, yup, joi |
| Logging | `lib/logger.ts` (§10) | winston, pino, or a hosted SDK, without agreement |

Also note: there is no `cn()` / `clsx` / `tailwind-merge` helper and no CVA. Class variants are done with template literals. Don't introduce a new pattern without agreement.

## 13. Do not

- Do not create a `tailwind.config.js/ts`. Tailwind v4 here is CSS-first by design.
- Do not write `dark:` variants — there is no `.dark` class. See [Design.md](./Design.md) §1.
- Do not add new top-level directories (`hooks/`, `types/`, `utils/`, `src/`).
- Do not add authenticated routes outside `/cube-lab/*`.
- Do not edit `convex/_generated/` or `convex/seed*.ts`.
- Do not touch `cubie_backend/` unless explicitly asked — it is a separate service with its own docs.
- Do not weaken `tsconfig.json` or disable lint rules to make something pass.
- Do not commit or push unless asked.
- Do not add npm scripts, CI, or tooling silently — propose it first.
- Do not use the terminal for anything outside §14.

## 14. Terminal use (AI agents)

**The terminal is for compilation, verification, and running the app. Nothing else.**

Reading and editing files is what the file tools are for. Shelling out to inspect the repo is slower, noisier, burns the user's time and tokens, and risks side effects on a working tree that may have uncommitted changes.

**Allowed:**

| Purpose | Command |
|---|---|
| Typecheck | `npx tsc --noEmit` |
| Build | `npm run build` |
| Run the app | `npm run dev` |
| Convex backend | `npx convex dev` / `npx convex deploy` (deploy only when explicitly asked) |
| Install a dependency | `npm install <pkg>` — only after the addition is agreed per §12 |
| Read-only git status | `git status`, `git diff`, `git log` |

**Not allowed without being asked:**

- Exploratory shell commands to read, search, or list files — use the Read, Glob, and Grep tools instead. No `cat`, `ls`, `find`, `grep`, `head`, `tail`, `type`, `Get-Content`, `Get-ChildItem`, `Select-String`.
- Anything that writes to the filesystem from the shell — no `echo >`, `Set-Content`, `Out-File`, `mkdir`, `rm`, `mv`, `cp`. Use the Write and Edit tools.
- Any git command that changes state: `commit`, `push`, `add`, `checkout`, `reset`, `stash`, `rebase`, `merge`, branch creation or deletion.
- Package or environment changes: `npm uninstall`, `npm update`, `npx` codemods, global installs, `nvm`.
- Anything touching production: Convex deploys, Vercel CLI, database writes, sending real emails or push notifications.
- Long-running or interactive processes left in the foreground.
- Reading `.env.local` or any file containing secrets.

If a task seems to need a command outside this list, **ask first and say why**. One well-chosen command beats five exploratory ones.

## 15. Verification before calling it done

1. `npx tsc --noEmit` — must be clean.
2. `npm run build` — must succeed.
3. Run it: `npm run dev`, exercise the actual flow, including the failure paths.
4. Visual check per [Design.md](./Design.md) §10 — both themes × all five color schemes, mobile and desktop widths.
5. Keyboard-only pass on anything interactive.

There is no test suite and no lint script (see §16). That raises, not lowers, the bar on manual verification.

## 16. Known gaps — debt, not precedent

The codebase contains patterns that violate the rules above. They are listed here so you recognize them as debt and **do not copy them**. Fix them when you are already in the file; do not launch an unrequested cleanup sweep.

| Gap | What to do instead |
|---|---|
| No ESLint or Prettier config, no CI (`eslint-config-next` is installed but unused) | §5 — write lint-clean code by hand. Match surrounding formatting. Propose tooling rather than adding it unannounced |
| ~172 `focus:outline-none` uses — the Tailwind v3 spelling, superseded by `outline-hidden` in v4 | §5. Use `outline-hidden` in new code; convert the file you're already in, not the whole repo |
| Residual v3 class names: 4 × `flex-shrink-0`, 1 × `flex-grow`, 9 × `*-opacity-*` | §5 — [scripts/fix-tailwind-classes.mjs](../scripts/fix-tailwind-classes.mjs) handles the first two |
| No test framework at all | Verify manually and thoroughly (§15) |
| **No logger — ~188 raw `console.error` calls and no severity, structure, or production filtering** | §10. Introduce `lib/logger.ts` with the first change that needs it, and route new code through it |
| No `error.tsx`, `loading.tsx`, or error boundary anywhere | Handle errors inside the component; consider adding `error.tsx` when you touch a route |
| No toast/notification system for transient feedback | Use inline component state. Do not add a toast library unilaterally |
| ~148 `: any` annotations, heaviest in `convex/users.ts` and the cache modules | Type new code properly; tighten what you touch |
| ~188 `console.error` calls, most with no user-facing state, plus 4 `alert()` calls | §9 and §10 |
| WCA access token stored in `localStorage` | Don't extend reliance on it; don't put anything more sensitive there |
| Convex functions take `userId` as an argument instead of using `ctx.auth` | §11 — verify ownership inside the function |
| Duplicate components: `AdminAlgorithms.tsx` at two paths; `RoundSimulator.tsx` vs `RoundSimulatorRedesigned.tsx` | Check which one is actually routed before editing either |
| Two chart libraries (`recharts` and `chart.js`) | Prefer `recharts` for new charts |
| Modal a11y: only ~4 of ~30 modals set `role="dialog"` or handle Escape | Every **new** modal follows [Design.md](./Design.md) §6 in full |
| Font pipeline conflict: Geist loaded via `next/font` but unused; JetBrains Mono referenced in CSS but never loaded | Use the `.font-*` utility classes; don't add a fourth font |
| Render-blocking Google Fonts `@import` in `globals.css` | Don't add more `@import` font loads |
