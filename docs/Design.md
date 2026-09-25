# CubeDev — Design System

> The visual language, and the components that carry it. Every rule here is
> enforced by [tests/unit/design-system.test.ts](../tests/unit/design-system.test.ts).

Related: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Rules.md](./Rules.md)

---

## 0. The rules, up front

| Rule | Why |
|---|---|
| **Build from `components/ui`.** Import the primitive; don't restyle from scratch | One system, not thirty variations. §5 |
| **Tokens only for color.** Never a raw hex, never a Tailwind palette color like `bg-blue-600` | §2 — a hardcoded color breaks four of the five schemes, both high-contrast modes and light mode |
| **No gradients.** Surfaces are flat `--surface` / `--surface-elevated` | The identity is flat tinted panels, not glassmorphism |
| **No emojis.** `lucide-react` icons only | §8 |
| **Tokens for radius, spacing, z-index and motion too** | §4, §7, §9 |
| **One overlay system.** `Modal`, `BottomSheet`, `Menu`, `Popover`, `Lightbox` | §6 — they share the focus trap, the scroll lock and Escape handling |
| **Responsive by design, not by shrinking.** Sheets on mobile, dialogs on desktop | §7 |
| **Works in light + dark × all 5 schemes, plus reduce-motion and high-contrast** | §1, §10 |
| **The timer page is the reference layout** | §7 |

Run the gallery at **`/design-system`** (dev only) to see every primitive in
every state, and to flip theme, scheme and the accessibility toggles.

---

## 1. Theming model

Theme state lives in [lib/theme-context.tsx](../lib/theme-context.tsx) and is expressed as **data attributes on `<html>`**:

| Attribute | Values |
|---|---|
| `data-theme` | `light` \| `dark` |
| `data-color-scheme` | `blue` \| `purple` \| `green` \| `orange` \| `cyan` |
| `data-timer-size` | `sm` \| `md` \| `lg` \| `xl` |
| `data-timer-font` | `mono` \| `sans` \| `statement` |
| `data-reduce-motion` | `"true"` (absent when off) |
| `data-disable-glow` | `"true"` (absent when off) |
| `data-high-contrast` | `"true"` (absent when off) |

> **There is no `.dark` class.** Never write a `dark:` Tailwind variant — it
> silently does nothing. Theme-conditional CSS is written as
> `[data-theme="dark"] .your-class { … }` in `globals.css`.

The user's mode preference is `light` / `dark` / `auto`; `auto` resolves via
`prefers-color-scheme` and subscribes to changes. `useTheme()` exposes
`effectiveTheme` as the resolved `"light" | "dark"`.

**Persistence is dual:** `localStorage["cubedev-theme-preferences"]` and Convex
(`api.users.updateThemeSettings`). The DB wins on load. A blocking inline script
in [app/layout.tsx](../app/layout.tsx) applies **every** attribute above before
hydration to prevent a flash — if you add a new theme attribute, add it there too.

For canvas-based charts (chart.js, recharts) that cannot read CSS variables, use
[`useThemeColors()`](../lib/hooks/useThemeColors.ts), which reads the resolved
values and re-reads them when the theme or scheme changes. `useEffectiveTheme()`
is there when you only need `"light" | "dark"`.

## 2. Color tokens

Defined in [app/globals.css](../app/globals.css). Consume them with Tailwind v4
arbitrary-property syntax:

```tsx
className="bg-(--surface) text-(--text-primary) border border-(--border)"
```

### Structural

| Token | Role |
|---|---|
| `--background` | Page background |
| `--background-subtle` | Recessed areas |
| `--foreground` | Base body color |
| `--surface` | Card background — the `.timer-card` fill |
| `--surface-elevated` | Inputs, nested cards, raised surfaces |
| `--border` | Default border |
| `--border-hover` | Border on hover |
| `--scrim` | Behind modals and sheets |
| `--inverse-surface` / `--inverse-text` | Tooltips |
| `--skeleton` | Loading placeholders |

### Brand

`--primary`, `--primary-hover`, `--primary-light`, `--secondary`, `--accent`, `--accent-glow`.

`--primary` is the only color that should express "this is interactive / active / selected".

### Foreground on fills

| Token | Use for |
|---|---|
| `--on-primary` | Text and icons on **any** saturated fill: `--primary`, `--success`, `--warning`, `--error` |
| `--on-media` | Text and icons over a photo, a video or a dark scrim |

