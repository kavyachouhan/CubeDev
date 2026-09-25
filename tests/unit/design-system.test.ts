import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the design system against regressions. Every rule here is one the
 * migration already satisfies, so a failure means new code reintroduced a
 * pattern the system replaced — not that the rule needs relaxing. If a rule is
 * genuinely wrong for a new case, add that file to the rule's `allow` list with
 * a reason, rather than deleting the rule.
 */

const ROOT = path.resolve(__dirname, "../..");
const SCAN_DIRS = ["app", "components", "lib"];

/**
 * Cubie (the chat assistant) was deliberately left out of the design-system
 * migration, so it would fail most rules. Remove these entries when it is
 * migrated — do not add new paths here to silence a failure.
 */
const NOT_YET_MIGRATED = ["components/cubie/", "app/cube-lab/cubie/"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const FILES = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)))
  .map((full) => ({
    /** Repo-relative, forward slashes, so allow lists read the same on Windows. */
    rel: path.relative(ROOT, full).split(path.sep).join("/"),
    source: readFileSync(full, "utf8"),
  }))
  .filter(({ rel }) => !NOT_YET_MIGRATED.some((dir) => rel.startsWith(dir)));

interface Rule {
  name: string;
  pattern: RegExp;
  /** Why the pattern is banned and what to use instead. */
  fix: string;
  /** Files exempt from the rule, each with the reason it is exempt. */
  allow?: Record<string, string>;
}

const RULES: Rule[] = [
  {
    name: "Tailwind palette colors",
    pattern:
      /\b(?:bg|text|border|ring|divide|from|via|to|fill|stroke|accent|shadow|outline|decoration|placeholder|caret)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/,
    fix: "use a theme token, e.g. text-(--success) or bg-(--surface-elevated), so all five color schemes and both themes work",
  },
  {
    name: "dark: variants",
    pattern: /\bdark:[a-z[]/,
    fix: "themes are driven by [data-theme] attributes, not a .dark class, so dark: never fires — put the value in the token instead",
  },
  {
    name: "gradients",
    pattern: /\b(?:bg|text|border)-(?:linear|radial|conic)-|\bbg-gradient-to-/,
    fix: "CubeDev surfaces are flat; use a solid token or a tinted overlay",
  },
  {
    name: "literal white/black text",
    pattern: /\btext-(?:white|black)\b/,
    fix: "use --on-primary (on a saturated fill), --on-media (over photos or a scrim) or --text-primary",
  },
  {
    name: "hardcoded hex colors in markup",
    pattern: /className=(?:"[^"]*|\{`[^`]*)#[0-9a-fA-F]{3,8}\b/,
    fix: "use a theme token",
  },
  {
    name: "ad-hoc overlays",
    pattern: /className="[^"]*\bfixed inset-0\b[^"]*"/,
    fix: "use Modal, BottomSheet, Lightbox or Menu — they share the focus trap, the ref-counted scroll lock and Escape handling",
    allow: {
      "components/ui/Lightbox.tsx": "the overlay system itself",
      "components/layout/AppShell.tsx":
        "the mobile drawer scrim, which sits just under the drawer layer",
      "components/AppWalkthrough.tsx":
        "a tour dims the page around a spotlight; it is not a dialog",
      "components/ProductTour.tsx": "same as AppWalkthrough",
      "components/coach/GoalCelebration.tsx":
        "full-screen confetti canvas, pointer-events-none",
    },
  },
  {
    name: "ad-hoc spinners",
    pattern: /\banimate-spin\b/,
    fix: "use Spinner or LoadingState, or put `loading` on a Button",
    allow: {
      "components/ui/Spinner.tsx": "the spinner itself",
      "components/competition/CompetitionBrowser.tsx":
        "spins the RefreshCw icon in place during a background refresh",
      "components/competition/UpcomingCompetitionsSuggestions.tsx":
        "spins the RefreshCw icon in place",
      "components/admin/AdminContact.tsx": "spins the RefreshCw icon in place",
      "components/admin/AdminDashboard.tsx":
        "spins the RefreshCw icon in place",
    },
  },
  {
    name: "browser alert()",
    pattern: /(?<![\w.])alert\(/,
    fix: "use a toast (useToast) or an inline Alert; alert() blocks the page and cannot be styled",
  },
  {
    name: "unstyled form controls",
    pattern:
      /<(?:input|textarea|select)\b(?![^>]*type="(?:checkbox|radio|file|range)")/,
    fix: "use Input, Textarea, Select, SearchInput or Checkbox from components/ui/Field",
    allow: { "components/ui/Field.tsx": "the field primitives themselves" },
  },
  {
    name: "hand-rolled switches",
    pattern: /role="switch"/,
    fix: "use Switch or SwitchRow",
    allow: { "components/ui/Switch.tsx": "the switch itself" },
  },
  {
    // z-0/10/20 stack elements inside one component and are fine. The layer
    // tokens start at 30, so anything from there up is competing with app
    // chrome and must say which layer it means.
    name: "z-index outside the layer tokens",
    pattern: /\bz-(?:\[\d+\]|[3-9]\d|\d{3,})\b/,
    fix: "use a layer token: z-(--z-sticky), z-(--z-drawer), z-(--z-dropdown), z-(--z-overlay), z-(--z-modal), z-(--z-nested), z-(--z-toast), z-(--z-tour)",
  },
  {
    name: "raw Tailwind radius utilities",
    pattern: /\brounded-(?:sm|md|lg|xl|2xl|3xl)\b/,
    fix: "use a radius token: rounded-(--radius-badge|control|panel|card|sheet), or rounded-full",
  },
];

describe("design system", () => {
  it.each(RULES.map((rule) => [rule.name, rule] as const))(
    "has no %s",
    (_name, rule) => {
      const offenders = FILES.filter(
        ({ rel, source }) => !rule.allow?.[rel] && rule.pattern.test(source),
      ).map(({ rel, source }) => {
        const line = source
          .split("\n")
          .findIndex((text) => rule.pattern.test(text));
        return `${rel}:${line + 1}`;
      });

      expect(
        offenders,
        `${offenders.length} file(s) use a banned pattern. Fix: ${rule.fix}.`,
      ).toEqual([]);
    },
  );

  it("keeps the allow lists honest", () => {
    // An allow entry for a file that no longer breaks the rule is stale, and a
    // stale entry hides the next real regression in that file.
    const stale: string[] = [];
    for (const rule of RULES) {
      for (const rel of Object.keys(rule.allow ?? {})) {
        const file = FILES.find((f) => f.rel === rel);
        if (!file) {
          stale.push(`${rule.name}: ${rel} (file no longer exists)`);
        } else if (!rule.pattern.test(file.source)) {
          stale.push(`${rule.name}: ${rel} (no longer needs the exemption)`);
        }
      }
    }
    expect(stale).toEqual([]);
  });
});
