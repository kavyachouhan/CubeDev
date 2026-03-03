import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WCAStatsPage from "@/components/WCAStatsPage";

export default function WCAStats() {
  return (
    <div className="min-h-screen bg-(--background) flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-screen bg-(--background) flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-(--primary) border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <WCAStatsPage />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
