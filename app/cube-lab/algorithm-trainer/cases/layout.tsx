import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Algorithm Trainer | CubeDev",
    default: "Algorithm Case | Algorithm Trainer | CubeDev",
  },
  description:
    "Learn and practice individual speedcubing algorithm cases with 3D visualization, multiple algorithm options, and progress tracking.",
  keywords: [
    "algorithm case",
    "3D cube visualization",
    "algorithm learning",
    "speedcubing case",
    "algorithm practice",
    "cube algorithms",
  ],
  openGraph: {
    title: "Algorithm Case | CubeDev",
    description:
      "Learn individual speedcubing cases with 3D visualization and progress tracking.",
    url: "https://cubedev.xyz/cube-lab/algorithm-trainer/cases",
    siteName: "CubeDev",
    type: "website",
  },
};

export default function CasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}