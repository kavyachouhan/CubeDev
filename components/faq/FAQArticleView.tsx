"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  BookOpen,
  Clock,
  Eye,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { getIconComponent } from "./HelpCenter";
import { HelpArticleSkeleton } from "@/components/SkeletonLoaders";

interface FAQArticleViewCallbackProps {
  slug: string;
  categorySlug?: string;
  onBack: () => void;
  onBackToCategory: (categoryId: Id<"faqCategories">) => void;
  onArticleClick: (slug: string) => void;
}

interface FAQArticleViewSlugProps {
  slug: string;
  categorySlug: string;
  onBack?: never;
  onBackToCategory?: never;
  onArticleClick?: never;
}

type FAQArticleViewProps =
  | FAQArticleViewCallbackProps
  | FAQArticleViewSlugProps;

export default function FAQArticleView(props: FAQArticleViewProps) {
  const { slug, categorySlug } = props;
  const isSlugMode = !props.onBack;

  const article = useQuery(api.faq.getArticleBySlug, { slug });
  const incrementView = useMutation(api.faq.incrementViewCount);
  const submitFeedback = useMutation(api.faq.submitHelpfulFeedback);

  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Track view count when article loads
  useEffect(() => {
    if (article && !hasTrackedView) {
      incrementView({ articleId: article._id });
      setHasTrackedView(true);
    }
  }, [article, hasTrackedView, incrementView]);

  // Reset feedback state when switching articles
  useEffect(() => {
    setFeedbackGiven(null);
    setHasTrackedView(false);
  }, [slug]);

  const handleFeedback = async (helpful: boolean) => {
    if (!article || feedbackGiven !== null) return;
    setFeedbackGiven(helpful);
    await submitFeedback({ articleId: article._id, helpful });
  };

  // Fetch related articles in the same category, excluding the current article
  const relatedArticles = useQuery(
    api.faq.getArticlesByCategory,
    article ? { categoryId: article.categoryId } : "skip",
  );

  const otherArticles = relatedArticles
    ?.filter((a) => a._id !== article?._id)
    .slice(0, 3);

  if (article === undefined) {
    return <HelpArticleSkeleton />;
  }

  if (article === null) {
    return (
      <div className="space-y-6">
        {isSlugMode ? (
          <Link
            href="/help"
            className="flex items-center gap-2 text-(--text-secondary) hover:text-(--primary) transition-colors font-inter text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
        ) : (
          <button
            onClick={props.onBack}
            className="flex items-center gap-2 text-(--text-secondary) hover:text-(--primary) transition-colors font-inter text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </button>
        )}
        <div className="timer-card text-center py-12">
          <BookOpen className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-(--text-primary) mb-2 font-statement">
            Article Not Found
          </h2>
          <p className="text-(--text-secondary) font-inter">
            This article may have been moved or deleted.
          </p>
        </div>
      </div>
    );
  }

  const IconComp = article.category
    ? getIconComponent(article.category.icon)
    : BookOpen;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-inter flex-wrap">
        {isSlugMode ? (
          <Link
            href="/help"
            className="text-(--text-secondary) hover:text-(--primary) transition-colors"
          >
            Help Center
          </Link>
        ) : (
          <button
            onClick={props.onBack}
            className="text-(--text-secondary) hover:text-(--primary) transition-colors"
          >
            Help Center
          </button>
        )}
        <ChevronRight className="w-3 h-3 text-(--text-muted)" />
        {article.category && (
          <>
            {isSlugMode ? (
              <Link
                href={`/help/${article.category.slug}`}
                className="text-(--text-secondary) hover:text-(--primary) transition-colors"
              >
                {article.category.name}
              </Link>
            ) : (
              <button
                onClick={() => props.onBackToCategory!(article.categoryId)}
                className="text-(--text-secondary) hover:text-(--primary) transition-colors"
              >
                {article.category.name}
              </button>
            )}
            <ChevronRight className="w-3 h-3 text-(--text-muted)" />
          </>
        )}
        <span className="text-(--text-primary) font-medium truncate max-w-[200px] sm:max-w-none">
          {article.title}
        </span>
      </div>

      {/* Article */}
      <article className="timer-card space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {article.category && (
              <div className="p-2 bg-(--primary)/10 rounded-lg">
                <IconComp className="w-5 h-5 text-(--primary)" />
              </div>
            )}
            <div>
              {article.category && (
                <span className="text-xs text-(--primary) font-inter font-medium">
                  {article.category.name}
                </span>
              )}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-(--text-primary) font-statement">
            {article.title}
          </h1>
          <p className="text-base text-(--text-secondary) font-inter leading-relaxed">
            {article.summary}
          </p>
          <div className="flex items-center gap-4 text-xs text-(--text-muted) font-inter flex-wrap">
            {article.viewCount !== undefined && article.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {article.viewCount} views
              </span>
            )}
            {(article.helpfulYes || 0) > 0 && (
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                {article.helpfulYes} found helpful
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(article.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-(--border)" />

        {/* Content */}
        <div className="prose-content text-(--text-secondary) font-inter leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
          {article.content}
        </div>

        {/* Step-by-step guide */}
        {article.steps && article.steps.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-(--text-primary) font-statement">
              Step-by-Step Guide
            </h2>
            <div className="space-y-4">
              {article.steps
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((step, index) => (
                  <div key={index} className="relative pl-10 sm:pl-12">
                    {/* Step number circle */}
                    <div className="absolute left-0 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--primary) flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-bold text-white font-statement">
                        {step.stepNumber}
                      </span>
                    </div>

                    {/* Connecting line */}
                    {index < article.steps!.length - 1 && (
                      <div className="absolute left-3.5 sm:left-4 top-8 bottom-0 w-px bg-(--border) -mb-4" />
                    )}

                    <div className="space-y-2 pb-4">
                      <h3 className="text-base font-semibold text-(--text-primary) font-statement">
                        {step.title}
                      </h3>
                      <p className="text-sm text-(--text-secondary) font-inter leading-relaxed">
                        {step.description}
                      </p>

                      {/* Step Screenshot */}
                      {step.imageUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-(--border) w-fit max-w-full">
                          <img
                            src={step.imageUrl}
                            alt={step.imageAlt || `Step ${step.stepNumber}`}
                            className="max-w-full sm:max-w-xl block"
                            loading="lazy"
                          />
                          {step.imageAlt && (
                            <p className="text-xs text-(--text-muted) p-2 bg-(--surface-elevated) font-inter">
                              {step.imageAlt}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {/* Completion indicator */}
              <div className="pl-10 sm:pl-12 relative">
                <div className="absolute left-0 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-(--success) flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-(--success) font-inter pt-1">
                  Done! You&apos;re all set.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-(--border)" />

        {/* Helpful feedback */}
        <div className="text-center space-y-3">
          <p className="text-sm text-(--text-secondary) font-inter">
            Was this article helpful?
          </p>
          {feedbackGiven !== null ? (
            <p className="text-sm text-(--primary) font-inter font-medium">
              Thanks for your feedback!
            </p>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-2 px-4 py-2 bg-(--surface-elevated) hover:bg-(--success)/10 border border-(--border) hover:border-(--success) rounded-lg text-sm text-(--text-secondary) hover:text-(--success) transition-all font-inter"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-2 px-4 py-2 bg-(--surface-elevated) hover:bg-(--error)/10 border border-(--border) hover:border-(--error) rounded-lg text-sm text-(--text-secondary) hover:text-(--error) transition-all font-inter"
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Related Articles */}
      {otherArticles && otherArticles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-(--text-primary) font-statement">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherArticles.map((related) =>
              isSlugMode ? (
                <Link
                  key={related._id}
                  href={`/help/${categorySlug || article.category?.slug || ""}/${related.slug}`}
                  className="timer-card block text-left group cursor-pointer"
                >
                  <h3 className="text-sm font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors line-clamp-2 font-statement">
                    {related.title}
                  </h3>
                  <p className="text-xs text-(--text-muted) mt-1 line-clamp-2 font-inter">
                    {related.summary}
                  </p>
                </Link>
              ) : (
                <button
                  key={related._id}
                  onClick={() => props.onArticleClick!(related.slug)}
                  className="timer-card text-left group cursor-pointer"
                >
                  <h3 className="text-sm font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors line-clamp-2 font-statement">
                    {related.title}
                  </h3>
                  <p className="text-xs text-(--text-muted) mt-1 line-clamp-2 font-inter">
                    {related.summary}
                  </p>
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}