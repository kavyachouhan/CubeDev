# CubeDev — Design System

> The visual language. Every rule here is enforceable and anchored to real code.
> Last verified against commit `ed01603`.

Related: [PRD.md](./PRD.md) · [Architecture.md](./Architecture.md) · [Rules.md](./Rules.md)

---

## 0. The rules, up front

| Rule | Why |
|---|---|
| **Compose from existing components and classes.** Don't restyle from scratch | One system, not thirty variations. §4, §5 |
| **No gradients.** No `bg-gradient-*`, no `linear-gradient()` | Surfaces are flat `--surface` / `--surface-elevated` |
| **No emojis.** `lucide-react` icons only | §8. Existing emojis are legacy one-offs |
| **Responsive by default.** Mobile-first, every breakpoint checked | §7 |
| **Tokens only for color.** Never a raw hex, never a Tailwind palette color like `bg-blue-600` | §2 — a hardcoded color breaks four of the five schemes |
| **The timer page is the reference layout** | §7 |
| **`.timer-card` is the surface primitive** | §4 |
| **`EditRoomModal` is the modal pattern** | §6 |
| **Works in light + dark × all 5 color schemes** | §1, §10 |

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

> **There is no `.dark` class.** Never write a `dark:` Tailwind variant — it will not work. Theme-conditional CSS is written as `[data-theme="dark"] .your-class { … }` in `globals.css`.

The user's mode preference is `light` / `dark` / `auto`; `auto` resolves via `prefers-color-scheme` and subscribes to changes. `useTheme()` exposes `effectiveTheme` as the resolved `"light" | "dark"`.

**Persistence is dual:** `localStorage["cubedev-theme-preferences"]` and Convex (`api.users.updateThemeSettings`). The DB wins on load. A blocking inline script in [app/layout.tsx](../app/layout.tsx) applies the attributes before hydration to prevent a flash — if you add a new theme attribute, add it there too.

Settings UI lives in [components/settings/](../components/settings/): `ThemeModeSelector`, `ColorSchemeSelector`, `TimerCustomization`, `CubeViewSelector`, `AccessibilitySettings`.

## 2. Color tokens

Defined in [app/globals.css](../app/globals.css). Consume them with Tailwind v4 arbitrary-property syntax:

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

### Brand

`--primary`, `--primary-hover`, `--primary-light`, `--secondary`, `--accent`, `--accent-glow`.

`--primary` is the only color that should express "this is interactive / active / selected".

### Text

`--text-primary` · `--text-secondary` · `--text-muted` · `--text-inverse`

### Semantic

`--success` · `--warning` · `--error` · `--info`

### Domain

Timer states: `--timer-inspection` · `--timer-ready` · `--timer-running` · `--timer-stopped`
Penalties: `--penalty-plus2` / `-hover` / `-text` · `--penalty-dnf` / `-hover` / `-text`

### The five schemes

Listed for reference only — **never hardcode these values.**

| Scheme | `--primary` | `--primary-hover` | `--accent` |
|---|---|---|---|
| blue (default) | `#3b82f6` | `#2563eb` | `#06b6d4` |
| purple | `#a855f7` | `#9333ea` | `#d946ef` |
| green | `#10b981` | `#059669` | `#14b8a6` |
| orange | `#f97316` | `#ea580c` | `#fb923c` |
| cyan | `#06b6d4` | `#0891b2` | `#06b6d4` |

Each scheme also retints `--background` / `--background-subtle` / `--surface` / `--surface-elevated` per theme. In light mode all schemes use `#ffffff` surfaces and tint only the backgrounds.

`[data-high-contrast="true"]` overrides `--border`, `--border-hover`, and `--text-muted`. Because it works through the same tokens, code that uses tokens gets high-contrast support for free — and code that hardcodes colors silently breaks it.

## 3. Typography

Four utility classes, defined in `globals.css`:

| Class | Stack | Use for |
|---|---|---|
| `.font-statement` | Anton / Oswald, uppercase, `letter-spacing: .05em` | **All headings** (`h1`–`h3`), card titles, modal titles |
| `.font-inter` | Inter, system-ui | Body text, labels, values, help text |
| `.font-mono` | JetBrains Mono, monospace | Solve times, scrambles, algorithms |
| `.font-button` | Oswald 600 | Button labels where a heavier voice is wanted |

Inter is already the `body` default, but the codebase states `.font-inter` explicitly on text elements. Match that.

### Scale in use

| Style | Used for |
|---|---|
| `text-2xl font-bold` | Page / section headings |
| `text-xl font-bold` | Modal titles |
| `text-lg font-semibold` \| `text-lg font-bold` | Card titles (`h3`) |
| `text-sm font-medium` | Labels — the single most common text style in the app |
| `text-xs font-medium` / `font-semibold` | Metadata, badges, helper text |
| `text-3xl`+ | Landing/hero only |

### Timer numerals

`.timer-text` is monospace with `line-height: 1` and scales on **both** `data-timer-size` and viewport:

