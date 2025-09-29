import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About CubeDev - Built by Cubers, for Speedcubers",
  description:
    "Learn about CubeDev, created by Kavya Chouhan (22CHOU06), a comprehensive speedcubing platform built by cubers for the global speedcubing community.",
  keywords: ["cubing", "speedcubing", "about", "Kavya Chouhan", "WCA", "cuber"],
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}