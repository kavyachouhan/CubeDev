"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HelpCenter from "@/components/faq/HelpCenter";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <div className="container-responsive py-8 max-w-5xl">
        <HelpCenter />
      </div>
      <Footer />
    </div>
  );
}