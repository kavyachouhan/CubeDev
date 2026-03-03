"use client";

import { ChevronRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { getIconComponent } from "./HelpCenter";

interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  helpfulYes?: number;
  helpfulNo?: number;
  category: {
    name: string;
    slug: string;
    icon: string;
  } | null;
}

interface FAQSearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  onArticleClick?: (slug: string) => void;
}

export default function FAQSearchResults({
  results,
  query,
  isLoading,
}: FAQSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-(--primary) animate-spin" />
        <span className="ml-2 text-(--text-secondary) font-inter">
          Searching...
        </span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="timer-card text-center py-12">
        <Search className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-(--text-primary) mb-2 font-statement">
          No results found
        </h3>
        <p className="text-sm text-(--text-secondary) font-inter">
          No articles match &ldquo;{query}&rdquo;. Try different keywords or
          browse by topic.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-muted) font-inter">
        {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;
        {query}&rdquo;
      </p>
      <div className="space-y-3">
        {results.map((article) => {
          const IconComp = article.category
            ? getIconComponent(article.category.icon)
            : Search;
          const helpfulYes = article.helpfulYes || 0;
          return (
            <Link
              key={article._id}
              href={`/help/${article.category?.slug || "article"}/${article.slug}`}
              className="timer-card block text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-(--primary)/10 rounded-lg shrink-0">
                    <IconComp className="w-4 h-4 text-(--primary)" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors font-statement">
                      {article.title}
                    </h3>
                    <p className="text-sm text-(--text-muted) mt-1 line-clamp-2 font-inter">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {article.category && (
                        <span className="text-xs text-(--primary) font-inter">
                          {article.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}