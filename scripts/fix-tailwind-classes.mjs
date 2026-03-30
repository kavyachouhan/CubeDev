#!/usr/bin/env node

/**
 * Fix Tailwind CSS v4 canonical class names across the codebase.
 *
 * Replacements performed:
 *   1. [var(--xxx)]  →  (--xxx)      e.g. text-[var(--primary)] → text-(--primary)
 *   2. flex-shrink-0 →  shrink-0
 *   3. break-words   →  wrap-break-word   (word-break utility renamed in v4)
 *
 * Usage:
 *   node scripts/fix-tailwind-classes.mjs            # dry-run (default)
 *   node scripts/fix-tailwind-classes.mjs --write     # apply changes
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

// ── Config ──────────────────────────────────────────────────────────
const ROOT = new URL("..", import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  "$1",
); // handle Windows drive letters
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".css"];
const IGNORE_DIRS = ["node_modules", ".next", ".git", "dist", ".convex"];

const DRY_RUN = !process.argv.includes("--write");

// ── Replacement rules ───────────────────────────────────────────────
const rules = [
  {
    name: "[var(--*)] → (--*)",
    // Matches things like  text-[var(--text-muted)]  or  hover:bg-[var(--primary)]/10
    pattern: /\[var\((--[\w-]+)\)\]/g,
    replace: "($1)",
  },
  {
    name: "flex-shrink-0 → shrink-0",
    // Only match when it appears as a standalone class (bounded by whitespace, quotes, backticks, or template boundaries)
    pattern: /(?<=[\s"'`{])flex-shrink-0(?=[\s"'`}/])/g,
    replace: "shrink-0",
  },
  {
    name: "break-words → wrap-break-word",
    pattern: /(?<=[\s"'`{])break-words(?=[\s"'`}/])/g,
    replace: "wrap-break-word",
  },
];

// ── Helpers ─────────────────────────────────────────────────────────
async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) yield* walk(full);
    } else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      yield full;
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────
let totalFiles = 0;
let totalReplacements = 0;
const summary = {};

for await (const filePath of walk(ROOT)) {
  const original = await readFile(filePath, "utf-8");
  let content = original;
  let fileReplacements = 0;

  for (const rule of rules) {
    const matches = content.match(rule.pattern);
    if (matches) {
      fileReplacements += matches.length;
      if (!summary[rule.name]) summary[rule.name] = 0;
      summary[rule.name] += matches.length;
      content = content.replace(rule.pattern, rule.replace);
    }
  }

  if (fileReplacements > 0) {
    const rel = relative(ROOT, filePath);
    console.log(
      `  ${DRY_RUN ? "[dry-run] " : ""}${rel}  (${fileReplacements} replacement${fileReplacements > 1 ? "s" : ""})`,
    );
    totalFiles++;
    totalReplacements += fileReplacements;

    if (!DRY_RUN) {
      await writeFile(filePath, content, "utf-8");
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────
console.log("\n─── Summary ───");
for (const [rule, count] of Object.entries(summary)) {
  console.log(`  ${rule}: ${count}`);
}
console.log(`\n  Files affected : ${totalFiles}`);
console.log(`  Total replacements: ${totalReplacements}`);
if (DRY_RUN) {
  console.log(
    "\n  ⚡ Dry run — no files were modified. Re-run with --write to apply changes.",
  );
} else {
  console.log("\n  ✅ All changes written to disk.");
}
