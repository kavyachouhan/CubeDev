"use client";

import { useTheme } from "./theme-context";

export function useLogo() {
  const { colorScheme } = useTheme();

  // Map color schemes to logo filenames
  const logoMap: Record<string, string> = {
    blue: "/cubedev_logo.png",
    purple: "/cubedev_logo_purple.png",
    green: "/cubedev_logo_green.png",
    orange: "/cubedev_logo_orange.png",
    cyan: "/cubedev_logo_cyan.png",
  };

  return logoMap[colorScheme] || logoMap.blue;
}