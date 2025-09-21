import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timer | Cube Lab | CubeDev",
  description:
    "Advanced speedcubing timer with analytics and performance tracking in Cube Lab. Track your solves, analyze your progress, and improve your speedcubing skills.",
  keywords: [
    "speedcubing timer",
    "cube timer",
    "rubik's cube timer",
    "speedcube timer",
    "cube lab",
    "cubedev",
    "solve tracking",
    "speedcubing analytics",
    "timer with statistics",
    "cubing performance",
  ],
  openGraph: {
    title: "Timer | Cube Lab | CubeDev",
    description:
      "Advanced speedcubing timer with analytics and performance tracking in Cube Lab.",
    type: "website",
    url: "https://cubedev.xyz/cube-lab/timer",
    siteName: "CubeDev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Timer | Cube Lab | CubeDev",
    description:
      "Advanced speedcubing timer with analytics and performance tracking in Cube Lab.",
  },
};

export default function TimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}