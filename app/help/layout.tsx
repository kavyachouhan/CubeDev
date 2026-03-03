import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center - CubeDev | FAQs, Guides & How-To Articles",
  description:
    "Find answers to your questions about CubeDev. Step-by-step guides for the timer, statistics, algorithm trainer, coaching, challenges, and more.",
  keywords: [
    "cubedev help",
    "speedcubing help",
    "cube timer guide",
    "algorithm trainer help",
    "cubedev faq",
    "how to use cubedev",
    "cubing tips",
    "speedcubing tools",
  ],
  openGraph: {
    title: "Help Center - CubeDev",
    description:
      "Find answers and step-by-step guides for all CubeDev features.",
    type: "website",
    url: "https://cubedev.xyz/help",
  },
  alternates: {
    canonical: "https://cubedev.xyz/help",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}