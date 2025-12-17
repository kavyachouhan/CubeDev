import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algorithm Trainer | Cube Lab | CubeDev",
  description:
    "Master speedcubing algorithms with spaced repetition, 3D visualization, and recognition training. Learn algorithms for 3x3, 2x2, and more puzzles with optimal review scheduling.",
  keywords: [
    "speedcubing",
    "algorithms",
    "PLL",
    "OLL",
    "CFOP",
    "CLL",
    "EG-1",
    "EG-2",
    "2x2",
    "3x3",
    "algorithm trainer",
    "spaced repetition",
    "recognition training",
    "3D cube visualization",
  ],
  openGraph: {
    title: "Algorithm Trainer | CubeDev",
    description:
      "Master speedcubing algorithms with spaced repetition, 3D visualization, and recognition training for all puzzle types.",
    url: "https://cubedev.xyz/cube-lab/algorithm-trainer",
    siteName: "CubeDev",
    type: "website",
  },
};

export default function AlgorithmTrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
