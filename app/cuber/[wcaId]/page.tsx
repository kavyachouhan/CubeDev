import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CuberProfile from "@/components/CuberProfile";

interface CuberProfilePageProps {
  params: Promise<{
    wcaId: string;
  }>;
}

export default async function CuberProfilePage({
  params,
}: CuberProfilePageProps) {
  const { wcaId } = await params;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <main className="flex-1">
        <CuberProfile wcaId={wcaId} />
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata({ params }: CuberProfilePageProps) {
  const { wcaId } = await params;
  const wcaIdUpper = wcaId.toUpperCase();

  return {
    title: `${wcaIdUpper} - Cuber Profile | CubeDev`,
    description: `View ${wcaIdUpper}'s speedcubing profile, WCA records, and cubing statistics on CubeDev.`,
    openGraph: {
      title: `${wcaIdUpper} - Cuber Profile`,
      description: `View ${wcaIdUpper}'s speedcubing profile and statistics`,
      type: "profile",
    },
  };
}