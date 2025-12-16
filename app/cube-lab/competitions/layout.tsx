import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competition Simulator | Cube Lab | CubeDev",
  description:
    "Practice like you compete. Browse WCA competitions, simulate events with realistic timing and pressure training, and track your simulated results.",
  keywords: [
    "WCA competition",
    "competition simulator",
    "speedcubing practice",
    "competition training",
    "pressure training",
    "WCA events",
    "cube competition",
    "simulation",
    "cube lab",
    "cubedev",
  ],
  openGraph: {
    title: "Competition Simulator | Cube Lab | CubeDev",
    description:
      "Practice like you compete. Browse WCA competitions, simulate events with realistic timing and pressure training.",
    type: "website",
    url: "https://cubedev.xyz/cube-lab/competitions",
    siteName: "CubeDev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Competition Simulator | Cube Lab | CubeDev",
    description:
      "Practice like you compete. Browse WCA competitions and simulate events with realistic pressure training.",
  },
};

export default function CompetitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}