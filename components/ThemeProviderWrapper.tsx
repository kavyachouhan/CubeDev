"use client";

import { ThemeProvider } from "@/lib/theme-context";
import { useUser } from "./UserProvider";

export function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();

  return <ThemeProvider userId={user?.convexId}>{children}</ThemeProvider>;
}