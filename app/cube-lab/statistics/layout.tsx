import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics | Cube Lab | CubeDev",
  description:
    "Detailed statistics and insights for your cube solving sessions in Cube Lab. Track your progress, analyze your performance, and improve your speedcubing skills.",
  keywords: [
    "cube statistics",
    "speedcubing analytics",
    "solve tracking",
    "cubing performance",
    "cube lab",
    "cubedev",
    "personal bests",
    "improvement trends",
    "session statistics",
    "time distribution",
    "heatmap",
    "average progress",
  ],
  openGraph: {
    title: "Statistics | Cube Lab | CubeDev",
    description:
      "Detailed statistics and insights for your cube solving sessions in Cube Lab. Track your progress, analyze your performance, and improve your speedcubing skills.",
    type: "website",
    url: "https://cubedev.xyz/cube-lab/statistics",
    siteName: "CubeDev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Statistics | Cube Lab | CubeDev",
    description:
      "Detailed statistics and insights for your cube solving sessions in Cube Lab. Track your progress, analyze your performance, and improve your speedcubing skills.",
  },
};

export default function TimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}