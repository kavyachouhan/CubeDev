"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { getIconComponent } from "./HelpCenter";
import { HelpCategorySkeleton } from "@/components/SkeletonLoaders";

interface FAQCategoryViewByIdProps {
  categoryId: Id<"faqCategories">;
  categorySlug?: never;
  onBack: () => void;
  onArticleClick: (slug: string) => void;
}

interface FAQCategoryViewBySlugProps {
  categorySlug: string;
  categoryId?: never;
  onBack?: never;
  onArticleClick?: never;
}

type FAQCategoryViewProps =
  | FAQCategoryViewByIdProps
  | FAQCategoryViewBySlugProps;

export default function FAQCategoryView(props: FAQCategoryViewProps) {
  const isSlugMode = "categorySlug" in props && !!props.categorySlug;

  const categoryBySlug = useQuery(
    api.faq.getCategoryBySlug,
    isSlugMode ? { slug: props.categorySlug! } : "skip",
  );

  const resolvedCategoryId = isSlugMode
    ? categoryBySlug?._id
    : props.categoryId;

  const articles = useQuery(
    api.faq.getArticlesByCategory,
    resolvedCategoryId ? { categoryId: resolvedCategoryId } : "skip",
  );

  const allCategories = useQuery(
    api.faq.getPublishedCategories,
    !isSlugMode ? undefined : "skip",
  );

  const currentCategory = isSlugMode
    ? categoryBySlug
    : allCategories?.find((c) => c._id === props.categoryId);

  const categorySlug = isSlugMode
    ? props.categorySlug
    : currentCategory?.slug || "";

  const IconComp = currentCategory
    ? getIconComponent(currentCategory.icon)
    : BookOpen;

  // Show loading skeleton if in slug mode and category is not found yet
  if (isSlugMode && categoryBySlug === undefined) {
    return <HelpCategorySkeleton />;
  }

  const handleBack = () => {
    if (!isSlugMode && props.onBack) {
      props.onBack();
    }
  };

  const handleArticleClick = (articleSlug: string) => {
    if (!isSlugMode && props.onArticleClick) {
      props.onArticleClick(articleSlug);
    }
  };

  const BackElement = isSlugMode ? (
    <Link
      href="/help"
      className="flex items-center gap-2 text-(--text-secondary) hover:text-(--primary) transition-colors font-inter text-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Help Center
    </Link>
  ) : (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 text-(--text-secondary) hover:text-(--primary) transition-colors font-inter text-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Help Center
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {BackElement}

      {/* Category Header */}
      {currentCategory ? (
        <div className="flex items-center gap-4">
          <div className="p-3 bg-(--primary)/10 rounded-xl">
            <IconComp className="w-6 h-6 text-(--primary)" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-(--text-primary) font-statement">
              {currentCategory.name}
            </h1>
            <p className="text-sm text-(--text-secondary) mt-1 font-inter">
              {currentCategory.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 skeleton-box rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 skeleton-box rounded w-48" />
            <div className="h-4 skeleton-box rounded w-72" />
          </div>
        </div>
      )}

      {/* Articles List */}
      {articles === undefined ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="timer-card animate-pulse">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-5 skeleton-box rounded w-3/4" />
                  <div className="h-4 skeleton-box rounded w-full" />
                  <div className="h-3 skeleton-box rounded w-24" />
                </div>
                <div className="w-5 h-5 skeleton-box rounded shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="timer-card text-center py-12">
          <BookOpen className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
          <p className="text-(--text-secondary) font-inter">
            No articles in this category yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const helpfulYes = article.helpfulYes || 0;
            const helpfulNo = article.helpfulNo || 0;
            const totalFeedback = helpfulYes + helpfulNo;
            const helpfulPct =
              totalFeedback > 0
                ? Math.round((helpfulYes / totalFeedback) * 100)
                : null;

            const articleContent = (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors font-statement">
                    {article.title}
                  </h3>
                  <p className="text-sm text-(--text-muted) mt-1 line-clamp-2 font-inter">
                    {article.summary}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {article.steps && article.steps.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-(--primary) font-inter">
                        {article.steps.length} step
                        {article.steps.length !== 1 ? "s" : ""} guide
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0" />
              </div>
            );

            return isSlugMode ? (
              <Link
                key={article._id}
                href={`/help/${categorySlug}/${article.slug}`}
                className="timer-card block text-left group cursor-pointer"
              >
                {articleContent}
              </Link>
            ) : (
              <button
                key={article._id}
                onClick={() => handleArticleClick(article.slug)}
                className="timer-card w-full text-left group cursor-pointer"
              >
                {articleContent}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}