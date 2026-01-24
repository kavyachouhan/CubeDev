import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coach | CubeDev - Personalized Training",
  description:
    "Get personalized training plans and track your cubing progress with CubeDev's intelligent coaching system.",
  openGraph: {
    title: "Coach | CubeDev - Personalized Training",
    description:
      "Get personalized training plans and track your cubing progress with CubeDev's intelligent coaching system.",
    type: "website",
  },
};

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
