import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenge Room | CubeDev",
  description:
    "Participate in real-time speedcubing challenges with other cubers. Solve scrambles, track your progress, and compete for the best times.",
  keywords: [
    "speedcubing room",
    "cube challenge room",
    "live competition",
    "speedsolving room",
    "cubing battle",
    "real-time competition",
    "rubik's cube room",
    "speedcubing battle",
    "online cube competition",
  ],
  openGraph: {
    title: "Challenge Room | CubeDev",
    description:
      "Participate in real-time speedcubing challenges with other cubers. Solve scrambles, track your progress, and compete for the best times.",
    type: "website",
    url: "https://cubedev.xyz/cube-lab/challenges/room",
    siteName: "CubeDev",
  },
  twitter: {
    card: "summary",
    title: "Challenge Room | CubeDev",
    description:
      "Participate in real-time speedcubing challenges with other cubers.",
  },
  robots: {
    index: false, // Don't index individual rooms by default
    follow: false,
  },
};

export default function ChallengeRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}