Never `text-white`. Both tokens happen to be white today, but they say *why*,
and only one of them will change if a scheme ever needs a dark foreground.

### Text

`--text-primary` · `--text-secondary` · `--text-muted` · `--text-inverse`

### Semantic

`--success` · `--warning` · `--error` · `--info`

Pick by meaning, not by hue: green is not "a nice color for a stat", it means
*good*. A category that has no status meaning uses `--accent`.

### Domain

Timer states: `--timer-inspection` · `--timer-ready` · `--timer-running` · `--timer-stopped`
Penalties: `--penalty-plus2` / `-hover` / `-text` · `--penalty-dnf` / `-hover` / `-text`
Medals: `--medal-gold` · `--medal-silver` · `--medal-bronze` (via [`medal.ts`](../components/ui/medal.ts))
Charts: `--chart-1` … `--chart-6`, derived per scheme

### The five schemes

Listed for reference only — **never hardcode these values.** The one legitimate
exception is [lib/color-schemes.ts](../lib/color-schemes.ts), where the swatches
preview schemes the user has not selected yet.

| Scheme | `--primary` | `--primary-hover` | `--accent` |
|---|---|---|---|
| blue (default) | `#3b82f6` | `#2563eb` | `#06b6d4` |
| purple | `#a855f7` | `#9333ea` | `#d946ef` |
| green | `#10b981` | `#059669` | `#14b8a6` |
| orange | `#f97316` | `#ea580c` | `#fb923c` |
| cyan | `#06b6d4` | `#0891b2` | `#06b6d4` |

Each scheme also retints `--background` / `--background-subtle` / `--surface` /
`--surface-elevated` per theme. In light mode all schemes use `#ffffff` surfaces
and tint only the backgrounds.

`[data-high-contrast="true"]` overrides `--border`, `--border-hover` and
`--text-muted`. Because it works through the same tokens, code that uses tokens
gets high-contrast support for free — and code that hardcodes colors silently
breaks it.

## 3. Typography

Four font utilities, defined in `globals.css`:

| Class | Stack | Use for |
|---|---|---|
| `.font-statement` | Anton / Oswald, uppercase, `letter-spacing: .05em` | **All headings**, card titles, modal titles |
| `.font-inter` | Inter, system-ui | Body text, labels, values, help text |
| `.font-mono` | JetBrains Mono, monospace | Solve times, scrambles, algorithms |
| `.font-button` | Oswald 600 | Button labels where a heavier voice is wanted |

Prefer the **`type-*` utilities** over assembling size + weight + family by hand:

| Utility | Use for |
|---|---|
| `type-display` | Hero copy |
| `type-page-title` | Page `h1` |
| `type-section-title` | Section `h2` |
| `type-card-title` | Card / modal `h3` |
| `type-label` | Field labels — the most common text style in the app |
| `type-body` | Body copy |
| `type-caption` | Metadata, helper text |
| `type-overline` | Small uppercase headers (stat tiles, table headers) |
| `type-time` | Monospace, tabular numerals — times and scrambles |

### Timer numerals

`.timer-text` is monospace with `line-height: 1` and scales on **both**
`data-timer-size` and viewport:

| `data-timer-size` | base | ≥640 | ≥768 | ≥1024 |
|---|---|---|---|---|
| `sm` | 2.5rem | 3rem | 3.5rem | 4rem |
| `md` | 4rem | 4.5rem | 5rem | 6rem |
| `lg` (default) | 6rem | 6.5rem | 7rem | 8rem |
| `xl` | 8rem | 9rem | 10rem | 12rem |

> Debt (see [Rules.md](./Rules.md) §16): Geist is loaded via `next/font` but no
> CSS consumes it, and JetBrains Mono is named in CSS but never actually loaded —
> `.font-mono` falls back to the system monospace. Don't add a fourth font;
> fixing the loading is the correct future change.

## 4. Shape, elevation and layers

Radius is a token, never a raw Tailwind utility. The ratio is the identity: a
1rem card holding 0.5rem controls, like stickers on a cube face.

| Token | Value | Use for |
|---|---|---|
| `--radius-badge` | .375rem | Badges, small chips |
| `--radius-control` | .5rem | Buttons, inputs, menu items |
| `--radius-panel` | .75rem | Nested cards, menus, popovers, toasts |
| `--radius-card` | 1rem | Cards, dialogs |
| `--radius-sheet` | 1.25rem | Top corners of a mobile sheet |