| `data-timer-size` | base | ≥640 | ≥768 | ≥1024 |
|---|---|---|---|---|
| `sm` | 2.5rem | 3rem | 3.5rem | 4rem |
| `md` | 4rem | 4.5rem | 5rem | 6rem |
| `lg` (default) | 6rem | 6.5rem | 7rem | 8rem |
| `xl` | 8rem | 9rem | 10rem | 12rem |

> Debt (see [Rules.md](./Rules.md) §16): Geist is loaded via `next/font` but no CSS consumes it, and JetBrains Mono is named in CSS but never actually loaded — `.font-mono` falls back to the system monospace. Don't add a fourth font; fixing the loading is the correct future change.

## 4. The card

`.timer-card` is **the** surface primitive for the entire app — it is used in over 150 files, well beyond the timer.

```css
.timer-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 1rem;              /* 1.5rem @640, 2rem @768 */
  transition: all 0.3s ease;
}
.timer-card:hover { border-color: var(--primary); }
```

Shadows are theme-conditional and already handled — dark gets a deep shadow plus `backdrop-filter: blur(16px)`, light gets a subtle one. **Do not add your own `shadow-*` class to a card.**

### Canonical collapsible card header

Repeated near-identically in `TimerDisplay.tsx`, `ScrambleDisplay.tsx`, `EventSelector.tsx`, `SessionManager.tsx`. Copy this shape:

```tsx
<div className="timer-card">
  <div className="flex items-center justify-between mb-4">
    <button
      onClick={() => setShowBody(!showBody)}
      className="flex items-center gap-1 p-2 text-(--text-muted) hover:text-(--primary) rounded transition-colors"
      title={showBody ? "Hide" : "Show"}
    >
      <h3 className="text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
        Title
      </h3>
      {showBody ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
    <div className="flex items-center gap-2">
      {/* action icons, w-4 h-4 */}
    </div>
  </div>
  <div
    className="overflow-hidden transition-all duration-300 ease-in-out"
    style={{ height: showBody ? "auto" : "0", opacity: showBody ? 1 : 0 }}
  >
    {/* body */}
  </div>
</div>
```

### Nested card

A card inside a card uses the elevated surface and a flat `p-4`:

```tsx
<div className="timer-card bg-(--surface-elevated) p-4 border border-(--border)">
```

### Skeletons

Loading placeholders reuse the same shell: `<div className="timer-card animate-pulse">` with `.skeleton-box` children. See [components/timer/TimerSkeletons.tsx](../components/timer/TimerSkeletons.tsx). A skeleton must match the real layout so nothing jumps.

## 5. Buttons & inputs

### Buttons

```tsx
<button className="btn-primary">Save</button>
<button className="btn-secondary">Cancel</button>
```

`.btn-primary` — `--primary` fill, white text, 600 weight, `0.75rem 1.5rem`, `rounded 0.5rem`, hover lifts `translateY(-1px)` to `--primary-hover`.
`.btn-secondary` — transparent with a `--border` outline; hover fills with `--primary`.

Disabled state is always: `disabled:opacity-50 disabled:cursor-not-allowed`.

### Inputs

There is no `Input` component and no `.input` class yet — this exact class string is the convention (from `EditRoomModal`):

```tsx
<label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
  Room Title
</label>
<input
  className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
  required
  maxLength={100}
/>
```

Textareas add `resize-none` and `rows={n}`. If you are writing the third instance of this in a new feature, extract a component instead.

## 6. Modals

[components/challenges/EditRoomModal.tsx](../components/challenges/EditRoomModal.tsx) is the canonical structure: overlay → `.timer-card` container → header (title + close) → body → footer button row. It returns `null` when closed.

```tsx
if (!isOpen) return null;

return (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-(--text-primary) font-statement">
          Edit Challenge Room
        </h2>
        <button
          onClick={onClose}
          className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* fields — §5 */}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
```

**Widths:** `max-w-md` (default, simple forms) · `max-w-lg` · `max-w-2xl` (dense content). Always with `w-full max-h-[90vh] overflow-y-auto`.

**Props shape:** `{ isOpen: boolean; onClose: () => void; … }`, with an `isSubmitting` guard on the submit handler.

### Required additions for every new modal

`EditRoomModal` shows the layout, not the accessibility. New modals must **also** include what [components/timer/TimerGettingStartedModal.tsx](../components/timer/TimerGettingStartedModal.tsx) does:

```tsx
useEffect(() => {
  if (!isOpen) return;
  const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
  document.addEventListener("keydown", handleEscape);
  document.body.style.overflow = "hidden";
  return () => {
    document.removeEventListener("keydown", handleEscape);
    document.body.style.overflow = "";
  };
}, [isOpen, onClose]);
```

Plus, on the markup:

- `role="dialog"` and `aria-modal="true"` on the container
- `aria-label` on the close button (e.g. `aria-label="Close edit room"`)
- `animate-fade-in` on the container
- A visible error state — `EditRoomModal` only `console.error`s its failure, which violates [Rules.md](./Rules.md) §9

### Bottom sheets

