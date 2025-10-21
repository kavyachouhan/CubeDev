import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | CubeDev",
  description:
    "Manage your CubeDev account settings, preferences, privacy options, and customize your speedcubing experience.",
  keywords: [
    "cubedev settings",
    "account settings",
    "user preferences",
    "privacy settings",
    "profile settings",
    "theme customization",
    "cubing profile",
    "account management",
  ],
  robots: "noindex, nofollow", // Prevent indexing of settings pages
  openGraph: {
    title: "Settings | CubeDev",
    description:
      "Manage your CubeDev account settings and customize your speedcubing experience.",
    type: "website",
    url: "https://cubedev.xyz/me",
    siteName: "CubeDev",
  },
  twitter: {
    card: "summary",
    title: "Settings | CubeDev",
    description:
      "Manage your CubeDev account settings and customize your speedcubing experience.",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}