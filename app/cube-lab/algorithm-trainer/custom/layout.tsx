import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Algorithm Sets | Algorithm Trainer | CubeDev",
  description:
    "Create and manage custom algorithm sets for personalized speedcubing practice. Build focused training collections with your favorite PLL, OLL, and other algorithm cases.",
  keywords: [
    "custom algorithm sets",
    "personalized training",
    "speedcubing practice",
    "algorithm collections",
    "PLL training",
    "OLL training",
    "cubing practice",
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
    title: "Custom Algorithm Sets | CubeDev",
    description:
      "Create and manage custom algorithm sets for personalized speedcubing practice.",
    url: "https://cubedev.xyz/cube-lab/algorithm-trainer/custom",
    siteName: "CubeDev",
    type: "website",
  },
};

export default function CustomSetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}