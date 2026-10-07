/**
 * Joins class names, skipping falsy values. Deliberately tiny: there is no
 * conflict resolution, so a component's variant classes and a caller's
 * `className` must not fight over the same property. Prefer passing
 * layout-only classes (margin, width, grid placement) through `className`.
 */
export type ClassValue = string | false | null | undefined | 0;

export function cx(...classes: ClassValue[]): string {
  let out = "";
  for (const c of classes) {
    if (c) out = out ? `${out} ${c}` : c;
  }
  return out;
}
