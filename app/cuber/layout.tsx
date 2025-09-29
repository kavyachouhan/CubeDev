import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cubers Directory | CubeDev",
  description:
    "Complete cuber directory with WCA integration, competition history, and community features to connect with fellow cubers.",
  keywords: [
    "cubers directory",
    "WCA integration",
    "competition history",
    "cubing community",
    "cubedev",
  ],
  openGraph: {
    title: "Cubers Directory | CubeDev",
    description:
      "Complete cuber directory with WCA integration, competition history, and community features to connect with fellow cubers.",
    type: "website",
    url: "https://cubedev.xyz/cuber",
    siteName: "CubeDev",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cubers Directory | CubeDev",
    description:
      "Complete cuber directory with WCA integration, competition history, and community features to connect with fellow cubers.",  
  },
};

export default function CuberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}