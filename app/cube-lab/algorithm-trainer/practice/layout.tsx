import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Session | Algorithm Trainer | CubeDev",
  description:
    "Practice speedcubing algorithms with spaced repetition, drill mode, and recognition training. Improve your algorithm recognition and execution speed.",
  keywords: [
    "algorithm practice",
    "spaced repetition",
    "recognition training",
    "execution practice",
    "speedcubing drills",
    "algorithm memory",
    "cubing practice session",
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
    title: "Practice Session | CubeDev",
    description:
      "Practice speedcubing algorithms with spaced repetition and recognition training.",
    url: "https://cubedev.xyz/cube-lab/algorithm-trainer/practice",
    siteName: "CubeDev",
    type: "website",
  },
};

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}