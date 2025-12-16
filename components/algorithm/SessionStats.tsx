"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Clock,
  CheckCircle,
  Eye,
} from "lucide-react";

interface PracticeSession {
  _id: string;
  sessionType: "recognition" | "execution" | "drill" | "mixed";
  casesReviewed: number;
  averageRecognitionTime?: number;
  averageExecutionTime?: number;
  accuracyRate: number;
  duration: number;
  createdAt: number;
}

interface SessionStatsProps {
  sessions: PracticeSession[];
}

export default function SessionStats({ sessions }: SessionStatsProps) {
  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalCases: 0,
        totalDuration: 0,
        avgAccuracy: 0,
        avgRecognitionTime: 0,
        recognitionTrend: 0,
        accuracyTrend: 0,
      };
    }

    const totalSessions = sessions.length;
    const totalCases = sessions.reduce((sum, s) => sum + s.casesReviewed, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgAccuracy =
      sessions.reduce((sum, s) => sum + s.accuracyRate, 0) / sessions.length;

    const recognitionSessions = sessions.filter(
      (s) => s.averageRecognitionTime !== undefined
    );
    const avgRecognitionTime =
      recognitionSessions.length > 0
        ? recognitionSessions.reduce(
            (sum, s) => sum + (s.averageRecognitionTime || 0),
            0
          ) / recognitionSessions.length
        : 0;

    // Calculate trends
    let recognitionTrend = 0;
    let accuracyTrend = 0;

    if (sessions.length >= 4) {
      const recent = sessions.slice(0, Math.floor(sessions.length / 2));
      const older = sessions.slice(Math.floor(sessions.length / 2));

      const recentRecognition = recent.filter(
        (s) => s.averageRecognitionTime !== undefined
      );
      const olderRecognition = older.filter(
        (s) => s.averageRecognitionTime !== undefined
      );

      if (recentRecognition.length > 0 && olderRecognition.length > 0) {
        const avgRecentRec =
          recentRecognition.reduce(
            (sum, s) => sum + (s.averageRecognitionTime || 0),
            0
          ) / recentRecognition.length;
        const avgOlderRec =
          olderRecognition.reduce(
            (sum, s) => sum + (s.averageRecognitionTime || 0),
            0
          ) / olderRecognition.length;

        recognitionTrend =
          avgOlderRec > 0
            ? ((avgOlderRec - avgRecentRec) / avgOlderRec) * 100
            : 0;
      }

      const avgRecentAcc =
        recent.reduce((sum, s) => sum + s.accuracyRate, 0) / recent.length;
      const avgOlderAcc =
        older.reduce((sum, s) => sum + s.accuracyRate, 0) / older.length;

      accuracyTrend = avgRecentAcc - avgOlderAcc;
    }

    return {
      totalSessions,
      totalCases,
      totalDuration,
      avgAccuracy,
      avgRecognitionTime,
      recognitionTrend,
      accuracyTrend,
    };
  }, [sessions]);

  const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (ms: number): string => {
    return (ms / 1000).toFixed(2) + "s";
  };

  const getTrendIcon = (trend: number, size = "w-4 h-4") => {
    if (Math.abs(trend) < 1) {
      return <Minus className={size} />;
    }
    return trend > 0 ? (
      <TrendingUp className={size} />
    ) : (
      <TrendingDown className={size} />
    );
  };

  const getTrendColor = (trend: number, higherIsBetter: boolean) => {
    if (Math.abs(trend) < 1) return "text-[var(--text-muted)]";
    const isPositive = higherIsBetter ? trend > 0 : trend < 0;
    return isPositive
      ? "text-green-500 dark:text-green-400"
      : "text-red-500 dark:text-red-400";
  };

  const statItems = [
    {
      icon: BarChart3,
      iconBg: "bg-[var(--primary)]/10",
      iconColor: "text-[var(--primary)]",
      value: stats.totalSessions,
      label: "Total Sessions",
    },
    {
      icon: Eye,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500 dark:text-blue-400",
      value: stats.totalCases,
      label: "Cases Reviewed",
    },
    {
      icon: Clock,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500 dark:text-purple-400",
      value: formatDuration(stats.totalDuration),
      label: "Total Time",
    },
    {
      icon: CheckCircle,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500 dark:text-green-400",
      value: `${stats.avgAccuracy.toFixed(0)}%`,
      label: "Avg Accuracy",
      trend: stats.accuracyTrend,
      trendHigherBetter: true,
    },
  ];

  return (
    <div className="timer-card">
      <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-6">
        Overall Statistics
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-[var(--surface-elevated)]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${item.iconBg}`}>
                <item.icon className={`w-4 h-4 ${item.iconColor}`} />
              </div>
              {item.trend !== undefined && (
                <div
                  className={`flex items-center gap-1 ${getTrendColor(item.trend, item.trendHigherBetter ?? false)}`}
                >
                  {getTrendIcon(item.trend, "w-3 h-3")}
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              {item.value}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {stats.avgRecognitionTime > 0 && (
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-[var(--surface-elevated)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Eye className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              </div>
              <div>
                <div className="text-sm text-[var(--text-muted)]">
                  Avg Recognition Time
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)] font-statement">
                  {formatTime(stats.avgRecognitionTime)}
                </div>
              </div>
            </div>
            {stats.recognitionTrend !== 0 && (
              <div
                className={`flex items-center gap-2 ${getTrendColor(stats.recognitionTrend, false)}`}
              >
                {getTrendIcon(stats.recognitionTrend)}
                <span className="text-sm font-medium">
                  {Math.abs(stats.recognitionTrend).toFixed(0)}% improvement
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}