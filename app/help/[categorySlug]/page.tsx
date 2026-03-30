"use client";

import { use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQCategoryView from "@/components/faq/FAQCategoryView";

export default function HelpCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = use(params);

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <div className="container-responsive py-8 max-w-5xl">
        <FAQCategoryView categorySlug={categorySlug} />
      </div>
      <Footer />
    </div>
  );
}