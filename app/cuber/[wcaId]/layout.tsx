import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

interface CuberLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    wcaId: string;
  }>;
}

export default async function CuberLayout({
  children,
  params,
}: CuberLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wcaId: string }>;
}): Promise<Metadata> {
  const { wcaId } = await params;
  const wcaIdUpper = wcaId.toUpperCase();

  return {
    title: `${wcaIdUpper} - Cuber Profile | CubeDev`,
    description: `View ${wcaIdUpper}'s speedcubing profile, WCA records, and cubing statistics on CubeDev.`,
    keywords: [
      "speedcubing",
      "cuber profile",
      wcaIdUpper,
      "WCA records",
      "cubing statistics",
      "speedsolving",
    ],
    openGraph: {
      title: `${wcaIdUpper} - Cuber Profile`,
      description: `View ${wcaIdUpper}'s speedcubing profile and statistics`,
      type: "profile",
      url: `https://cubedev.xyz/cuber/${wcaId}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${wcaIdUpper} - Cuber Profile`,
      description: `View ${wcaIdUpper}'s speedcubing profile and statistics`,
    },
  };
}