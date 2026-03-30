"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  BookOpen,
  Star,
  ArrowLeft,
  X,
  Loader2,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react";

// ===== Types =====
interface StepData {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  isPublished: boolean;
}

interface ArticleFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  steps: StepData[];
  searchTags: string;
  order: number;
  isPublished: boolean;
  isFeatured: boolean;
}

const ICON_OPTIONS = [
  "Timer",
  "BarChart3",
  "GraduationCap",
  "Compass",
  "Trophy",
  "Settings",
  "User",
  "Globe",
  "Zap",
  "Shield",
  "MessageSquare",
  "Play",
  "BookOpen",
  "HelpCircle",
];

// Utilities
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getHelpfulPercentage(yes: number, no: number): number | null {
  const total = yes + no;
  if (total === 0) return null;
  return Math.round((yes / total) * 100);
}

// Main Component
export default function AdminFAQ() {
  const [view, setView] = useState<"categories" | "articles">("categories");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<Id<"faqCategories"> | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Id<"faqCategories"> | null>(null);
  const [editingArticle, setEditingArticle] =
    useState<Id<"faqArticles"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "article";
    id: string;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useQuery(api.faq.getAllCategories);
  const allArticles = useQuery(api.faq.getAllArticles);
  const selectedCategoryArticles = useQuery(
    api.faq.getAllArticlesByCategory,
    selectedCategoryId ? { categoryId: selectedCategoryId } : "skip",
  );

  const deleteCategory = useMutation(api.faq.deleteCategory);
  const deleteArticle = useMutation(api.faq.deleteArticle);
  const updateCategory = useMutation(api.faq.updateCategory);
  const updateArticle = useMutation(api.faq.updateArticle);

  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === "category") {
        await deleteCategory({
          id: deleteConfirm.id as Id<"faqCategories">,
        });
        if (selectedCategoryId === deleteConfirm.id) {
          setSelectedCategoryId(null);
        }
      } else {
        await deleteArticle({ id: deleteConfirm.id as Id<"faqArticles"> });
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle publish status
  const toggleCategoryPublish = async (
    id: Id<"faqCategories">,
    current: boolean,
  ) => {
    await updateCategory({ id, isPublished: !current });
  };

  const toggleArticlePublish = async (
    id: Id<"faqArticles">,
    current: boolean,
  ) => {
    await updateArticle({ id, isPublished: !current });
  };

  const toggleArticleFeatured = async (
    id: Id<"faqArticles">,
    current: boolean,
  ) => {
    await updateArticle({ id, isFeatured: !current });
  };

  // Get the current category for header
  const currentCategory = selectedCategoryId
    ? categories?.find((c) => c._id === selectedCategoryId)
    : null;

  // Filtered content
  const filteredCategories = categories?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredArticles = (
    selectedCategoryId ? selectedCategoryArticles : allArticles
  )?.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-full p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {selectedCategoryId && (
              <button
                onClick={() => {
                  setSelectedCategoryId(null);
                  setView("categories");
                }}
                className="text-(--text-muted) hover:text-(--primary) transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-(--text-primary) font-statement truncate">
              {selectedCategoryId
                ? `${currentCategory?.name || "Category"} - Articles`
                : "FAQ Management"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-(--text-muted) mt-1 font-inter">
            {selectedCategoryId
              ? "Manage articles in this category"
              : "Manage help center categories and articles"}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!selectedCategoryId && (
            <div className="flex items-center bg-(--surface-elevated) border border-(--border) rounded-lg overflow-hidden">
              <button
                onClick={() => setView("categories")}
                className={`px-3 py-1.5 text-xs font-inter transition-colors ${
                  view === "categories"
                    ? "bg-(--primary) text-white"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setView("articles")}
                className={`px-3 py-1.5 text-xs font-inter transition-colors ${
                  view === "articles"
                    ? "bg-(--primary) text-white"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                All Articles
              </button>
            </div>
          )}
          <button
            onClick={() => {
              if (selectedCategoryId || view === "articles") {
                setEditingArticle(null);
                setShowArticleModal(true);
              } else {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg text-xs font-inter transition-colors whitespace-nowrap ml-auto sm:ml-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {selectedCategoryId || view === "articles"
              ? "New Article"
              : "New Category"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
        <input
          type="text"
          placeholder={`Search ${selectedCategoryId || view === "articles" ? "articles" : "categories"}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:border-(--primary) transition-colors font-inter"
        />
      </div>

      {/* Categories View */}
      {!selectedCategoryId && view === "categories" && (
        <div className="space-y-3">
          {filteredCategories === undefined ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="timer-card animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 skeleton-box rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton-box rounded w-1/3" />
                      <div className="h-3 skeleton-box rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="timer-card text-center py-8">
              <BookOpen className="w-10 h-10 text-(--text-muted) mx-auto mb-3" />
              <p className="text-(--text-secondary) font-inter text-sm">
                {searchQuery
                  ? "No categories match your search"
                  : "No categories yet. Create your first one!"}
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category._id} className="timer-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Clickable area */}
                  <button
                    onClick={() => {
                      setSelectedCategoryId(category._id);
                      setSearchQuery("");
                    }}
                    className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 text-left group"
                  >
                    <div className="p-2 sm:p-2.5 bg-(--primary)/10 rounded-lg shrink-0">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary)" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-(--text-primary) group-hover:text-(--primary) transition-colors font-statement truncate">
                          {category.name}
                        </h3>
                        {!category.isPublished && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-(--warning)/10 text-(--warning) rounded font-inter shrink-0">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-(--text-muted) mt-0.5 line-clamp-1 sm:truncate font-inter">
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-(--text-muted) group-hover:text-(--primary) transition-colors shrink-0 hidden sm:block" />
                  </button>

                  {/* Meta + Actions row */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-11 sm:pl-0">
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-(--text-muted) font-inter flex-wrap">
                      <span className="whitespace-nowrap">
                        {category.publishedArticleCount}/{category.articleCount}{" "}
                        published
                      </span>
                      <span className="hidden xs:inline whitespace-nowrap">
                        Icon: {category.icon}
                      </span>
                      <span className="whitespace-nowrap">
                        #{category.order}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          toggleCategoryPublish(
                            category._id,
                            category.isPublished,
                          )
                        }
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10 transition-colors"
                        title={category.isPublished ? "Unpublish" : "Publish"}
                      >
                        {category.isPublished ? (
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategory(category._id);
                          setShowCategoryModal(true);
                        }}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: "category",
                            id: category._id,
                            name: category.name,
                          })
                        }
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--error) hover:bg-(--error)/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Articles View */}
      {(selectedCategoryId || view === "articles") && (
        <div className="space-y-3">
          {filteredArticles === undefined ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="timer-card animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 skeleton-box rounded w-2/3" />
                    <div className="h-3 skeleton-box rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="timer-card text-center py-8">
              <BookOpen className="w-10 h-10 text-(--text-muted) mx-auto mb-3" />
              <p className="text-(--text-secondary) font-inter text-sm">
                {searchQuery
                  ? "No articles match your search"
                  : "No articles yet. Create your first one!"}
              </p>
            </div>
          ) : (
            filteredArticles.map((article) => {
              const helpfulYes = article.helpfulYes || 0;
              const helpfulNo = article.helpfulNo || 0;
              const totalFeedback = helpfulYes + helpfulNo;
              const helpfulPct = getHelpfulPercentage(helpfulYes, helpfulNo);
              const views = article.viewCount || 0;

              return (
                <div key={article._id} className="timer-card">
                  <div className="flex flex-col gap-3">
                    {/* Title + badges row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-(--text-primary) font-statement line-clamp-2 sm:truncate">
                            {article.title}
                          </h3>
                          {!article.isPublished && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-(--warning)/10 text-(--warning) rounded font-inter shrink-0">
                              Draft
                            </span>
                          )}
                          {article.isFeatured && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-(--primary)/10 text-(--primary) rounded font-inter shrink-0">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-(--text-muted) mt-1 line-clamp-2 sm:line-clamp-1 font-inter">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-(--text-muted) font-inter">
                      {"categoryName" in article && (
                        <span className="px-1.5 py-0.5 bg-(--surface-elevated) rounded border border-(--border)">
                          {article.categoryName as string}
                        </span>
                      )}
                      {article.steps && article.steps.length > 0 && (
                        <span>
                          {article.steps.length} step
                          {article.steps.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {views} view{views !== 1 ? "s" : ""}
                      </span>
                      <span className="whitespace-nowrap">
                        Order: {article.order}
                      </span>

                      {/* Helpful feedback stats */}
                      {totalFeedback > 0 ? (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span
                            className={
                              helpfulPct !== null && helpfulPct >= 70
                                ? "text-green-500"
                                : helpfulPct !== null && helpfulPct < 40
                                  ? "text-(--error)"
                                  : ""
                            }
                          >
                            {helpfulPct}% helpful
                          </span>
                          <span className="text-(--text-muted)">
                            ({helpfulYes}/{totalFeedback} users)
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-(--text-muted)">
                          <ThumbsUp className="w-3 h-3" />
                          No feedback yet
                        </span>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-end gap-1 -mt-1 border-t border-(--border) pt-2 sm:border-0 sm:pt-0 sm:-mt-2">
                      <button
                        onClick={() =>
                          toggleArticleFeatured(
                            article._id,
                            !!article.isFeatured,
                          )
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          article.isFeatured
                            ? "text-(--primary) bg-(--primary)/10"
                            : "text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10"
                        }`}
                        title={article.isFeatured ? "Unfeature" : "Feature"}
                      >
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() =>
                          toggleArticlePublish(article._id, article.isPublished)
                        }
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10 transition-colors"
                        title={article.isPublished ? "Unpublish" : "Publish"}
                      >
                        {article.isPublished ? (
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingArticle(article._id);
                          setShowArticleModal(true);
                        }}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: "article",
                            id: article._id,
                            name: article.title,
                          })
                        }
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--error) hover:bg-(--error)/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          categoryId={editingCategory}
          categories={categories || []}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Article Modal */}
      {showArticleModal && (
        <ArticleModal
          articleId={editingArticle}
          articles={
            selectedCategoryId
              ? selectedCategoryArticles || []
              : allArticles || []
          }
          categories={categories || []}
          defaultCategoryId={selectedCategoryId}
          onClose={() => {
            setShowArticleModal(false);
            setEditingArticle(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-(--error)/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-(--error)" />
                </div>
                <h2 className="text-xl font-bold text-(--text-primary) font-statement">
                  Delete{" "}
                  {deleteConfirm.type === "category" ? "Category" : "Article"}
                </h2>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-(--text-secondary) font-inter">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-(--text-primary)">
                  {deleteConfirm.name}
                </span>
                ?
              </p>
              {deleteConfirm.type === "category" && (
                <div className="timer-card bg-(--error)/5 p-4 border border-(--error)/20">
                  <p className="text-xs text-(--error) font-inter">
                    This will permanently delete this category and all articles
                    within it. This action cannot be undone.
                  </p>
                </div>
              )}
              {deleteConfirm.type === "article" && (
                <div className="timer-card bg-(--error)/5 p-4 border border-(--error)/20">
                  <p className="text-xs text-(--error) font-inter">
                    This will permanently delete this article and all its
                    associated data. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm bg-(--error) hover:bg-(--error)/90 text-white rounded-lg transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="w-full sm:w-auto sm:flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Category Modal Component
function CategoryModal({
  categoryId,
  categories,
  onClose,
}: {
  categoryId: Id<"faqCategories"> | null;
  categories: any[];
  onClose: () => void;
}) {
  const existing = categoryId
    ? categories.find((c) => c._id === categoryId)
    : null;

  const [formData, setFormData] = useState<CategoryFormData>({
    name: existing?.name || "",
    slug: existing?.slug || "",
    description: existing?.description || "",
    icon: existing?.icon || "HelpCircle",
    order: existing?.order ?? categories.length,
    isPublished: existing?.isPublished ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCategory = useMutation(api.faq.createCategory);
  const updateCategory = useMutation(api.faq.updateCategory);

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (categoryId) {
        await updateCategory({ id: categoryId, ...formData });
      } else {
        await createCategory(formData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-(--text-primary) font-statement">
            {categoryId ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
              placeholder="e.g., Getting Started"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
              placeholder="getting-started"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
              rows={3}
              placeholder="Brief description of this category"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
              Icon
            </label>
            <select
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          {/* Order & Published */}
          <div className="timer-card bg-(--surface-elevated) p-4 border border-(--border)">
            <h3 className="text-sm font-medium text-(--text-primary) mb-3 font-statement">
              Display Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                  min={0}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPublished: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-(--border) accent-(--primary)"
                />
                <span className="text-sm text-(--text-primary) font-inter">
                  Published
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : categoryId ? (
                "Save Changes"
              ) : (
                "Create Category"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto sm:flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Article Modal Component
function ArticleModal({
  articleId,
  articles,
  categories,
  defaultCategoryId,
  onClose,
}: {
  articleId: Id<"faqArticles"> | null;
  articles: any[];
  categories: any[];
  defaultCategoryId: Id<"faqCategories"> | null;
  onClose: () => void;
}) {
  const existing = articleId ? articles.find((a) => a._id === articleId) : null;

  const [formData, setFormData] = useState<ArticleFormData>({
    title: existing?.title || "",
    slug: existing?.slug || "",
    summary: existing?.summary || "",
    content: existing?.content || "",
    steps: existing?.steps || [],
    searchTags: existing?.searchTags?.join(", ") || "",
    order: existing?.order ?? articles.length,
    isPublished: existing?.isPublished ?? false,
    isFeatured: existing?.isFeatured ?? false,
  });
  const [categoryId, setCategoryId] = useState<Id<"faqCategories"> | string>(
    existing?.categoryId || defaultCategoryId || categories[0]?._id || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "steps" | "settings">(
    "content",
  );

  const createArticle = useMutation(api.faq.createArticle);
  const updateArticle = useMutation(api.faq.updateArticle);

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    });
  };

  // Step management
  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          stepNumber: formData.steps.length + 1,
          title: "",
          description: "",
          imageUrl: "",
          imageAlt: "",
        },
      ],
    });
  };

  const updateStep = (
    index: number,
    field: keyof StepData,
    value: string | number,
  ) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    setIsSubmitting(true);

    const tags = formData.searchTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const cleanSteps = formData.steps
      .filter((s) => s.title.trim())
      .map((s) => ({
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        ...(s.imageUrl ? { imageUrl: s.imageUrl } : {}),
        ...(s.imageAlt ? { imageAlt: s.imageAlt } : {}),
      }));

    try {
      if (articleId) {
        await updateArticle({
          id: articleId,
          categoryId: categoryId as Id<"faqCategories">,
          title: formData.title,
          slug: formData.slug,
          summary: formData.summary,
          content: formData.content,
          steps: cleanSteps.length > 0 ? cleanSteps : undefined,
          searchTags: tags.length > 0 ? tags : undefined,
          order: formData.order,
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
        });
      } else {
        await createArticle({
          categoryId: categoryId as Id<"faqCategories">,
          title: formData.title,
          slug: formData.slug,
          summary: formData.summary,
          content: formData.content,
          steps: cleanSteps.length > 0 ? cleanSteps : undefined,
          searchTags: tags.length > 0 ? tags : undefined,
          order: formData.order,
          isPublished: formData.isPublished,
          isFeatured: formData.isFeatured,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save article:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="text-xl font-bold text-(--text-primary) font-statement">
            {articleId ? "Edit Article" : "New Article"}
          </h2>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 shrink-0 bg-(--surface-elevated) p-1 rounded-lg border border-(--border)">
          {(["content", "steps", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-inter rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? "bg-(--primary) text-white"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Article stats banner */}
        {articleId && existing && (
          <div className="timer-card bg-(--surface-elevated) p-4 border border-(--border) mb-6 shrink-0">
            <h3 className="text-sm font-medium text-(--text-primary) mb-3 font-statement">
              Article Stats
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-(--text-primary) font-inter">
                  {existing.viewCount || 0}
                </p>
                <p className="text-xs text-(--text-muted) font-inter">
                  Views
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-(--text-primary) font-inter">
                  {(existing.helpfulYes || 0) + (existing.helpfulNo || 0)}
                </p>
                <p className="text-xs text-(--text-muted) font-inter">
                  Feedback
                </p>
              </div>
              <div className="text-center">
                <p
                  className={`text-lg font-bold font-inter ${
                    getHelpfulPercentage(
                      existing.helpfulYes || 0,
                      existing.helpfulNo || 0,
                    ) !== null
                      ? getHelpfulPercentage(
                          existing.helpfulYes || 0,
                          existing.helpfulNo || 0,
                        )! >= 70
                        ? "text-green-500"
                        : getHelpfulPercentage(
                              existing.helpfulYes || 0,
                              existing.helpfulNo || 0,
                            )! < 40
                          ? "text-(--error)"
                          : "text-(--text-primary)"
                      : "text-(--text-muted)"
                  }`}
                >
                  {getHelpfulPercentage(
                    existing.helpfulYes || 0,
                    existing.helpfulNo || 0,
                  ) !== null
                    ? `${getHelpfulPercentage(existing.helpfulYes || 0, existing.helpfulNo || 0)}%`
                    : "—"}
                </p>
                <p className="text-xs text-(--text-muted) font-inter">
                  Helpful
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {/* Content Tab */}
            {activeTab === "content" && (
              <>
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Category
                  </label>
                  <select
                    value={categoryId as string}
                    onChange={(e) => setCategoryId(e.target.value as any)}
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Title / Question
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                    placeholder="e.g., How do I start the timer?"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                    placeholder="how-to-start-timer"
                    required
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Summary (short answer / preview)
                  </label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
                    rows={2}
                    placeholder="Brief answer shown in search results"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Full Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-y min-h-30 transition-all font-inter"
                    rows={6}
                    placeholder="Detailed article content..."
                    required
                  />
                </div>
              </>
            )}

            {/* Steps Tab */}
            {activeTab === "steps" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-(--text-secondary) font-inter">
                    Add step-by-step instructions with optional screenshots.
                  </p>
                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-inter whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step
                  </button>
                </div>

                {formData.steps.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-(--border) rounded-lg">
                    <p className="text-sm text-(--text-muted) font-inter">
                      No steps yet. Click &quot;Add Step&quot; to create a
                      step-by-step guide.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <div
                        key={index}
                        className="timer-card bg-(--surface-elevated) p-4 border border-(--border)"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-semibold text-(--primary) font-statement">
                            Step {step.stepNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="p-1.5 text-(--text-muted) hover:text-(--error) hover:bg-(--error)/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                              Title
                            </label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) =>
                                updateStep(index, "title", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                              placeholder="Step title"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                              Description
                            </label>
                            <textarea
                              value={step.description}
                              onChange={(e) =>
                                updateStep(index, "description", e.target.value)
                              }
                              className="w-full px-4 py-3 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent resize-none transition-all font-inter"
                              rows={2}
                              placeholder="Step description"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-(--text-primary) mb-1.5 font-inter">
                                Image URL (optional)
                              </label>
                              <input
                                type="text"
                                value={step.imageUrl || ""}
                                onChange={(e) =>
                                  updateStep(index, "imageUrl", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                                placeholder="https://..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-(--text-primary) mb-1.5 font-inter">
                                Alt text (optional)
                              </label>
                              <input
                                type="text"
                                value={step.imageAlt || ""}
                                onChange={(e) =>
                                  updateStep(index, "imageAlt", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                                placeholder="Describe the image"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                {/* Search Tags */}
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Search Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.searchTags}
                    onChange={(e) =>
                      setFormData({ ...formData, searchTags: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                    placeholder="timer, solve, start, space bar"
                  />
                </div>

                {/* Display Settings Card */}
                <div className="timer-card bg-(--surface-elevated) p-4 border border-(--border)">
                  <h3 className="text-sm font-medium text-(--text-primary) mb-3 font-statement">
                    Display Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all font-inter"
                        min={0}
                      />
                    </div>

                    <div className="space-y-3 pt-1">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPublished}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isPublished: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-(--border) accent-(--primary)"
                        />
                        <div>
                          <span className="text-sm text-(--text-primary) font-inter">
                            Published
                          </span>
                          <p className="text-xs text-(--text-muted) font-inter">
                            Visible to users on the help center
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isFeatured: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-(--border) accent-(--primary)"
                        />
                        <div>
                          <span className="text-sm text-(--text-primary) font-inter">
                            Featured
                          </span>
                          <p className="text-xs text-(--text-muted) font-inter">
                            Show in Popular Articles section on help center
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row-reverse gap-3 pt-6 mt-4 border-t border-(--border) shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto sm:flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : articleId ? (
                "Save Changes"
              ) : (
                "Create Article"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto sm:flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}