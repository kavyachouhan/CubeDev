import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const metadata = {
  title: "Design system · CubeDev",
  robots: { index: false, follow: false },
};

/**
 * The gallery is a development and review surface, not a product page, so it
 * does not exist in production builds.
 */
export default function DesignSystemLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
