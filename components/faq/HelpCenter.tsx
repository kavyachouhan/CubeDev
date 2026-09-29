"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Search,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Timer,
  BarChart3,
  GraduationCap,
  Compass,
  Trophy,
  Settings,
  User,
  Globe,
  Zap,
  Shield,
  MessageSquare,
  Play,
  ThumbsUp,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CardIcon } from "@/components/ui/Card";
import { cardClasses } from "@/components/ui/card-styles";
import { SearchInput } from "@/components/ui/Field";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import FAQSearchResults from "./FAQSearchResults";
import { HelpCenterSkeleton } from "@/components/SkeletonLoaders";

// Map of icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Timer,
  BarChart3,
  GraduationCap,
  Compass,
  Trophy,
  Settings,
  User,
  Globe,
  Zap,
  Shield,
  MessageSquare,
  Play,
  BookOpen,
  HelpCircle,
};

export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || HelpCircle;
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useQuery(api.faq.getPublishedCategories);
  const featuredArticles = useQuery(api.faq.getFeaturedArticles);
  const searchResults = useQuery(
    api.faq.searchArticles,
    searchQuery.trim().length >= 2 ? { query: searchQuery.trim() } : "skip",
  );

  const isSearching = searchQuery.trim().length >= 2;

  // Show skeleton if we're still loading categories and featured articles (main home page)
  if (categories === undefined && featuredArticles === undefined) {
    return <HelpCenterSkeleton />;
  }

  // Main help center home
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-(--text-primary) font-statement">
          Help <span className="text-(--primary)">Center</span>
        </h1>
        <p className="text-base sm:text-lg text-(--text-secondary) max-w-2xl mx-auto font-inter">
          Find answers, step-by-step guides, and tips to get the most out of
          CubeDev.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <SearchInput
          size="lg"
          placeholder="Search for help articles…"
          aria-label="Search help articles"
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Search Results */}
      {isSearching ? (
        <FAQSearchResults
          results={searchResults || []}
          query={searchQuery}
          isLoading={searchResults === undefined}
        />
      ) : (
        <>
          {/* Featured Articles */}
          {featuredArticles && featuredArticles.length > 0 && (
            <div className="space-y-4">
              <h2 className="type-section-title">Popular Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredArticles.map((article) => {
                  const IconComp = article.category
                    ? getIconComponent(article.category.icon)
                    : HelpCircle;
                  const helpfulYes = article.helpfulYes || 0;
                  return (
                    <Link
                      key={article._id}
                      href={`/help/${article.category?.slug || "article"}/${article.slug}`}
                      className={cardClasses({
                        variant: "interactive",
                        className: "group flex h-full items-start gap-3 text-left",
                      })}
                    >
                      <CardIcon>
                        <IconComp />
                      </CardIcon>
                      <div className="min-w-0 flex-1">
                        <h3 className="type-label line-clamp-2 group-hover:text-(--primary) transition-colors">
                          {article.title}
                        </h3>
                        <p className="type-caption mt-1 line-clamp-2">
                          {article.summary}
                        </p>
                        {article.category && (
                          <Badge tone="primary" className="mt-2">
                            {article.category.name}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight
                        aria-hidden
                        className="w-4 h-4 mt-0.5 shrink-0 text-(--text-muted) group-hover:text-(--primary) transition-colors"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="space-y-4">
            <h2 className="type-section-title">Browse by Topic</h2>
            {categories === undefined ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="timer-card animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 skeleton-box rounded-(--radius-control)" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 skeleton-box rounded w-2/3" />
                        <div className="h-3 skeleton-box rounded w-full" />
                        <div className="h-3 skeleton-box rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="timer-card text-center py-12">
                <BookOpen className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
                <p className="text-(--text-secondary) font-inter">
                  Help articles are coming soon. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const IconComp = getIconComponent(category.icon);
                  return (
                    <Link
                      key={category._id}
                      href={`/help/${category.slug}`}
                      className="timer-card block text-left group cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-(--primary)/10 rounded-(--radius-control) shrink-0">
                          <IconComp className="w-5 h-5 text-(--primary)" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors font-statement">
                            {category.name}
                          </h3>
                          <p className="text-sm text-(--text-muted) mt-1 line-clamp-2 font-inter">
                            {category.description}
                          </p>
                          <span className="inline-block mt-2 text-xs text-(--text-secondary) font-inter">
                            {category.articleCount || 0}{" "}
                            {(category.articleCount || 0) === 1
                              ? "article"
                              : "articles"}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0 mt-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div className="timer-card text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-(--primary) mx-auto" />
            <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
              Can&apos;t find what you&apos;re looking for?
            </h3>
            <p className="text-sm text-(--text-secondary) font-inter max-w-md mx-auto">
              Reach out to us and we&apos;ll help you get back on track.
            </p>
            <ButtonLink
              href="/contact"
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Contact us
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}
