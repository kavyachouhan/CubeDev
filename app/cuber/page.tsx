import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CuberDirectory from "@/components/CuberDirectory";

export default function CubersPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />
      <main className="flex-1">
        <CuberDirectory />
      </main>
      <Footer />
    </div>
  );
}

export const metadata = {
  title: "Cuber Directory | CubeDev",
  description:
    "Discover speedcubers from around the world. Browse WCA profiles and CubeDev statistics.",
};