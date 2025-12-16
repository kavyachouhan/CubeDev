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

      return {
        title: `Configure Simulation | ${competitionName} | CubeDev`,
        description: `Configure your simulation settings for ${competitionName}. Select events and customize atmosphere settings.`,
        robots: {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        },
      };
    }
  } catch (error) {
    console.error("Failed to fetch competition metadata:", error);
  }

  return {
    title: "Configure Simulation | Competition Simulator | CubeDev",
    description: "Configure your competition simulation settings.",
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default function SimulateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}