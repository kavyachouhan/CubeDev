import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Algorithm Trainer | CubeDev",
    default: "Algorithm Sets | Algorithm Trainer | CubeDev",
  },
  description:
    "Browse and learn speedcubing algorithm sets including PLL, OLL, COLL, F2L, and more. View cases, track progress, and master each algorithm.",
  keywords: [
    "PLL algorithms",
    "OLL algorithms",
    "COLL algorithms",
    "F2L algorithms",
    "algorithm sets",
    "speedcubing algorithms",
    "CFOP method",
  ],
  openGraph: {
    title: "Algorithm Sets | CubeDev",
    description:
      "Browse and learn speedcubing algorithm sets including PLL, OLL, COLL, and more.",
    url: "https://cubedev.xyz/cube-lab/algorithm-trainer/sets",
    siteName: "CubeDev",
    type: "website",
  },
};

export default function SetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}