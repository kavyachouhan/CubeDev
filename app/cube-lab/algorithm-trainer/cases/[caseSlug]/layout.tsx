import { Metadata } from "next";

type Props = {
  params: Promise<{ caseSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caseSlug } = await params;

  // Convert caseSlug from kebab-case to Title Case for display
  const caseName = caseSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: caseName,
    description: `Learn the ${caseName} algorithm with 3D visualization, multiple algorithm options, and spaced repetition practice.`,
    openGraph: {
      title: `${caseName} | Algorithm Trainer | CubeDev`,
      description: `Master the ${caseName} algorithm with interactive 3D visualization.`,
      url: `https://cubedev.xyz/cube-lab/algorithm-trainer/cases/${caseSlug}`,
      siteName: "CubeDev",
      type: "website",
    },
  };
}

export default function CaseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}