For action menus on mobile, use [components/ui/ActionBottomSheet.tsx](../components/ui/ActionBottomSheet.tsx) rather than building another modal. It renders a sheet below `sm` and an anchored menu above it.

## 7. Layout & spacing

**The timer page is the reference layout.** From [components/CubeLabTimer.tsx](../components/CubeLabTimer.tsx):

```tsx
<div className="container-responsive py-4 md:py-8">
  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
    <div className="xl:col-span-2 space-y-4 md:space-y-6">
      {/* primary column */}
    </div>
    <div className="xl:col-span-2 space-y-4 md:space-y-6 order-last xl:order-0">
      {/* secondary column */}
    </div>
  </div>
</div>
```

Note `order-last xl:order-0`: on mobile the secondary column drops below; on desktop it sits alongside. Do the same rather than hiding content on small screens.

| Pattern | Use |
|---|---|
| `.container-responsive` | Page wrapper. Handles padding (1 → 1.5 → 2rem) and max-widths (640/768/1024/1280) |
| `.stats-grid` | Metric card grids. Auto-fit 300px, then 2 col @768, 3 @1024, 4 @1536 |
| `space-y-4 md:space-y-6` | Vertical rhythm between cards |
| `gap-3` / `gap-4 md:gap-6` | Button rows / grid gaps |
| `py-4 md:py-8` | Page vertical padding |

**Radii:** `rounded-lg` is the default (buttons, inputs, small surfaces). `rounded-full` for pills, avatars, and badges. Cards get `1rem` from `.timer-card` — don't override it.

**Focus mode** is a real primitive: panels that should recede during a solve get `blur-md opacity-50 pointer-events-none` with `transition-all duration-500 ease-in-out`.

## 8. Icons

- **`lucide-react` only.** No other icon library, no inline SVG, no emoji.
- Sizes: `w-5 h-5` for modal close and primary actions; `w-4 h-4` for inline card-header controls and list items.
- Color via text tokens: `text-(--text-muted) hover:text-(--primary)`.
- Icon-only buttons need an `aria-label`.

> The ~11 emojis currently in the UI (`🧩`, `👋`, `💡`) and the `✓` / `✗` text glyphs in `PenaltyButtons`, `RoomTimer`, and `RecognitionFlashCard` are legacy one-offs listed as debt in [Rules.md](./Rules.md) §16. Use `Check` and `X` from lucide instead — they size and color consistently.

## 9. Motion

| Utility | Effect |
|---|---|
| `.animate-fade-in` | 0.6s opacity + 20px rise. Modals, panels entering |
| `.animate-slide-up` | 0.3s translateY. Bottom sheets |
| `.animate-pulse-glow` | 2s glow pulse. Attention only, used sparingly |
| `.animate-float` | 6s idle bob. Decorative/landing only |
| `transition-colors` | Hover on text and icons |
| `transition-all duration-300 ease-in-out` | Collapsible panels |

Accessibility is handled at the CSS level and must not be bypassed:

- `[data-reduce-motion="true"]` and `@media (prefers-reduced-motion: reduce)` both clamp all animations and transitions to `0.01ms`. Don't use inline `style` animations that escape this.
- `[data-disable-glow="true"]` strips `box-shadow` from `.neon-glow`, `.animate-pulse-glow`, and `.timer-card:hover`. Any new glow effect must be reachable by that selector.

## 10. Verification checklist

A UI change is not done until all of these pass:

- [ ] **Light mode** × blue, purple, green, orange, cyan
- [ ] **Dark mode** × blue, purple, green, orange, cyan
- [ ] Mobile (375px), tablet (768px), desktop (1440px) — no horizontal scroll, nothing clipped, nothing hidden
- [ ] `data-reduce-motion="true"` — nothing animates, nothing breaks
- [ ] `data-high-contrast="true"` — borders and muted text remain legible
- [ ] `data-disable-glow="true"` — no stray shadows
- [ ] Keyboard-only: every control reachable, focus visible, Escape closes modals
- [ ] Loading, error, and empty states all render correctly
- [ ] No raw hex, no Tailwind palette color, no gradient, no emoji

## 11. Known visual gaps

Existing violations. Recognize them as debt; don't copy them.

| Gap | Location |
|---|---|
| `.sidebar-nav-item.active` hardcodes a blue shadow — wrong in the other four schemes | `globals.css` |
| `ShareBottomSheet` hardcodes Tailwind palette brand colors (`bg-blue-600`, `bg-green-500`) | [components/ui/ShareBottomSheet.tsx](../components/ui/ShareBottomSheet.tsx) — arguably justified for third-party brand marks |
| `.prose-chat code/pre` use `rgba(var(--surface), 0.5)`, which is invalid — `--surface` is a hex string, so the background silently fails | `globals.css` |
| `.font-inter` is defined twice | `globals.css` |
| No token layer for radii, spacing, or shadows — all literal, and shadows are duplicated per `[data-theme]` on every class | `globals.css` |
| Input styling is a ~10-class string copy-pasted across every form | See §5 |
| Modal a11y is inconsistent — only ~4 of ~30 modals set `role="dialog"` or handle Escape | See §6 |
