"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MessageSquare,
  Star,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Calendar,
  ThumbsUp,
  User,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Users,
  Percent,
  Clock,
  FileText,
} from "lucide-react";

// Export helper function
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value ?? "");
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.json`;
  link.click();
}

// CollapsibleCard Component
function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
  storageKey,
  headerExtra,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  headerExtra?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : defaultOpen;
    }
    return defaultOpen;
  });

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== "undefined" && storageKey) {
      localStorage.setItem(storageKey, String(newState));
    }
  };

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleOpen}
          className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            {title}
          </h3>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div className="flex items-center gap-2">
          {headerExtra}
          <button
            onClick={toggleOpen}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
          >
            {isOpen ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      {isOpen && children}
    </div>
  );
}

// StatCard Component
function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-[var(--primary)]",
  iconBgColor = "bg-[var(--primary)]/10",
  subValue,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBgColor?: string;
  subValue?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg shrink-0`}>
          <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate font-inter">
            {title}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            {trend && (
              <div
                className={`flex items-center gap-0.5 text-xs ${
                  trend.value >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {subValue && (
            <div className="text-xs text-[var(--text-muted)] font-inter">
              {subValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// NPS Gauge Component
function NPSGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 50) return "var(--success)";
    if (score >= 0) return "var(--warning)";
    return "var(--error)";
  };

  const getLabel = () => {
    if (score >= 50) return "Excellent";
    if (score >= 0) return "Good";
    return "Needs Improvement";
  };

  return (
    <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
        Net Promoter Score
      </div>
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 shrink-0">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--surface)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={getColor()}
              strokeWidth="8"
              strokeDasharray={`${((score + 100) / 200) * 251.2} 251.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement">
              {score}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-statement truncate">
            {getLabel()}
          </p>
          <p className="text-xs text-[var(--text-muted)] font-inter">
            Range: -100 to 100
          </p>
        </div>
      </div>
    </div>
  );
}

// Feature Rating Bar
function FeatureRatingBar({
  feature,
  rating,
}: {
  feature: string;
  rating: number;
}) {
  const formatFeatureName = (name: string) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-[var(--text-secondary)] font-inter truncate">
        {formatFeatureName(feature)}
      </span>
      <div className="flex-1 h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-all"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
      <span className="w-10 text-sm font-medium text-[var(--text-primary)] font-inter text-right">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// Feedback Response Item
function FeedbackItem({
  feedback,
  isExpanded,
  onToggle,
}: {
  feedback: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-[var(--warning)] fill-[var(--warning)]" : "text-[var(--text-muted)]"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="timer-card !p-0 overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--surface-elevated)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-inter">
              {feedback.surveyType || "general"}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-inter">
              v{feedback.surveyVersion || "1.0"}
            </span>
          </div>
          {feedback.uiuxRating && renderStars(feedback.uiuxRating)}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)] font-inter hidden sm:inline">
            {formatDate(feedback.createdAt)}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] space-y-4">
          {/* Ratings Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {feedback.uiuxRating && (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-muted)] font-inter mb-1">
                  UI/UX Rating
                </p>
                <div className="flex items-center gap-2">
                  {renderStars(feedback.uiuxRating)}
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {feedback.uiuxRating}/5
                  </span>
                </div>
              </div>
            )}
            {feedback.recommendScore && (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-muted)] font-inter mb-1">
                  Recommend Score
                </p>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {feedback.recommendScore}/10
                  </span>
                </div>
              </div>
            )}
            {feedback.userId && (
              <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
                <p className="text-xs text-[var(--text-muted)] font-inter mb-1">
                  Submitted by
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    Registered User
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Feature Ratings */}
          {feedback.featureRatings &&
            Object.keys(feedback.featureRatings).length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] font-inter mb-2">
                  Feature Ratings
                </p>
                <div className="bg-[var(--surface-elevated)] rounded-lg p-3 space-y-2">
                  {Object.entries(feedback.featureRatings).map(
                    ([feature, rating]) => (
                      <FeatureRatingBar
                        key={feature}
                        feature={feature}
                        rating={rating as number}
                      />
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Most Useful Feature */}
          {feedback.mostUsefulFeature && (
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] font-inter mb-1">
                Most Useful Feature
              </p>
              <p className="text-sm text-[var(--text-primary)] font-inter bg-[var(--surface-elevated)] rounded-lg p-3">
                {feedback.mostUsefulFeature}
              </p>
            </div>
          )}

          {/* Feature Requests */}
          {feedback.featureRequests && (
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] font-inter mb-1">
                Feature Requests
              </p>
              <p className="text-sm text-[var(--text-primary)] font-inter bg-[var(--surface-elevated)] rounded-lg p-3 whitespace-pre-wrap">
                {feedback.featureRequests}
              </p>
            </div>
          )}

          {/* Additional Comments */}
          {feedback.additionalComments && (
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)] font-inter mb-1">
                Additional Comments
              </p>
              <p className="text-sm text-[var(--text-primary)] font-inter bg-[var(--surface-elevated)] rounded-lg p-3 whitespace-pre-wrap">
                {feedback.additionalComments}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] font-inter pt-2 border-t border-[var(--border)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(feedback.createdAt)}
            </span>
            {feedback.userAgent && (
              <span className="truncate max-w-xs hidden sm:inline">
                {feedback.userAgent}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Bar Chart Component for response trends
function ResponseBarChart({
  data,
}: {
  data: Array<{ label: string; value: number; avgRating?: number }>;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24 sm:h-32">
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-[var(--primary)] rounded-t transition-all duration-500 min-h-[4px]"
            style={{
              height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
            }}
          />
          <span className="text-[10px] text-[var(--text-muted)] font-inter truncate max-w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Rating Distribution Component
function RatingDistribution({
  distribution,
  maxRating,
}: {
  distribution: Record<number, number>;
  maxRating: number;
}) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-2">
      {Array.from({ length: maxRating }, (_, i) => maxRating - i).map(
        (rating) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-inter w-6 text-right">
              {rating}
            </span>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                style={{
                  width: `${maxCount > 0 ? ((distribution[rating] || 0) / maxCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-inter w-8 text-right">
              {distribution[rating] || 0}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-inter w-10 text-right">
              {total > 0
                ? (((distribution[rating] || 0) / total) * 100).toFixed(0)
                : 0}
              %
            </span>
          </div>
        ),
      )}
    </div>
  );
}

// NPS Breakdown Component
function NPSBreakdown({
  breakdown,
}: {
  breakdown: { promoters: number; passives: number; detractors: number };
}) {
  const total = breakdown.promoters + breakdown.passives + breakdown.detractors;
  const items = [
    {
      label: "Promoters (9-10)",
      value: breakdown.promoters,
      color: "bg-green-500",
    },
    {
      label: "Passives (7-8)",
      value: breakdown.passives,
      color: "bg-amber-500",
    },
    {
      label: "Detractors (1-6)",
      value: breakdown.detractors,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-[var(--surface)]">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`${item.color} transition-all duration-500`}
            style={{
              width: total > 0 ? `${(item.value / total) * 100}%` : "0%",
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-lg font-bold text-[var(--text-primary)] font-statement">
                {item.value}
              </span>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-inter">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminFeedback() {
  const [surveyTypeFilter, setSurveyTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const feedbackStats = useQuery(api.feedbackResponses.getFeedbackStats, {
    surveyType: surveyTypeFilter !== "all" ? surveyTypeFilter : undefined,
  });

  const detailedStats = useQuery(
    api.feedbackResponses.getDetailedFeedbackStats,
    {
      surveyType: surveyTypeFilter !== "all" ? surveyTypeFilter : undefined,
    },
  );

  const feedbackList = useQuery(api.feedbackResponses.getAllFeedback, {
    surveyType: surveyTypeFilter !== "all" ? surveyTypeFilter : undefined,
    limit: 50,
  });

  const surveyTypes = useQuery(api.feedbackResponses.getSurveyTypes);

  const isLoading = feedbackStats === undefined || feedbackList === undefined;

  const handleExportStats = () => {
    if (detailedStats) {
      exportToJSON(detailedStats, "feedback_analytics");
    }
  };

  const handleExportFeedback = () => {
    if (!feedbackList || feedbackList.length === 0) return;

    const exportData = feedbackList.map((f) => ({
      type: f.surveyType || "general",
      version: f.surveyVersion || "1.0",
      uiuxRating: f.uiuxRating || "",
      recommendScore: f.recommendScore || "",
      mostUsefulFeature: f.mostUsefulFeature || "",
      featureRequests: f.featureRequests || "",
      additionalComments: f.additionalComments || "",
      createdAt: new Date(f.createdAt).toISOString(),
      hasUser: f.userId ? "Yes" : "No",
    }));

    exportToCSV(exportData, "feedback_responses");
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Filter */}
      <div className="timer-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)] font-inter">
              Survey Type:
            </span>
            <select
              value={surveyTypeFilter}
              onChange={(e) => setSurveyTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] font-inter focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All Types</option>
              {surveyTypes?.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportStats}
            disabled={!detailedStats}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Analytics
          </button>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <CollapsibleCard
        title="Overview Statistics"
        defaultOpen={true}
        storageKey="admin-feedback-stats-open"
      >
        <div className="space-y-4">
          {/* Primary Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)] animate-pulse"
                >
                  <div className="h-4 w-24 bg-[var(--surface)] rounded mb-2" />
                  <div className="h-8 w-16 bg-[var(--surface)] rounded" />
                </div>
              ))
            ) : (
              <>
                <StatCard
                  title="Total Responses"
                  value={feedbackStats.totalResponses}
                  icon={MessageSquare}
                  iconColor="text-blue-500"
                  iconBgColor="bg-blue-500/10"
                />
                <StatCard
                  title="Avg UI/UX Rating"
                  value={`${feedbackStats.averageUiuxRating}/5`}
                  icon={Star}
                  iconColor="text-amber-500"
                  iconBgColor="bg-amber-500/10"
                />
                <StatCard
                  title="Avg Recommend Score"
                  value={`${feedbackStats.averageRecommendScore}/10`}
                  icon={ThumbsUp}
                  iconColor="text-green-500"
                  iconBgColor="bg-green-500/10"
                />
                <NPSGauge score={feedbackStats.npsScore} />
              </>
            )}
          </div>

          {/* Secondary Stats Row */}
          {detailedStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                title="This Week"
                value={detailedStats.responsesThisWeek}
                icon={TrendingUp}
                iconColor="text-green-500"
                iconBgColor="bg-green-500/10"
                trend={{
                  value: detailedStats.responseRate.weekly,
                  label: "vs last week",
                }}
              />
              <StatCard
                title="This Month"
                value={detailedStats.responsesThisMonth}
                icon={TrendingUp}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
                trend={{
                  value: detailedStats.responseRate.monthly,
                  label: "vs last month",
                }}
              />
              <StatCard
                title="With Comments"
                value={detailedStats.responsesWithComments}
                icon={FileText}
                iconColor="text-purple-500"
                iconBgColor="bg-purple-500/10"
                subValue={`${detailedStats.totalResponses > 0 ? ((detailedStats.responsesWithComments / detailedStats.totalResponses) * 100).toFixed(0) : 0}% of total`}
              />
              <StatCard
                title="Logged In Users"
                value={detailedStats.loggedInResponses ?? 0}
                icon={Users}
                iconColor="text-cyan-500"
                iconBgColor="bg-cyan-500/10"
                subValue={`${detailedStats.anonymousResponses ?? 0} anonymous`}
              />
            </div>
          )}
        </div>
      </CollapsibleCard>

      {/* Analytics Grid */}
      {detailedStats && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Response Trend */}
          <CollapsibleCard
            title="Weekly Response Trend"
            defaultOpen={true}
            storageKey="admin-feedback-trend-open"
          >
            <ResponseBarChart
              data={detailedStats.weeklyTrend.map((w) => ({
                label: w.week,
                value: w.count,
                avgRating: w.avgRating,
              }))}
            />
          </CollapsibleCard>

          {/* NPS Breakdown */}
          <CollapsibleCard
            title="NPS Breakdown"
            defaultOpen={true}
            storageKey="admin-feedback-nps-breakdown-open"
          >
            <NPSBreakdown breakdown={detailedStats.npsBreakdown} />
          </CollapsibleCard>
        </div>
      )}

      {/* Rating Distributions */}
      {detailedStats && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* UI/UX Rating Distribution */}
          <CollapsibleCard
            title="UI/UX Rating Distribution"
            defaultOpen={true}
            storageKey="admin-feedback-uiux-dist-open"
          >
            <RatingDistribution
              distribution={detailedStats.uiuxRatingDistribution}
              maxRating={5}
            />
          </CollapsibleCard>

          {/* Survey Types Breakdown */}
          <CollapsibleCard
            title="Survey Type Breakdown"
            defaultOpen={true}
            storageKey="admin-feedback-survey-types-open"
          >
            <div className="space-y-2">
              {Object.entries(detailedStats.surveyTypeBreakdown).map(
                ([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-secondary)] font-inter w-24 truncate capitalize">
                      {type}
                    </span>
                    <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                        style={{
                          width: `${detailedStats.totalResponses > 0 ? ((count as number) / detailedStats.totalResponses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-primary)] font-inter w-10 text-right">
                      {count as number}
                    </span>
                  </div>
                ),
              )}
            </div>
          </CollapsibleCard>
        </div>
      )}

      {/* Most Useful Features */}
      {detailedStats && detailedStats.mostUsefulFeatures.length > 0 && (
        <div className="mt-6">
          <CollapsibleCard
            title="Most Mentioned Features"
            defaultOpen={true}
            storageKey="admin-feedback-useful-features-open"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {detailedStats.mostUsefulFeatures.slice(0, 9).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[var(--surface-elevated)] rounded-lg p-2.5 border border-[var(--border)]"
                >
                  <span className="text-sm text-[var(--text-secondary)] font-inter truncate capitalize">
                    {item.feature}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] font-statement ml-2">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        </div>
      )}

      {/* Feature Ratings Overview */}
      {!isLoading &&
        feedbackStats.featureAverages &&
        Object.keys(feedbackStats.featureAverages).length > 0 && (
          <div className="mt-6">
            <CollapsibleCard
              title="Feature Ratings Overview"
              defaultOpen={true}
              storageKey="admin-feedback-feature-ratings-open"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(feedbackStats.featureAverages).map(
                  ([feature, rating]) => (
                    <FeatureRatingBar
                      key={feature}
                      feature={feature}
                      rating={rating as number}
                    />
                  ),
                )}
              </div>
            </CollapsibleCard>
          </div>
        )}

      {/* Feedback List */}
      <div className="mt-6">
        <CollapsibleCard
          title="Recent Submissions"
          defaultOpen={true}
          storageKey="admin-feedback-submissions-open"
          headerExtra={
            <button
              onClick={handleExportFeedback}
              disabled={!feedbackList || feedbackList.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-md text-[var(--text-secondary)] transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export feedback as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          }
        >
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="timer-card animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
                    <div className="h-4 w-24 bg-[var(--surface-elevated)] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] font-inter">
                No feedback submissions yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackList.map((feedback) => (
                <FeedbackItem
                  key={feedback._id}
                  feedback={feedback}
                  isExpanded={expandedId === feedback._id}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === feedback._id ? null : feedback._id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </CollapsibleCard>
      </div>
    </div>
  );
}
