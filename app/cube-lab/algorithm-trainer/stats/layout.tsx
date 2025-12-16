import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics | Algorithm Trainer | CubeDev",
  description:
    "Track your algorithm learning progress with detailed statistics. View recognition times, mastery levels, practice history, and performance benchmarks.",
  keywords: [
    "algorithm statistics",
    "recognition analytics",
    "learning progress",
    "mastery tracking",
    "practice history",
    "speedcubing analytics",
    "performance benchmarks",
  ],
  robots: {
    index: false,
    follow: true,
    nocache: false,
    googleBot: {
      index: false,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Algorithm Statistics | CubeDev",
    description:
      "Track your algorithm learning progress with detailed statistics and analytics.",
    url: "https://cubedev.xyz/cube-lab/algorithm-trainer/stats",
    siteName: "CubeDev",
    type: "website",
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}