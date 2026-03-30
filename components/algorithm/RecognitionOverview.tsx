"use client";

import { useMemo } from "react";
import { Eye, Zap, Target, TrendingUp } from "lucide-react";

interface RecognitionMetrics {
  totalCases: number;
  mastered: number;
  averageRecognitionTime: number;
  averageExecutionTime: number;
  fastestRecognition: number;
  slowestRecognition: number;
  accuracyRate: number;
  improvementRate: number;
}

interface RecognitionSession {
  _id: string;
  sessionType: "recognition" | "execution" | "drill" | "mixed";
  casesReviewed: number;
  averageRecognitionTime?: number;
  averageExecutionTime?: number;
  accuracyRate: number;
  duration: number;
  createdAt: number;
}

interface RecognitionOverviewProps {
  metrics: RecognitionMetrics;
  recentSessions: RecognitionSession[];
}

interface StatCardProps {
  icon: typeof Eye;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  trend,
}: StatCardProps) {
  return (
    <div className="timer-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <div
            className={`text-xs font-semibold flex items-center gap-1 ${
              trend.isPositive
                ? "text-green-500 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-(--text-primary) font-statement mb-1">
        {value}
      </div>
      <div className="text-sm text-(--text-muted)">{label}</div>
    </div>
  );
}

export default function RecognitionOverview({
  metrics,
  recentSessions,
}: RecognitionOverviewProps) {
  // Calculate trends based on recent sessions
  const trends = useMemo(() => {
    if (recentSessions.length < 2) {
      return { recognitionTrend: 0, accuracyTrend: 0 };
    }

    const recent = recentSessions.slice(0, 5);
    const older = recentSessions.slice(5, 10);

    const avgRecentRecognition =
      recent.reduce((sum, s) => sum + (s.averageRecognitionTime || 0), 0) /
      recent.length;
    const avgOlderRecognition =
      older.length > 0
        ? older.reduce((sum, s) => sum + (s.averageRecognitionTime || 0), 0) /
          older.length
        : avgRecentRecognition;

    const avgRecentAccuracy =
      recent.reduce((sum, s) => sum + s.accuracyRate, 0) / recent.length;
    const avgOlderAccuracy =
      older.length > 0
        ? older.reduce((sum, s) => sum + s.accuracyRate, 0) / older.length
        : avgRecentAccuracy;

    const recognitionTrend =
      avgOlderRecognition > 0
        ? ((avgOlderRecognition - avgRecentRecognition) / avgOlderRecognition) *
          100
        : 0;
    const accuracyTrend = avgRecentAccuracy - avgOlderAccuracy;

    return { recognitionTrend, accuracyTrend };
  }, [recentSessions]);

  const formatTime = (ms: number): string => {
    return (ms / 1000).toFixed(2) + "s";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Eye}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-500 dark:text-blue-400"
        label="Avg Recognition"
        value={formatTime(metrics.averageRecognitionTime)}
        trend={
          trends.recognitionTrend !== 0
            ? {
                value: trends.recognitionTrend,
                isPositive: trends.recognitionTrend > 0,
              }
            : undefined
        }
      />

      <StatCard
        icon={Zap}
        iconBg="bg-green-500/10"
        iconColor="text-green-500 dark:text-green-400"
        label="Best Time"
        value={formatTime(metrics.fastestRecognition)}
      />

      <StatCard
        icon={Target}
        iconBg="bg-purple-500/10"
        iconColor="text-purple-500 dark:text-purple-400"
        label="Accuracy"
        value={`${metrics.accuracyRate.toFixed(0)}%`}
        trend={
          trends.accuracyTrend !== 0
            ? {
                value: trends.accuracyTrend,
                isPositive: trends.accuracyTrend > 0,
              }
            : undefined
        }
      />

      <StatCard
        icon={TrendingUp}
        iconBg="bg-cyan-500/10"
        iconColor="text-cyan-500 dark:text-cyan-400"
        label="Avg Execution"
        value={formatTime(metrics.averageExecutionTime)}
      />
    </div>
  );
}