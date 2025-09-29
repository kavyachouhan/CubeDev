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

  return <CuberProfile wcaId={wcaId} />;
}