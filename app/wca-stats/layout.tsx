import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WCA Stats | CubeDev",
  description:
    "Explore WCA statistics including Birthdays, Kinch Ranks, Sum of Ranks, and Record Streaks. Look up any competitor by their WCA ID.",
  openGraph: {
    title: "WCA Stats | CubeDev",
    description:
      "Explore WCA statistics including Birthdays, Kinch Ranks, Sum of Ranks, and Record Streaks.",
    type: "website",
  },
};

export default function WCAStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
