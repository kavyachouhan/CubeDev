import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - CubeDev",
  description:
    "Read CubeDev's terms of service, user agreements, and guidelines for using our speedcubing platform.",
  keywords: ["terms", "service", "agreement", "cubing", "speedcubing"],
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}