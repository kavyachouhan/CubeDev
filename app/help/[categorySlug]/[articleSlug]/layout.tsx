import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; articleSlug: string }>;
}): Promise<Metadata> {
  const { categorySlug, articleSlug } = await params;

  const formattedTitle = articleSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const formattedCategory = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${formattedTitle} - ${formattedCategory} | CubeDev Help`,
    description: `Learn about ${formattedTitle}. Step-by-step guide and tips in the ${formattedCategory} section of CubeDev Help Center.`,
    openGraph: {
      title: `${formattedTitle} - CubeDev Help`,
      description: `Learn about ${formattedTitle}. Step-by-step guide and tips on CubeDev.`,
      type: "article",
      url: `https://cubedev.xyz/help/${categorySlug}/${articleSlug}`,
    },
    alternates: {
      canonical: `https://cubedev.xyz/help/${categorySlug}/${articleSlug}`,
    },
  };
}

export default function HelpArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}