Use `rounded-full` for pills, avatars and the switch.

**Control sizes:** `--control-sm` 2rem · `--control-md` 2.5rem · `--control-lg` 3rem.
`--touch-min` (2.75rem) is applied under `@media (pointer: coarse)` so touch
targets grow without bloating the desktop layout.

**Elevation:** `--shadow-card`, `--shadow-card-hover`, `--shadow-control`,
`--shadow-popover`, `--shadow-overlay`, defined once per theme and all zeroed by
`[data-disable-glow]`.

**Layers** — nothing outside this table may set its own z-index above 20
(`z-0`/`z-10`/`z-20` for stacking *within* a component is fine):

| Token | Value | For |
|---|---|---|
| `--z-sticky` | 30 | Sticky headers, floating buttons |
| `--z-drawer` | 40 | Mobile navigation drawer |
| `--z-dropdown` | 50 | Anchored menus and popovers |
| `--z-overlay` | 100 | Scrims |
| `--z-modal` | 110 | Dialogs and sheets |
| `--z-nested` | 120 | A dialog opened from a dialog; the lightbox |
| `--z-toast` | 130 | Toasts |
| `--z-tour` | 140 | Product tours |

## 5. The component library

Everything is exported from [`components/ui`](../components/ui/index.ts). Reach
for these before writing markup; if something is missing, add it here rather
than inline.

### Actions

| Component | Notes |
|---|---|
| `Button` | `primary \| secondary \| subtle \| ghost \| danger \| success \| warning`, `sm \| md \| lg`, `loading` + `loadingText`, `iconLeft/Right`, `fullWidth`. `success`/`warning` are only for actions that *are* the status (the OK / +2 / DNF row) |
| `ButtonLink` | Same styling over a Next `Link` |
| `buttonClasses()` | For the rare `<a>` that must stay an anchor |
| `IconButton` | Requires `aria-label`; grows to a 44px hit area on coarse pointers |

### Forms

`Field` (label, required marker, hint, error wired through `aria-describedby`
and `aria-invalid`) wrapping `Input`, `Textarea`, `Select`, `SearchInput`,
`Checkbox` or `Slider`. `Switch` / `SwitchRow` for on-off settings — never a
`<div>` with a click handler. `SettingRow` and `OptionTiles` for settings
screens.

### Selection

`SegmentedControl` (2–5 short options, arrow keys move and select) ·
`Tabs` (underline, `role="tablist"`, scrolls rather than wraps on mobile) ·
`SelectMenu` (rich single-select with optional search; becomes a sheet on
mobile) · `Stepper` (wizard progress) · `Pagination`.

### Surfaces

`Card` (`default` = `.timer-card` with the hover-to-primary border, plus
`nested`, `static`, `interactive`, `selected`), `CardHeader`, `CardIcon`,
`CollapsibleCard` (+ `useCollapsed` to remember the state per viewer),
`StatTile`, `Badge`, `TimeValue`, `Table`.

### States

`Spinner` / `LoadingState` · `Skeleton` and friends · `EmptyState` ·
`ErrorState` · `Alert` (persistent, tied to a region) · `useToast()` (transient;
also the replacement for `alert()`) · `Tooltip` (hover **and** focus, never the
only carrier of information).

### Navigation

`PageHeader` (statement title, description, `back`, `breadcrumbs`, `actions`) ·
`Breadcrumbs` (a real `<nav aria-label="Breadcrumb">`, collapsing to one back
link below `sm`) · `BackLink`. Layout chrome comes from
[`AppShell`](../components/layout/AppShell.tsx), shared by CubeLab and admin.

## 6. Overlays

