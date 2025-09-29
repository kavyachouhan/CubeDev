import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Challenges | Cube Lab | CubeDev",
  description:
    "Compete with other cubers in real-time challenge rooms. Create or join speed solving competitions with custom scrambles and formats.",
  keywords: [
    "speedcubing challenges",
    "cube competitions",
    "solve challenges",
    "cubing rooms",
    "speedcubing battles",
    "online cubing competition",
    "rubik's cube challenges",
    "ao5 ao12 competition",
    "speedsolving challenges",
  ],
  openGraph: {
    title: "Challenges | CubeDev",
    description:
      "Compete with other cubers in real-time challenge rooms. Create or join speed solving competitions with custom scrambles and formats.",
    type: "website",
    url: "https://cubedev.xyz/cube-lab/challenges",
    siteName: "CubeDev",
    images: [
      {
        url: "/og-challenges.png",
        width: 1200,
        height: 630,
        alt: "CubeDev Challenges - Compete with other cubers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Challenges | CubeDev",
    description:
      "Compete with other cubers in real-time challenge rooms. Create or join speed solving competitions.",
    images: ["/og-challenges.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ChallengesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}