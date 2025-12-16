import { Metadata } from "next";

type Props = {
  params: Promise<{ setSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setSlug } = await params;

  // Convert setSlug to uppercase for display
  const setName = setSlug.toUpperCase();

  return {
    title: `${setName} Algorithms`,
    description: `Learn and master ${setName} speedcubing algorithms with spaced repetition, 3D visualization, and progress tracking.`,
    openGraph: {
      title: `${setName} Algorithms | CubeDev`,
      description: `Master ${setName} speedcubing algorithms with interactive training tools.`,
      url: `https://cubedev.xyz/cube-lab/algorithm-trainer/sets/${setSlug}`,
      siteName: "CubeDev",
      type: "website",
    },
  };
}

export default function SetDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}