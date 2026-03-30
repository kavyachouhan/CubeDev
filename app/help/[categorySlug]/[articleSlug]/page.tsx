"use client";

import { use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQArticleView from "@/components/faq/FAQArticleView";

export default function HelpArticlePage({
  params,
}: {
  params: Promise<{ categorySlug: string; articleSlug: string }>;
}) {
  const { categorySlug, articleSlug } = use(params);

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <div className="container-responsive py-8 max-w-5xl">
        <FAQArticleView slug={articleSlug} categorySlug={categorySlug} />
      </div>
      <Footer />
    </div>
  );
}