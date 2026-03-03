import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Public queries

// Get all published FAQ categories with their article counts
export const getPublishedCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("faqCategories")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    // Sort by order
    categories.sort((a, b) => a.order - b.order);

    // Get article counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const articles = await ctx.db
          .query("faqArticles")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();

        const publishedCount = articles.filter((a) => a.isPublished).length;

        return {
          ...category,
          articleCount: publishedCount,
        };
      }),
    );

    return categoriesWithCounts;
  },
});

// Get published articles for a specific category
export const getArticlesByCategory = query({
  args: { categoryId: v.id("faqCategories") },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("faqArticles")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    return articles
      .filter((a) => a.isPublished)
      .sort((a, b) => a.order - b.order);
  },
});

// Get a single article by slug
export const getArticleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("faqArticles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!article || !article.isPublished) return null;

    // Get category info
    const category = await ctx.db.get(article.categoryId);

    return {
      ...article,
      category: category
        ? { name: category.name, slug: category.slug, icon: category.icon }
        : null,
    };
  },
});

// Get category by slug
export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("faqCategories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!category || !category.isPublished) return null;
    return category;
  },
});

// Get featured/popular articles
export const getFeaturedArticles = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("faqArticles")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();

    const publishedFeatured = articles.filter((a) => a.isPublished);

    // Get category info for each
    const withCategories = await Promise.all(
      publishedFeatured.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          category: category
            ? { name: category.name, slug: category.slug, icon: category.icon }
            : null,
        };
      }),
    );

    return withCategories.sort((a, b) => a.order - b.order);
  },
});

// Search articles
export const searchArticles = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];

    const searchTerm = args.query.toLowerCase().trim();

    const allArticles = await ctx.db
      .query("faqArticles")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const results = allArticles.filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(searchTerm);
      const summaryMatch = article.summary.toLowerCase().includes(searchTerm);
      const contentMatch = article.content.toLowerCase().includes(searchTerm);
      const tagMatch = article.searchTags?.some((tag) =>
        tag.toLowerCase().includes(searchTerm),
      );

      return titleMatch || summaryMatch || contentMatch || tagMatch;
    });

    // Get category info
    const withCategories = await Promise.all(
      results.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          category: category
            ? { name: category.name, slug: category.slug, icon: category.icon }
            : null,
        };
      }),
    );

    return withCategories;
  },
});

// Increment article view count
export const incrementViewCount = mutation({
  args: { articleId: v.id("faqArticles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article) return;

    await ctx.db.patch(args.articleId, {
      viewCount: (article.viewCount || 0) + 1,
    });
  },
});

// Submit helpful feedback
export const submitHelpfulFeedback = mutation({
  args: {
    articleId: v.id("faqArticles"),
    helpful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (!article) return;

    if (args.helpful) {
      await ctx.db.patch(args.articleId, {
        helpfulYes: (article.helpfulYes || 0) + 1,
      });
    } else {
      await ctx.db.patch(args.articleId, {
        helpfulNo: (article.helpfulNo || 0) + 1,
      });
    }
  },
});

// Admin queries and mutations

// Get all categories (including unpublished) for admin
export const getAllCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("faqCategories").collect();
    categories.sort((a, b) => a.order - b.order);

    // Get article counts
    const withCounts = await Promise.all(
      categories.map(async (category) => {
        const articles = await ctx.db
          .query("faqArticles")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();
        return {
          ...category,
          articleCount: articles.length,
          publishedArticleCount: articles.filter((a) => a.isPublished).length,
        };
      }),
    );

    return withCounts;
  },
});

// Get all articles for a category (admin - includes unpublished)
export const getAllArticlesByCategory = query({
  args: { categoryId: v.id("faqCategories") },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("faqArticles")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();

    return articles.sort((a, b) => a.order - b.order);
  },
});

// Get all articles (admin)
export const getAllArticles = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db.query("faqArticles").collect();

    const withCategories = await Promise.all(
      articles.map(async (article) => {
        const category = await ctx.db.get(article.categoryId);
        return {
          ...article,
          categoryName: category?.name || "Unknown",
        };
      }),
    );

    return withCategories.sort((a, b) => a.order - b.order);
  },
});

// Create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    order: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("faqCategories", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a category
export const updateCategory = mutation({
  args: {
    id: v.id("faqCategories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete a category (and all its articles)
export const deleteCategory = mutation({
  args: { id: v.id("faqCategories") },
  handler: async (ctx, args) => {
    // Delete all articles in this category
    const articles = await ctx.db
      .query("faqArticles")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect();

    for (const article of articles) {
      await ctx.db.delete(article._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Create a new article
export const createArticle = mutation({
  args: {
    categoryId: v.id("faqCategories"),
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    content: v.string(),
    steps: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          title: v.string(),
          description: v.string(),
          imageUrl: v.optional(v.string()),
          imageAlt: v.optional(v.string()),
        }),
      ),
    ),
    searchTags: v.optional(v.array(v.string())),
    order: v.number(),
    isPublished: v.boolean(),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("faqArticles", {
      ...args,
      viewCount: 0,
      helpfulYes: 0,
      helpfulNo: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an article
export const updateArticle = mutation({
  args: {
    id: v.id("faqArticles"),
    categoryId: v.optional(v.id("faqCategories")),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    summary: v.optional(v.string()),
    content: v.optional(v.string()),
    steps: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          title: v.string(),
          description: v.string(),
          imageUrl: v.optional(v.string()),
          imageAlt: v.optional(v.string()),
        }),
      ),
    ),
    searchTags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete an article
export const deleteArticle = mutation({
  args: { id: v.id("faqArticles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});