One system, in [`overlay.ts`](../components/ui/overlay.ts): a portal, a
**ref-counted** body scroll lock (so nested overlays don't unlock early), a focus
trap with focus restore, and Escape that closes only the top-most layer.

```tsx
<Modal open={open} onClose={close} size="md" mobile="sheet">
  <Modal.Header title="Edit session" description="Rename or delete" />
  <Modal.Body>…</Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={close}>Cancel</Button>
    <Button onClick={save}>Save</Button>
  </Modal.Footer>
</Modal>
```

**Footer order is fixed:** children are `[secondary, primary]`. On desktop they
sit right-aligned in that order; on mobile they stack full-width with the
primary on top. `start` holds left-aligned extras (a step counter, a destructive
"Delete").

**Pick `mobile` by content**, not by habit:

| `mobile` | For |
|---|---|
| `sheet` | Compact forms, settings, confirmations |
| `fullscreen` | Dense content and wizards (session stats, imports, onboarding) |
| `dialog` | Tours and anything that must stay small |

Other overlays: `ConfirmDeleteModal` / `ConfirmDialog` (+ `useConfirmDelete`) ·
`BottomSheet` · `Menu` (actions) · `Popover` (anchored non-menu content) ·
`ShareMenu` (the single share UI; brand marks are the only allowlisted literal
colors) · `Lightbox` (full-screen media).

If a submit button sits in `Modal.Footer` while the form is in `Modal.Body`,
give the form an `id` and point the button at it with `form={id}`.

## 7. Layout & spacing

Mobile-first. The breakpoints in use are Tailwind's `sm` 640 · `md` 768 ·
`lg` 1024 · `xl` 1280.

- Page padding: `p-4 sm:p-6 lg:p-8`. Card padding: `p-4` → `sm:p-6`.
- Gaps: stay on 1, 2, 3, 4, 6, 8. Section rhythm is `space-y-4 sm:space-y-6`.
- Dialog padding is `--dialog-pad`.
- Touch targets are at least 44px on coarse pointers; the primitives handle this.
- A table either scrolls sideways (`Table.Scroll`) or is replaced by stacked
  cards below `md`. Never ship a squeezed table.
- Anything that can hold a long name needs `min-w-0` and `truncate`.

## 8. Icons

`lucide-react` only, sized `w-3.5`/`w-4`/`w-5` to match adjacent text. Decorative
icons get `aria-hidden`; an icon that *is* the label needs an `aria-label` on its
control. `EventIcon` renders WCA event icons. Inline `<svg>` is allowed only for
third-party brand marks, which lucide does not carry.

## 9. Motion

| Token | Value | For |
|---|---|---|
| `--duration-fast` | 120ms | Hover, focus |
| `--duration-base` | 200ms | Dialogs, menus, toggles |
| `--duration-slow` | 300ms | Sheets, collapses |

Easing: `--ease-out`, `--ease-emphasized`. Keyframes: `dialog-in`, `sheet-in`,
`menu-in`, `toast-in`, `scrim-in`.

Animate `transform` and `opacity`. `[data-reduce-motion="true"]` disables
animation globally — check it rather than assuming the OS setting, because the
in-app toggle is independent of it.

## 10. Verification checklist

Before calling a UI change done:

1. `npx tsc --noEmit`
2. `npm run test` — includes the design-system guardrail
3. `/design-system`: light **and** dark × all five schemes
4. 375 / 768 / 1440 — no horizontal scroll, no squeezed table
5. Keyboard only: Tab reaches everything, focus is visible, Escape closes the
   top overlay, focus returns to the trigger
6. `data-reduce-motion`, `data-high-contrast`, `data-disable-glow`
7. The timer's spacebar must not fire while a dialog is open

## 11. Enforcement

[tests/unit/design-system.test.ts](../tests/unit/design-system.test.ts) scans
`app/`, `components/` and `lib/` and fails on: palette colors, `dark:` variants,
gradients, literal white/black text, hex in markup, ad-hoc `fixed inset-0`
overlays, hand-rolled spinners and switches, `alert()`, unstyled form controls,
z-index outside the layer tokens, and raw radius utilities.

Each rule carries the fix in its failure message. Exemptions live next to the
rule **with a reason**, and a further test fails when an exemption is no longer
needed — so the allow lists cannot quietly grow. If you are about to add one,
the answer is almost always to use the primitive instead.

## 12. Known gaps

- **Cubie** (`components/cubie/`, `app/cube-lab/cubie/`) has not been migrated;
  it is listed in the guardrail as not-yet-migrated rather than exempted rule by
  rule. Migrating it is the next piece of this work.
- Admin modal **headers** keep bespoke markup where they show avatars, rather
  than `Modal.Header`.
- `tests/setup/api.ts` and two Convex test fixtures have pre-existing type
  errors that block `npm run build`; they are test-only and predate this work.
