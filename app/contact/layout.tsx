import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact CubeDev - Get in Touch",
  description:
    "Contact the CubeDev team with questions, feedback, or suggestions. We'd love to hear from you.",
  keywords: ["contact", "cubing", "speedcubing", "feedback", "support"],
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}