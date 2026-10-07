import type { ColorScheme } from "@/lib/theme-context";

/**
 * Swatch values for the scheme picker. These literals exist only so a user can
 * preview a scheme they have not selected yet; everything else in the UI must
 * read `--primary` and friends. Keep in sync with the scheme blocks in
 * app/globals.css.
 */
export const COLOR_SCHEMES: {
  value: ColorScheme;
  label: string;
  swatch: string;
}[] = [
  { value: "blue", label: "Blue", swatch: "#3b82f6" },
  { value: "purple", label: "Purple", swatch: "#a855f7" },
  { value: "green", label: "Green", swatch: "#10b981" },
  { value: "orange", label: "Orange", swatch: "#f97316" },
  { value: "cyan", label: "Cyan", swatch: "#06b6d4" },
];
