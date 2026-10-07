import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WCAStatsPage from "@/components/WCAStatsPage";
import { LoadingState } from "@/components/ui/Spinner";

export default function WCAStats() {
  return (
    <div className="min-h-screen bg-(--background) flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-screen bg-(--background) flex items-center justify-center">
            <LoadingState label="Loading WCA stats…" />
          </div>
        }>
          <WCAStatsPage />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
