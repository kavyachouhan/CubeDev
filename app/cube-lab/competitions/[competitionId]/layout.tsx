import { Metadata } from "next";
import { WCA_CONFIG } from "@/lib/wca-config";

interface Props {
  params: Promise<{ competitionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitionId } = await params;

  try {
    const response = await fetch(
      `${WCA_CONFIG.API_BASE_URL}/competitions/${competitionId}`,
      { next: { revalidate: 3600 } }
    );

    if (response.ok) {
      const competition = await response.json();
      const competitionName = competition.name || competitionId;
      const location = `${competition.city}, ${competition.country_iso2}`;
      const dateRange =
        competition.start_date === competition.end_date
          ? competition.start_date
          : `${competition.start_date} - ${competition.end_date}`;

      return {
        title: `${competitionName} | Competition Simulator | CubeDev`,
        description: `Simulate ${competitionName} (${location}, ${dateRange}). Practice with realistic WCA competition atmosphere and pressure training.`,
        openGraph: {
          title: `${competitionName} | Competition Simulator | CubeDev`,
          description: `Simulate ${competitionName} with realistic WCA competition atmosphere.`,
          type: "website",
          url: `https://cubedev.xyz/cube-lab/competitions/${competitionId}`,
          siteName: "CubeDev",
        },
        twitter: {
          card: "summary_large_image",
          title: `${competitionName} | Competition Simulator | CubeDev`,
          description: `Simulate ${competitionName} with realistic WCA competition atmosphere.`,
        },
      };
    }
  } catch (error) {
    console.error("Failed to fetch competition metadata:", error);
  }

  return {
    title: "Competition Details | Competition Simulator | CubeDev",
    description:
      "View competition details and start a realistic WCA competition simulation.",
  };
}

export default function CompetitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}