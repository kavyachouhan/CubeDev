import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;

  const formattedName = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${formattedName} - Help Center | CubeDev`,
    description: `Browse help articles and guides about ${formattedName} on CubeDev. Find step-by-step instructions and tips.`,
    openGraph: {
      title: `${formattedName} - Help Center | CubeDev`,
      description: `Browse help articles and guides about ${formattedName} on CubeDev.`,
      type: "website",
      url: `https://cubedev.xyz/help/${categorySlug}`,
    },
    alternates: {
      canonical: `https://cubedev.xyz/help/${categorySlug}`,
    },
  };
}

export default function HelpCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}