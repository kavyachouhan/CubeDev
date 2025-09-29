import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credits & Acknowledgments - CubeDev",
  description:
    "Acknowledgments and credits for the open-source tools and libraries that make CubeDev possible.",
  keywords: [
    "cubing",
    "speedcubing",
    "credits",
    "open source",
    "acknowledgments",
    "WCA",
  ],
};

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}